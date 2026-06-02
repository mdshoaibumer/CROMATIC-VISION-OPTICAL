import { test, expect } from '@playwright/test';
import { clearTestUser, clearTestOrders, setTestAdmin, getSeededProductId } from './helpers/db';
const customerPassword = 'Customer123!';

// TODO: Re-enable once admin order management endpoints are stable
test.describe.skip('Suite 13: Admin Order Management', () => {
  test.beforeAll(async ({ request }) => {
    // Setup admin user
    await clearTestUser(adminEmail);
    await request.post('/api/v1/auth/register', {
      data: { name: 'Order Admin', email: adminEmail, phone: '9990002222', password: adminPassword },
    });
    await setTestAdmin(adminEmail);

    // Setup customer user
    await clearTestOrders(customerEmail);
    await clearTestUser(customerEmail);
    await request.post('/api/v1/auth/register', {
      data: { name: 'Order Customer', email: customerEmail, phone: '9990003333', password: customerPassword },
    });
  });

  test.afterAll(async () => {
    await clearTestOrders(customerEmail);
    await clearTestUser(customerEmail);
    await clearTestUser(adminEmail);
  });

  let adminCookie: string;

  test.beforeEach(async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: adminEmail, password: adminPassword },
    });
    expect(loginRes.status()).toBe(200);
    adminCookie = loginRes.headers()['set-cookie'] || '';
  });

  test('Admin can list all orders', async ({ request }) => {
    const res = await request.get('/api/v1/admin/orders?page=1&limit=10', {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test('Admin can view order details by ID', async ({ request }) => {
    // List orders first to get an ID
    const listRes = await request.get('/api/v1/admin/orders?page=1&limit=1', {
      headers: { Cookie: adminCookie },
    });
    const listBody = await listRes.json();

    if (listBody.data && listBody.data.orders && listBody.data.orders.length > 0) {
      const orderId = listBody.data.orders[0].id;
      const detailRes = await request.get(`/api/v1/admin/orders/${orderId}`, {
        headers: { Cookie: adminCookie },
      });
      expect(detailRes.status()).toBe(200);
      const detail = await detailRes.json();
      expect(detail.success).toBe(true);
      expect(detail.data.id).toBe(orderId);
    }
  });

  test('Admin can update order status (pending → processing)', async ({ request }) => {
    const listRes = await request.get('/api/v1/admin/orders?page=1&limit=5', {
      headers: { Cookie: adminCookie },
    });
    const listBody = await listRes.json();

    if (listBody.data && listBody.data.orders && listBody.data.orders.length > 0) {
      const order = listBody.data.orders.find((o: any) => o.status === 'pending');
      if (order) {
        const updateRes = await request.put(`/api/v1/admin/orders/${order.id}/status`, {
          headers: { Cookie: adminCookie },
          data: { status: 'processing' },
        });
        expect(updateRes.status()).toBe(200);
        const updated = await updateRes.json();
        expect(updated.data.status).toBe('processing');
      }
    }
  });

  test('Invalid status transition returns 400', async ({ request }) => {
    const listRes = await request.get('/api/v1/admin/orders?page=1&limit=1', {
      headers: { Cookie: adminCookie },
    });
    const listBody = await listRes.json();

    if (listBody.data && listBody.data.orders && listBody.data.orders.length > 0) {
      const orderId = listBody.data.orders[0].id;
      const res = await request.put(`/api/v1/admin/orders/${orderId}/status`, {
        headers: { Cookie: adminCookie },
        data: { status: 'invalid_status_xyz' },
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  test('Non-existent order returns 404', async ({ request }) => {
    const res = await request.get('/api/v1/admin/orders/999999', {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  test('Unauthenticated user cannot access admin orders', async ({ request }) => {
    const res = await request.get('/api/v1/admin/orders');
    expect([401, 403]).toContain(res.status());
  });

  test('Admin orders UI navigation', async ({ page }) => {
    await page.goto('/?view=admin');
    await page.getByPlaceholder(/Email/i).fill(adminEmail);
    await page.getByPlaceholder(/Password/i).fill(adminPassword);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForTimeout(1500);

    // Navigate to Orders module
    await page.getByRole('button', { name: /Orders|Sales/i }).first().click();
    await page.waitForTimeout(500);

    // Should see orders table or empty state
    const content = page.locator('main, [role="main"], .content');
    await expect(content).toBeVisible();
  });
});


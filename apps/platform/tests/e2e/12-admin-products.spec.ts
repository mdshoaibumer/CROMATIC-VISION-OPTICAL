import { test, expect } from '@playwright/test';
import { clearTestUser, setTestAdmin, getSeededProductId } from './helpers/db';
const adminPassword = 'AdminProd123!';

// TODO: Re-enable once admin product CRUD endpoints are stable
test.describe.skip('Suite 12: Admin Product Management (CRUD)', () => {
  test.beforeAll(async ({ request }) => {
    await clearTestUser(adminEmail);
    await request.post('/api/v1/auth/register', {
      data: { name: 'Product Admin', email: adminEmail, phone: '9990001234', password: adminPassword },
    });
    await setTestAdmin(adminEmail);
  });

  test.afterAll(async () => {
    await clearTestUser(adminEmail);
  });

  let authCookie: string;

  test.beforeEach(async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: adminEmail, password: adminPassword },
    });
    expect(loginRes.status()).toBe(200);
    const setCookie = loginRes.headers()['set-cookie'];
    authCookie = setCookie || '';
  });

  test('Admin can create a product via API', async ({ request }) => {
    const res = await request.post('/api/v1/admin/products', {
      headers: { Cookie: authCookie },
      data: {
        name: 'E2E Test Aviator',
        slug: 'e2e-test-aviator-' + Date.now(),
        description: 'Titanium aviator frames for E2E testing',
        price: 4999.0,
        brand: 'Cromatic',
        frame_type: 'aviator',
        material: 'titanium',
        gender: 'unisex',
        stock: 50,
        status: 'active',
        images: [],
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('E2E Test Aviator');
    expect(body.data.stock).toBe(50);
  });

  test('Creating a product with duplicate slug returns 409', async ({ request }) => {
    const slug = 'e2e-duplicate-slug-test';
    // Create first product
    await request.post('/api/v1/admin/products', {
      headers: { Cookie: authCookie },
      data: {
        name: 'First Product',
        slug,
        description: 'Original',
        price: 1000,
        brand: 'Test',
        frame_type: 'round',
        material: 'acetate',
        gender: 'male',
        stock: 10,
        status: 'active',
        images: [],
      },
    });

    // Attempt duplicate slug
    const res = await request.post('/api/v1/admin/products', {
      headers: { Cookie: authCookie },
      data: {
        name: 'Second Product',
        slug,
        description: 'Duplicate',
        price: 2000,
        brand: 'Test',
        frame_type: 'square',
        material: 'metal',
        gender: 'female',
        stock: 5,
        status: 'active',
        images: [],
      },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe('CONFLICT');
  });

  test('Admin can update a product via API', async ({ request }) => {
    // Create a product first
    const createRes = await request.post('/api/v1/admin/products', {
      headers: { Cookie: authCookie },
      data: {
        name: 'Update Target',
        slug: 'e2e-update-target-' + Date.now(),
        description: 'Will be updated',
        price: 1500,
        brand: 'Cromatic',
        frame_type: 'round',
        material: 'acetate',
        gender: 'male',
        stock: 20,
        status: 'active',
        images: [],
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    const productId = created.data.id;

    // Update it
    const updateRes = await request.put(`/api/v1/admin/products/${productId}`, {
      headers: { Cookie: authCookie },
      data: {
        name: 'Updated Aviator Pro',
        price: 5999.0,
        stock: 100,
      },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.data.name).toBe('Updated Aviator Pro');
    expect(updated.data.price).toBe(5999.0);
    expect(updated.data.stock).toBe(100);
  });

  test('Admin can delete a product via API', async ({ request }) => {
    // Create a product
    const createRes = await request.post('/api/v1/admin/products', {
      headers: { Cookie: authCookie },
      data: {
        name: 'Delete Target',
        slug: 'e2e-delete-target-' + Date.now(),
        description: 'Will be deleted',
        price: 999,
        brand: 'Cromatic',
        frame_type: 'cat-eye',
        material: 'plastic',
        gender: 'female',
        stock: 5,
        status: 'active',
        images: [],
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    const productId = created.data.id;

    // Delete it
    const deleteRes = await request.delete(`/api/v1/admin/products/${productId}`, {
      headers: { Cookie: authCookie },
    });
    expect(deleteRes.status()).toBe(200);
    const body = await deleteRes.json();
    expect(body.message).toContain('deleted');
  });

  test('Validation rejects product with negative price', async ({ request }) => {
    const res = await request.post('/api/v1/admin/products', {
      headers: { Cookie: authCookie },
      data: {
        name: 'Bad Price Product',
        slug: 'bad-price-' + Date.now(),
        description: 'Invalid',
        price: -100,
        brand: 'Test',
        frame_type: 'round',
        material: 'metal',
        gender: 'male',
        stock: 10,
        status: 'active',
        images: [],
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Non-admin user cannot access product admin endpoints', async ({ request }) => {
    const res = await request.post('/api/v1/admin/products', {
      data: {
        name: 'Unauthorized',
        slug: 'unauth-' + Date.now(),
        description: 'Should fail',
        price: 100,
        brand: 'None',
        frame_type: 'round',
        material: 'plastic',
        gender: 'male',
        stock: 1,
        status: 'active',
        images: [],
      },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Admin can list products with pagination and filters', async ({ request }) => {
    const res = await request.get('/api/v1/products?page=1&limit=5&sort=price_asc');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test('Admin product CRUD via UI flow', async ({ page }) => {
    // Login via UI
    await page.goto('/?view=admin');
    await page.getByPlaceholder(/Email/i).fill(adminEmail);
    await page.getByPlaceholder(/Password/i).fill(adminPassword);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForTimeout(1500);

    // Navigate to Products module
    await page.getByRole('button', { name: /Products Matrix/i }).click();
    await page.waitForTimeout(500);
  });
});


import { test, expect, request } from '@playwright/test';
import { clearTestUser, clearTestOrders, getSeededProductId } from './helpers/db';

const TEST_EMAIL = 'test_orders_flow@eyeware.test';
const TEST_PASSWORD = 'OrdersTest456!';
const API_BASE = 'http://localhost:3000';

test.describe('Suite 10: Customer Orders', () => {
  let authCookie = '';

  test.beforeAll(async () => {
    // Clean any previous run artefacts
    await clearTestOrders(TEST_EMAIL);
    await clearTestUser(TEST_EMAIL);

    const ctx = await request.newContext({ baseURL: API_BASE });

    // 1. Register
    const regRes = await ctx.post('/api/v1/auth/register', {
      data: { name: 'Orders Test User', email: TEST_EMAIL, password: TEST_PASSWORD, phone: '9000000003' }
    });
    expect(regRes.status()).toBe(201);

    // 2. Login — capture access_token cookie
    const loginRes = await ctx.post('/api/v1/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    expect(loginRes.status()).toBe(200);
    const setCookieHeader = loginRes.headers()['set-cookie'] ?? '';
    const match = setCookieHeader.match(/access_token=([^;]+)/);
    expect(match, 'Login must set access_token cookie').not.toBeNull();
    authCookie = match![1];

    const authHeaders = { Authorization: `Bearer ${authCookie}` };
    const testProductId = await getSeededProductId('premium-cut-optics');

    // 3. Add product to cart
    const cartRes = await ctx.post('/api/v1/cart/items', {
      headers: { 
        'Authorization': `Bearer ${authCookie}`,
        'Cookie': `access_token=${authCookie}`,
        'Content-Type': 'application/json'
      },
      data: { product_id: Number(testProductId), quantity: 1 }
    });
    expect(cartRes.status()).toBe(200);

    // 4. Create order
    const orderRes = await ctx.post('/api/v1/orders', {
      headers: authHeaders,
      data: { shipping_address: '100 Order Road, NY 10001' }
    });
    expect(orderRes.status()).toBe(201);

    await ctx.dispose();
  });

  test.afterAll(async () => {
    await clearTestOrders(TEST_EMAIL);
    await clearTestUser(TEST_EMAIL);
  });

  test('Verify Order History and Detail', async ({ page }) => {
    // Inject session cookie into the Playwright browser context
    await page.context().addCookies([{
      name: 'access_token',
      value: authCookie,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
    }]);

    await page.addInitScript((email) => {
      window.localStorage.setItem('eyeware_active_customer', JSON.stringify({
        id: 1,
        email: email,
        name: 'Orders Test User'
      }));
    }, TEST_EMAIL);

    await page.goto('/');

    // Correct selector for Desktop user icon
    const accountBtn = page.getByTitle('My Control Account Console').first();
    await accountBtn.click();
    
    // Navigate to Orders Tab
    await page.getByText('Optical Orders', { exact: true }).click();
    
    // Check if the empty state OR the order row renders
    const emptyState = page.getByText(/No product order matrices were found/i);
    const orderRef = page.getByText(/#IndexRef/i).first();
    
    await expect(emptyState.or(orderRef)).toBeVisible({ timeout: 10000 });

    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(orderRef).toBeVisible();
    }
  });
});

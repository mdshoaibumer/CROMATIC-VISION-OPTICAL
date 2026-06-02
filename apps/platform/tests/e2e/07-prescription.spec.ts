import { test, expect, request } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { clearTestUser, clearTestOrders, getFirstOrderForUser, getSeededProductId } from './helpers/db';

// ============================================================================
// Suite 7: Prescription Upload
// Tests the full multipart file upload flow against the real API.
// Strategy:
//   1. Register + Login via API (not UI) to obtain an HttpOnly auth cookie.
//   2. Create an order via API so we have a valid order_id for the upload.
//   3. Upload a real JPEG fixture file via the multipart prescription endpoint.
//   4. Verify the API returns 201 with a prescription record in UPLOADED status.
//   5. Verify the UI reflects the new upload in the Account > Prescriptions tab.
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_EMAIL = 'test_prescription_upload@eyeware.test';
const TEST_PASSWORD = 'PrescriptionTest123!';
const API_BASE = 'http://localhost:3000';
const FIXTURE_PATH = path.resolve(__dirname, '../fixtures/sample_prescription.jpg');

test.describe('Suite 7: Prescription Upload', () => {
  let authCookie = '';
  let orderId = 0;

  test.beforeAll(async () => {
    // Step 1 — Clean slate
    await clearTestOrders(TEST_EMAIL);
    await clearTestUser(TEST_EMAIL);

    const ctx = await request.newContext({ baseURL: API_BASE });

    // Step 2 — Register
    const regRes = await ctx.post('/api/v1/auth/register', {
      data: { name: 'Rx Upload Test', email: TEST_EMAIL, password: TEST_PASSWORD, phone: '9000000001' }
    });
    expect(regRes.status()).toBe(201);

    // Step 3 — Login and capture the HttpOnly access_token cookie value
    const loginRes = await ctx.post('/api/v1/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    expect(loginRes.status()).toBe(200);

    // Extract the access_token from Set-Cookie header
    const setCookieHeader = loginRes.headers()['set-cookie'] ?? '';
    const match = setCookieHeader.match(/access_token=([^;]+)/);
    expect(match, 'Login must set access_token cookie').not.toBeNull();
    authCookie = match![1];

    const testProductId = await getSeededProductId('premium-cut-optics');

    // Step 4 — Seed a product into the cart and create an order
    // Add seeded product to cart
    const cartRes = await ctx.post('/api/v1/cart/items', {
      headers: { 
        'Authorization': `Bearer ${authCookie}`,
        'Cookie': `access_token=${authCookie}`,
        'Content-Type': 'application/json'
      },
      data: { product_id: Number(testProductId), quantity: 1 }
    });
    expect(cartRes.status()).toBe(200);

    // Place an order
    const orderRes = await ctx.post('/api/v1/orders', {
      headers: { Authorization: `Bearer ${authCookie}` },
      data: { shipping_address: '1 Optic Lane, Vision City, CA 90210' }
    });
    expect(orderRes.status()).toBe(201);
    const orderBody = await orderRes.json();
    orderId = orderBody.data.id;
    expect(orderId).toBeGreaterThan(0);

    await ctx.dispose();
  });

  test.afterAll(async () => {
    await clearTestOrders(TEST_EMAIL);
    await clearTestUser(TEST_EMAIL);
  });

  // --------------------------------------------------------------------------
  // API-level test: upload via direct multipart POST
  // --------------------------------------------------------------------------
  test('API: Customer can upload a prescription file and receive a record', async ({ request }) => {
    const uploadRes = await request.post(`${API_BASE}/api/v1/prescriptions`, {
      headers: { Authorization: `Bearer ${authCookie}` },
      multipart: {
        order_id: String(orderId),
        prescription_type: 'SINGLE_VISION',
        notes: 'E2E automated prescription upload test',
        file: {
          name: 'sample_prescription.jpg',
          mimeType: 'image/jpeg',
          buffer: fs.readFileSync(FIXTURE_PATH),
        },
      },
    });

    expect(uploadRes.status()).toBe(201);
    const body = await uploadRes.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      prescription_type: 'SINGLE_VISION',
      status: 'UPLOADED',
    });
    expect(body.data.id).toBeGreaterThan(0);
    expect(body.data.file_url).toBeTruthy();
  });

  // --------------------------------------------------------------------------
  // API-level test: validation rejects missing prescription_type
  // --------------------------------------------------------------------------
  test('API: Upload without prescription_type returns 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/prescriptions`, {
      headers: { Authorization: `Bearer ${authCookie}` },
      multipart: {
        order_id: String(orderId),
        // prescription_type intentionally omitted
        file: {
          name: 'sample_prescription.jpg',
          mimeType: 'image/jpeg',
          buffer: fs.readFileSync(FIXTURE_PATH),
        },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  // --------------------------------------------------------------------------
  // API-level test: unauthenticated upload is rejected
  // --------------------------------------------------------------------------
  test('API: Upload without auth token returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/prescriptions`, {
      multipart: {
        order_id: String(orderId),
        prescription_type: 'SINGLE_VISION',
        file: {
          name: 'sample_prescription.jpg',
          mimeType: 'image/jpeg',
          buffer: fs.readFileSync(FIXTURE_PATH),
        },
      },
    });
    expect(res.status()).toBe(401);
  });

  // --------------------------------------------------------------------------
  // UI-level test: Prescriptions tab shows upload interface when logged in
  // --------------------------------------------------------------------------
  test('UI: Account Prescriptions tab renders the upload interface', async ({ page }) => {
    // Inject the auth cookie so Playwright's browser session is authenticated
    await page.context().addCookies([{
      name: 'access_token',
      value: authCookie,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,   // localhost doesn't use HTTPS in dev
    }]);

    await page.addInitScript((email) => {
      window.localStorage.setItem('eyeware_active_customer', JSON.stringify({
        id: 1,
        email: email,
        name: 'Rx Upload Test'
      }));
    }, TEST_EMAIL);

    await page.goto('/');

    // Navigate to Account > Prescriptions
    const accountBtn = page.getByTitle('My Control Account Console').first();
    await accountBtn.click();
    await page.getByText('Prescriptions', { exact: true }).click();

    // The upload drop-zone or "Upload New Rx" button must be visible
    const uploadTrigger = page.getByText('Upload New Rx').first();
    await expect(uploadTrigger).toBeVisible({ timeout: 8000 });
  });
});

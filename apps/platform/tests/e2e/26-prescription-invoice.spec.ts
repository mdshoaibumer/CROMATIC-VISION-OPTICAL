import { test, expect } from '@playwright/test';
import { clearTestUser, clearTestOrders } from './helpers/db';

const customerEmail = 'prescription_upload_e2e@cromaticvision.com';
const customerPassword = 'RxUpload123!';

test.describe('Suite 26: Prescription Upload & Invoice Download', () => {
  test.beforeAll(async ({ request }) => {
    await clearTestOrders(customerEmail);
    await clearTestUser(customerEmail);
    await request.post('/api/v1/auth/register', {
      data: { name: 'Rx Customer', email: customerEmail, phone: '9990008888', password: customerPassword },
    });
  });

  test.afterAll(async () => {
    await clearTestOrders(customerEmail);
    await clearTestUser(customerEmail);
  });

  let authCookie: string;

  test.beforeEach(async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: customerEmail, password: customerPassword },
    });
    expect(loginRes.status()).toBe(200);
    authCookie = loginRes.headers()['set-cookie'] || '';
  });

  // --- Prescription Upload Tests ---

  test('Prescription upload requires authentication', async ({ request }) => {
    const res = await request.post('/api/v1/prescriptions', {
      multipart: {
        order_id: '1',
        prescription_type: 'single_vision',
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('fake pdf content'),
        },
      },
    });
    expect(res.status()).toBe(401);
  });

  test('Prescription upload rejects missing file', async ({ request }) => {
    const res = await request.post('/api/v1/prescriptions', {
      headers: { Cookie: authCookie },
      multipart: {
        order_id: '1',
        prescription_type: 'single_vision',
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  test('Prescription upload rejects missing prescription_type', async ({ request }) => {
    const res = await request.post('/api/v1/prescriptions', {
      headers: { Cookie: authCookie },
      multipart: {
        order_id: '1',
        prescription_type: '',
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('fake pdf content'),
        },
      },
    });
    expect(res.status()).toBe(400);
  });

  test('Prescription upload rejects invalid order_id', async ({ request }) => {
    const res = await request.post('/api/v1/prescriptions', {
      headers: { Cookie: authCookie },
      multipart: {
        order_id: 'not-a-number',
        prescription_type: 'bifocal',
        file: {
          name: 'rx.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake image bytes'),
        },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  test('Prescription upload rejects non-existent order', async ({ request }) => {
    const res = await request.post('/api/v1/prescriptions', {
      headers: { Cookie: authCookie },
      multipart: {
        order_id: '999999',
        prescription_type: 'single_vision',
        file: {
          name: 'prescription.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 fake prescription document content here'),
        },
      },
    });
    // Should be 404 (order not found) or 403 (user mismatch)
    expect([404, 403]).toContain(res.status());
  });

  test('Customer can list their prescriptions', async ({ request }) => {
    const res = await request.get('/api/v1/prescriptions', {
      headers: { Cookie: authCookie },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  // --- Invoice Tests ---

  test('Invoice list requires authentication', async ({ request }) => {
    const res = await request.get('/api/v1/invoices');
    expect(res.status()).toBe(401);
  });

  test('Customer can list their invoices', async ({ request }) => {
    const res = await request.get('/api/v1/invoices', {
      headers: { Cookie: authCookie },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('Invoice detail for non-existent ID returns 404', async ({ request }) => {
    const res = await request.get('/api/v1/invoices/999999', {
      headers: { Cookie: authCookie },
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  test('Invoice download for non-existent ID returns 404', async ({ request }) => {
    const res = await request.get('/api/v1/invoices/999999/download', {
      headers: { Cookie: authCookie },
    });
    expect(res.status()).toBe(404);
  });

  test('Invoice download requires authentication', async ({ request }) => {
    const res = await request.get('/api/v1/invoices/1/download');
    expect(res.status()).toBe(401);
  });

  // --- Customer Order Detail ---

  test('Customer order detail for non-existent order returns 404', async ({ request }) => {
    const res = await request.get('/api/v1/orders/999999', {
      headers: { Cookie: authCookie },
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  test('Customer orders list is accessible', async ({ request }) => {
    const res = await request.get('/api/v1/orders?page=1&limit=10', {
      headers: { Cookie: authCookie },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

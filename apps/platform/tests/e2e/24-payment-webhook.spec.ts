import { test, expect } from '@playwright/test';
import { clearTestUser, setTestAdmin } from './helpers/db';

const adminEmail = 'admin_payment_e2e@cromaticvision.com';
const adminPassword = 'AdminPay123!';

test.describe('Suite 24: Payment Verification & Webhook', () => {
  test.beforeAll(async ({ request }) => {
    await clearTestUser(adminEmail);
    await request.post('/api/v1/auth/register', {
      data: { name: 'Payment Admin', email: adminEmail, phone: '9990005555', password: adminPassword },
    });
    await setTestAdmin(adminEmail);
  });

  test.afterAll(async () => {
    await clearTestUser(adminEmail);
  });

  test('Payment verify endpoint requires authentication', async ({ request }) => {
    const res = await request.post('/api/v1/payments/verify', {
      data: {
        razorpay_order_id: 'order_fake123',
        razorpay_payment_id: 'pay_fake456',
        razorpay_signature: 'fake_sig_abc',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('Payment verify rejects missing fields', async ({ request }) => {
    // Login first
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: adminEmail, password: adminPassword },
    });
    const cookie = loginRes.headers()['set-cookie'] || '';

    const res = await request.post('/api/v1/payments/verify', {
      headers: { Cookie: cookie },
      data: {
        razorpay_order_id: '',
        razorpay_payment_id: '',
        razorpay_signature: '',
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Payment verify rejects invalid signature', async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: adminEmail, password: adminPassword },
    });
    const cookie = loginRes.headers()['set-cookie'] || '';

    const res = await request.post('/api/v1/payments/verify', {
      headers: { Cookie: cookie },
      data: {
        razorpay_order_id: 'order_test_12345',
        razorpay_payment_id: 'pay_test_67890',
        razorpay_signature: 'invalid_signature_hash',
      },
    });
    // Should be 400 (invalid sig) or 500 (order not found in DB)
    expect([400, 500]).toContain(res.status());
  });

  test('Payment create-order requires authentication', async ({ request }) => {
    const res = await request.post('/api/v1/payments/create-order', {
      data: { order_id: 1 },
    });
    expect(res.status()).toBe(401);
  });

  test('Payment create-order validates order_id', async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: adminEmail, password: adminPassword },
    });
    const cookie = loginRes.headers()['set-cookie'] || '';

    const res = await request.post('/api/v1/payments/create-order', {
      headers: { Cookie: cookie },
      data: { order_id: 0 },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Webhook endpoint rejects invalid signature', async ({ request }) => {
    const res = await request.post('/api/v1/webhooks/razorpay', {
      headers: {
        'X-Razorpay-Signature': 'invalid_webhook_signature',
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_fake_001',
              order_id: 'order_fake_001',
              amount: 499900,
              status: 'captured',
            },
          },
        },
      }),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toMatch(/SIGNATURE_FAILED|WEBHOOK_FAILED/);
  });

  test('Webhook endpoint rejects empty body', async ({ request }) => {
    const res = await request.post('/api/v1/webhooks/razorpay', {
      headers: {
        'X-Razorpay-Signature': '',
        'Content-Type': 'application/json',
      },
      data: '',
    });
    expect(res.status()).toBe(400);
  });

  test('Webhook endpoint rejects malformed JSON', async ({ request }) => {
    const res = await request.post('/api/v1/webhooks/razorpay', {
      headers: {
        'X-Razorpay-Signature': 'some_sig',
        'Content-Type': 'application/json',
      },
      data: 'not-valid-json{{{',
    });
    expect(res.status()).toBe(400);
  });
});

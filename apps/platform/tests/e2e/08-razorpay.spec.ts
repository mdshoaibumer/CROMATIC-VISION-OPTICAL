import { test, expect } from './fixtures';

test.describe('Suite 8: Payment Integration', () => {
  test('Payment endpoint requires auth', async () => {
    const res = await fetch('http://localhost:8080/api/v1/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: 1 }),
    });
    expect(res.status).toBe(401);
  });

  test('Payment verify with invalid signature', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const res = await request.post('/api/v1/payments/verify', {
      data: {
        razorpay_order_id: 'order_fake',
        razorpay_payment_id: 'pay_fake',
        razorpay_signature: 'invalid',
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

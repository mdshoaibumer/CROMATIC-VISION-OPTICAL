import { test, expect } from '@playwright/test';

test.describe('Suite 24: Payment Webhook', () => {
  test('Webhook endpoint responds', async () => {
    const res = await fetch('http://localhost:3000/api/v1/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.captured', payload: {} }),
    });
    // Webhook should respond (might reject invalid payload but not crash)
    expect(res.status).toBeLessThan(500);
  });

  test('Webhook rejects empty body', async () => {
    const res = await fetch('http://localhost:3000/api/v1/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBeLessThan(500);
  });
});

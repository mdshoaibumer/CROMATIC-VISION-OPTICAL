import { test, expect } from '@playwright/test';

test.describe('Suite 9: Invoices', () => {
  test('Invoices require auth', async () => {
    const res = await fetch('http://localhost:3000/api/v1/invoices');
    expect(res.status).toBe(401);
  });

  test('Get invoices list', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const res = await request.get('/api/v1/invoices');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

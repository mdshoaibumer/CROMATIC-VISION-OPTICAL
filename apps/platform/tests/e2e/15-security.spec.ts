import { test, expect } from '@playwright/test';

test.describe('Suite 15: Security Validation', () => {
  test('Protected endpoints require auth', async () => {
    const endpoints = [
      '/api/v1/cart',
      '/api/v1/orders',
      '/api/v1/prescriptions',
      '/api/v1/invoices',
      '/api/v1/admin/customers',
      '/api/v1/admin/orders',
      '/api/v1/admin/prescriptions',
      '/api/v1/admin/invoices',
    ];
    for (const endpoint of endpoints) {
      const res = await fetch(`http://localhost:3000${endpoint}`);
      expect(res.status, `${endpoint} should require auth`).toBe(401);
    }
  });

  test('No localStorage leak on fresh visit', async ({ page }) => {
    await page.goto('/');
    const data = await page.evaluate(() => localStorage.getItem('cromatic_active_customer'));
    expect(data).toBeNull();
  });

  test('Health endpoint accessible without auth', async ({ request }) => {
    const res = await request.get('/api/v1/health/live');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
  });
});

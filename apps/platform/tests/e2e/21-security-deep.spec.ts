import { test, expect } from '@playwright/test';

test.describe('Suite 21: Security Deep Dive', () => {
  test('SQL injection in query params handled', async ({ request }) => {
    const res = await request.get("/api/v1/products?search=' OR 1=1 --");
    expect(res.status()).toBeLessThan(500);
  });

  test('XSS in registration handled', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: {
        name: '<script>alert("xss")</script>',
        email: `xss_${Date.now()}@test.com`,
        phone: '+91 99999 99999',
        password: 'StrongPass1!',
      },
    });
    // Server should either accept (sanitizing) or reject, not crash
    expect(res.status()).toBeLessThan(500);
  });

  test('Multiple failed logins handled gracefully', async ({ request }) => {
    for (let i = 0; i < 5; i++) {
      await request.post('/api/v1/auth/login', {
        data: { email: 'admin@cromatic.dev', password: 'wrong' },
      });
    }
    // Server should still respond after multiple failures
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'admin@cromatic.dev', password: 'admin123' },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('Admin endpoints reject customer tokens', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const endpoints = [
      '/api/v1/admin/customers',
      '/api/v1/admin/orders',
      '/api/v1/admin/prescriptions',
      '/api/v1/admin/invoices',
    ];
    for (const ep of endpoints) {
      const res = await request.get(ep);
      expect(res.status(), `${ep} should return 403`).toBe(403);
    }
  });
});

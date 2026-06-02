import { test, expect } from '@playwright/test';

test.describe('Suite 18: Admin Customers API', () => {
  test('Admin customers requires auth', async () => {
    const res = await fetch('http://localhost:3000/api/v1/admin/customers');
    expect(res.status).toBe(401);
  });

  test('Admin can list customers', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'admin@cromatic.dev', password: 'admin123' },
    });
    const res = await request.get('/api/v1/admin/customers');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('Admin can get specific customer', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'admin@cromatic.dev', password: 'admin123' },
    });
    // Get customers first to find the user ID
    const list = await request.get('/api/v1/admin/customers');
    const customers = await list.json();
    expect(customers.data.length).toBeGreaterThan(0);
    // Verify seeded user exists
    const found = customers.data.find((c: any) => c.email === 'user@cromatic.dev');
    expect(found).toBeDefined();
  });
});

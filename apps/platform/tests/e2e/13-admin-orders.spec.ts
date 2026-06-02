import { test, expect } from './fixtures';

test.describe('Suite 13: Admin Orders API', () => {
  test('Admin orders requires auth', async () => {
    const res = await fetch('http://localhost:8080/api/v1/admin/orders');
    expect(res.status).toBe(401);
  });

  test('Admin orders requires admin role', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const res = await request.get('/api/v1/admin/orders');
    expect(res.status()).toBe(403);
  });

  test('Admin can list orders', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'admin@cromatic.dev', password: 'admin123' },
    });
    const res = await request.get('/api/v1/admin/orders');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

import { test, expect } from './fixtures';

test.describe('Suite 6: Orders', () => {
  test('Orders endpoint requires auth', async () => {
    const res = await fetch('http://localhost:8080/api/v1/orders');
    expect(res.status).toBe(401);
  });

  test('Orders list after login', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const res = await request.get('/api/v1/orders');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('Create order requires auth', async () => {
    const res = await fetch('http://localhost:8080/api/v1/orders', { method: 'POST' });
    expect(res.status).toBe(401);
  });
});

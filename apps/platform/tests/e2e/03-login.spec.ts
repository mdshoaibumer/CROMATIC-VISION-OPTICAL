import { test, expect } from './fixtures';

test.describe('Suite 3: User Login', () => {
  test('Login via API with seeded user', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('user@cromatic.dev');
    expect(body.data.user.role).toBe('customer');
  });

  test('Login fails with wrong password', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);
  });

  test('Login fails with non-existent user', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'nobody@nowhere.com', password: 'whatever' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('Empty credentials rejected', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: '', password: '' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('Admin login via API', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'admin@cromatic.dev', password: 'admin123' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.user.role).toBe('admin');
  });
});

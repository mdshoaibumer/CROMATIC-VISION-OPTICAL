import { test, expect } from '@playwright/test';

test.describe('Suite 2: User Registration', () => {
  const ts = Date.now();

  test('Register via API', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: {
        name: 'Test User E2E',
        email: `e2e_${ts}@test.com`,
        phone: '+91 98765 43210',
        password: 'TestPass123!',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(`e2e_${ts}@test.com`);
  });

  test('Duplicate registration fails', async ({ request }) => {
    const email = `dup_${ts}@test.com`;
    await request.post('/api/v1/auth/register', {
      data: { name: 'Dup', email, phone: '+91 11111 11111', password: 'StrongPass1!' },
    });
    const res = await request.post('/api/v1/auth/register', {
      data: { name: 'Dup', email, phone: '+91 11111 11111', password: 'StrongPass1!' },
    });
    expect(res.status()).toBe(409);
  });

  test('Registration requires valid email', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: { name: 'Bad', email: 'not-an-email', phone: '+91 22222 22222', password: 'StrongPass1!' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('Weak password rejected', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: { name: 'Weak', email: `weak_${ts}@test.com`, phone: '+91 33333 33333', password: '123' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

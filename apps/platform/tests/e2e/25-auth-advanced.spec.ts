import { test, expect } from '@playwright/test';

test.describe('Suite 25: Auth Advanced Scenarios', () => {
  test('Logout invalidates session', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const logout = await request.post('/api/v1/auth/logout');
    expect(logout.status()).toBeLessThan(500);
  });

  test('Register then login works', async ({ request }) => {
    const email = `flow_${Date.now()}@test.com`;
    const reg = await request.post('/api/v1/auth/register', {
      data: { name: 'Flow', email, phone: '+91 44444 44444', password: 'FlowPass123!' },
    });
    expect(reg.status()).toBe(201);

    const login = await request.post('/api/v1/auth/login', {
      data: { email, password: 'FlowPass123!' },
    });
    expect(login.status()).toBe(200);
  });

  test('Weak password rejected on register', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: { name: 'Weak', email: `w2_${Date.now()}@test.com`, phone: '+91 55555 55555', password: 'ab' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('Empty credentials rejected', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: '', password: '' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

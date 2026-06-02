import { test, expect } from './fixtures';

test.describe('Suite 7: Prescriptions', () => {
  test('Prescriptions require auth', async () => {
    const res = await fetch('http://localhost:8080/api/v1/prescriptions');
    expect(res.status).toBe(401);
  });

  test('Get prescriptions list', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const res = await request.get('/api/v1/prescriptions');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

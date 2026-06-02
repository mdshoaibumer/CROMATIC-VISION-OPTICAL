import { test, expect } from './fixtures';

test.describe('Suite 26: Prescriptions & Invoices Combined', () => {
  test('Prescriptions list works after auth', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const res = await request.get('/api/v1/prescriptions');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('Invoices list works after auth', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const res = await request.get('/api/v1/invoices');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('Products pagination', async ({ request }) => {
    const res = await request.get('/api/v1/products?page=1&limit=2');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.items.length).toBeGreaterThan(0);
    expect(body.data.items.length).toBeLessThanOrEqual(2);
  });
});

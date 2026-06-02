import { test, expect } from '@playwright/test';

test.describe('Suite 20: Product Images API', () => {
  test('Product has images field', async ({ request }) => {
    const res = await request.get('/api/v1/products/aviator-classic-gold');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.images).toBeDefined();
  });

  test('Upload requires admin', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const res = await request.post('/api/v1/admin/products/1/images', {
      data: {},
    });
    expect(res.status()).toBe(403);
  });

  test('Admin image upload endpoint responds', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'admin@cromatic.dev', password: 'admin123' },
    });
    const res = await request.post('/api/v1/admin/products/1/images', {
      multipart: {
        image: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: Buffer.from('fakepng'),
        },
      },
    });
    // Mock may not fully support upload but shouldn't crash
    expect(res.status()).toBeLessThan(500);
  });
});

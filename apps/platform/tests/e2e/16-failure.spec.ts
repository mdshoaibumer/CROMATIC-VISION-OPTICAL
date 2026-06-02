import { test, expect } from './fixtures';

test.describe('Suite 16: Error Handling', () => {
  test('Non-existent product returns error', async ({ request }) => {
    const res = await request.get('/api/v1/products/nonexistent-slug-xyz');
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('Health API responds properly', async ({ request }) => {
    const res = await request.get('/api/v1/health/live');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.mode).toBe('dev-memory');
  });

  test('Frontend handles unknown route', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    // Should not crash - either shows 404 or redirects
    await expect(page).not.toHaveURL(/error/);
  });

  test('Empty login body returns error', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('Invalid JSON handled gracefully', async () => {
    const res = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid json',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

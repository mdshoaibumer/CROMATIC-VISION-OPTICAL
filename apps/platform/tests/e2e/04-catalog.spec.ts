import { test, expect } from './fixtures';

test.describe('Suite 4: Product Catalog', () => {
  test('Products API returns items', async ({ request }) => {
    const res = await request.get('/api/v1/products');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThan(0);
  });

  test('Categories API returns items', async ({ request }) => {
    const res = await request.get('/api/v1/categories');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(4);
    const names = body.data.map((c: any) => c.name);
    expect(names).toContain('Sunglasses');
    expect(names).toContain('Eyeglasses');
  });

  test('Single product by slug', async ({ request }) => {
    const res = await request.get('/api/v1/products/aviator-classic-gold');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('Aviator Classic Gold');
    expect(body.data.price).toBe(12999);
    expect(body.data.category_name).toBe('Sunglasses');
  });

  test('Product filtering by category', async ({ request }) => {
    const res = await request.get('/api/v1/products?category_id=1');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.items.length).toBeGreaterThan(0);
  });

  test('Product search', async ({ request }) => {
    const res = await request.get('/api/v1/products?search=aviator');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.items.length).toBeGreaterThan(0);
    expect(body.data.items[0].name.toLowerCase()).toContain('aviator');
  });

  test('Products page displays grid', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByText('Aviator Classic Gold').first()).toBeVisible({ timeout: 15000 });
  });
});

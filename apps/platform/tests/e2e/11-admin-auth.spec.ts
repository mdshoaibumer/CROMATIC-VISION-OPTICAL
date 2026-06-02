import { test, expect } from '@playwright/test';

test.describe('Suite 11: Admin Authentication', () => {
  test('Admin login via API', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'admin@cromatic.dev', password: 'admin123' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.user.role).toBe('admin');
  });

  test('Non-admin cannot access admin endpoints', async ({ request }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'user@cromatic.dev', password: 'user123' },
    });
    const res = await request.get('/api/v1/admin/customers');
    expect(res.status()).toBe(403);
  });

  test('Admin login page renders', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Sign in to Cromatic Vision Optical Console')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Admin login via UI succeeds', async ({ page }) => {
    await page.goto('/admin');
    await page.locator('input[type="email"]').fill('admin@cromatic.dev');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('#btn-admin-login').click();
    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 15000 });
  });

  test('Admin login fails with wrong credentials', async ({ page }) => {
    await page.goto('/admin');
    await page.locator('input[type="email"]').fill('admin@cromatic.dev');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('#btn-admin-login').click();
    await expect(page.getByText(/invalid|denied/i).first()).toBeVisible({ timeout: 5000 });
  });
});

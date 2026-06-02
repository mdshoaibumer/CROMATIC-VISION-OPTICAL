import { test, expect } from '@playwright/test';

test.describe('Suite 1: Application Health', () => {
  test('Frontend Homepage Loads', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    // Luxury storefront should show brand name and hero CTA
    await expect(page.getByText('Cromatic', { exact: false }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Shop Collection', { exact: false }).first()).toBeVisible();
  });

  test('Products Page Loads', async ({ page }) => {
    await page.goto('/products');
    // Wait for product grid or page content to appear
    await expect(page.locator('main, [role="main"], #main-content').first()).toBeVisible({ timeout: 15000 });
  });

  test('Login Page Loads', async ({ page }) => {
    const res = await page.goto('/admin');
    expect(res?.status()).toBe(200);
    await expect(page.getByText('Sign in to Cromatic Vision', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('No Console Errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);
    // Ignore hydration errors, missing images, or 401s from auth/me
    const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('401'));
    expect(criticalErrors.length).toBe(0);
  });
});

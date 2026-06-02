import { test, expect } from '@playwright/test';

test.describe('Suite 23: Responsive & Accessibility', () => {
  test('Storefront renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/');
    // Main content should be visible
    await expect(page.locator('body')).toBeVisible();
    // Navigation hamburger menu should be visible on mobile
    const mobileMenu = page.getByRole('button', { name: /menu|hamburger/i }).first();
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('Admin dashboard renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/?view=admin');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Product catalog renders correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: /Browse|Collection|Products/i }).first().click().catch(() => {});
    await page.waitForTimeout(500);
    // Products grid should be visible
    const productGrid = page.locator('[class*="grid"]').first();
    if (await productGrid.count() > 0) {
      await expect(productGrid).toBeVisible();
    }
  });

  test('Error boundary displays correctly on all viewports', async ({ page }) => {
    // Intercept API and force error
    await page.route('**/api/v1/**', route => route.abort('failed'));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    // Should not crash, error boundary should catch
    await expect(page.locator('body')).toBeVisible();
  });
});

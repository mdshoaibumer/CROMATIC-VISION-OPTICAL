import { test, expect } from './fixtures';

test.describe('Suite 23: Responsive Design', () => {
  test('Homepage renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByText('Cromatic').first()).toBeVisible({ timeout: 10000 });
  });

  test('Homepage renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByText('Cromatic').first()).toBeVisible({ timeout: 10000 });
  });

  test('Homepage renders on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByText('Cromatic').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Shop Collection').first()).toBeVisible();
  });
});

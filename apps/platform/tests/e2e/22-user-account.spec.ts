import { test, expect } from './fixtures';

test.describe('Suite 22: User Account Page', () => {
  test('Account route renders', async ({ page }) => {
    await page.goto('/account');
    // Should render without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('Account route accessible', async ({ page }) => {
    const res = await page.goto('/account');
    expect(res?.status()).toBeLessThan(500);
  });
});

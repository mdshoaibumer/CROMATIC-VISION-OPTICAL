import { test, expect } from '@playwright/test';

test.describe('Suite 16: Backend Failure Testing', () => {
  test('Frontend Displays Error State when backend is offline', async ({ page }) => {
    // Intercept all API calls and force them to fail (simulating backend crash)
    await page.route('**/api/v1/**', async route => {
      await route.abort('failed');
    });

    await page.goto('/');
    
    // Attempt an action that requires backend
    await page.getByRole('button', { name: /Sign In/i }).first().click();
    await page.getByText(/Construct credentials/i, { exact: false }).click().catch(async () => {
      await page.getByText(/No Account\? Create Node/i).click().catch(() => {});
    });

    await page.locator('.fixed input[type="text"]').nth(0).fill('Test User');
    await page.locator('.fixed input[type="email"]').fill('crash@test.com');
    await page.locator('.fixed input[type="text"]').nth(1).fill('1234567890');
    await page.locator('.fixed input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: /Secure Authorize/i }).click();

    // The error handling must display the red validation/error box on screen
    const errorAlert = page.locator('.fixed .bg-red-950\\/40');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
  });
});

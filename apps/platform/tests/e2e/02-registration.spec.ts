import { test, expect } from '@playwright/test';
import { clearTestUser, getUserFromDb } from './helpers/db';

const testEmail = 'test_registration@cromaticvision.com';

test.describe('Suite 2: Customer Registration', () => {
  test.beforeEach(async () => {
    // Clean up test data
    await clearTestUser(testEmail);
  });

  test.afterAll(async () => {
    // Clean up test data
    await clearTestUser(testEmail);
  });

  test('User can register successfully', async ({ page }) => {
    await page.goto('/');

    // Open Login Modal
    await page.getByRole('button', { name: /Sign In/i }).first().click();

    // Switch to Register Mode
    await page.getByText(/Construct credentials/i, { exact: false }).click().catch(async () => {
        // Fallback exact text match attempts based on source
        await page.getByText(/No Account\? Create Node/i).click().catch(() => {});
    });
    
    // Check if the "Create Cromatic Vision Credentials" text is visible
    await expect(page.getByText('Create Cromatic Vision Credentials', { exact: false })).toBeVisible();

    await page.locator('.fixed input[type="text"]').nth(0).fill('Test User');
    await page.locator('.fixed input[type="email"]').fill(testEmail);
    await page.locator('.fixed input[type="text"]').nth(1).fill('1234567890');
    await page.locator('.fixed input[type="password"]').fill('SuperSecret123!');

    // Submit
    await page.getByRole('button', { name: /Secure Authorize/i }).click();

    // Wait for auth to complete (modal closes or redirects or shows success)
    await expect(page.getByText('Create Cromatic Vision Credentials')).toBeHidden({ timeout: 10000 });
    
    // Verify user exists in database
    const dbUser = await getUserFromDb(testEmail);
    expect(dbUser).toBeDefined();
    expect(dbUser.email).toBe(testEmail);
    expect(dbUser.role).toBe('customer');

    // Verify Authenticated Session
    await expect(page.locator('button[title="My Control Account Console"]')).toBeVisible({ timeout: 10000 });
  });
});

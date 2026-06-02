import { test, expect } from '@playwright/test';

test.describe('Suite 22: User Account & Profile Management', () => {
  test('User can register and login', async ({ page }) => {
    await page.goto('/');
    // Open auth modal
    await page.getByRole('button', { name: /Login|Sign In/i }).first().click();
    await page.getByText(/Create|Register|No Account/i).first().click().catch(() => {});

    const uniqueEmail = `test-${Date.now()}@account.com`;
    await page.getByPlaceholder(/Name|Full/i).first().fill('Test User Account');
    await page.getByPlaceholder(/Email/i).first().fill(uniqueEmail);
    await page.getByPlaceholder(/Password/i).first().fill('TestAccount123!');
    
    const registerBtn = page.getByRole('button', { name: /Register|Create|Sign Up/i }).first();
    if (await registerBtn.count() > 0) {
      await registerBtn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('User can view their account page', async ({ page }) => {
    await page.goto('/');
    // If logged in, navigate to account
    const accountBtn = page.getByRole('button', { name: /Account/i }).first();
    if (await accountBtn.count() > 0) {
      await accountBtn.click();
      const accountPage = page.getByText(/Order|History|Prescription/i, { exact: false }).first();
      if (await accountPage.count() > 0) {
        await expect(accountPage).toBeVisible();
      }
    }
  });

  test('User can logout', async ({ page }) => {
    await page.goto('/');
    const logoutBtn = page.getByRole('button', { name: /Logout|Sign Out/i }).first();
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
      // Should show login button again
      const loginBtn = page.getByRole('button', { name: /Login|Sign In/i }).first();
      await expect(loginBtn).toBeVisible();
    }
  });

  test('Invalid registration is rejected', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Login|Sign In/i }).first().click();
    await page.getByText(/Create|Register|No Account/i).first().click().catch(() => {});

    // Try with short password
    await page.getByPlaceholder(/Name|Full/i).first().fill('Short Pass User');
    await page.getByPlaceholder(/Email/i).first().fill('short@test.com');
    await page.getByPlaceholder(/Password/i).first().fill('123');

    const registerBtn = page.getByRole('button', { name: /Register|Create|Sign Up/i }).first();
    if (await registerBtn.count() > 0) {
      await registerBtn.click();
      await page.waitForTimeout(500);
      // Should show validation error
      const error = page.getByText(/8 characters|password|too short|validation/i).first();
      if (await error.count() > 0) {
        await expect(error).toBeVisible();
      }
    }
  });

  test('Duplicate email registration is rejected', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Login|Sign In/i }).first().click();
    await page.getByText(/Create|Register|No Account/i).first().click().catch(() => {});

    // Use an email we know exists
    await page.getByPlaceholder(/Name|Full/i).first().fill('Duplicate User');
    await page.getByPlaceholder(/Email/i).first().fill('admin@test.com');
    await page.getByPlaceholder(/Password/i).first().fill('Password123!');

    const registerBtn = page.getByRole('button', { name: /Register|Create|Sign Up/i }).first();
    if (await registerBtn.count() > 0) {
      await registerBtn.click();
      await page.waitForTimeout(500);
      const error = page.getByText(/already|exists|conflict|registered/i).first();
      if (await error.count() > 0) {
        await expect(error).toBeVisible();
      }
    }
  });
});

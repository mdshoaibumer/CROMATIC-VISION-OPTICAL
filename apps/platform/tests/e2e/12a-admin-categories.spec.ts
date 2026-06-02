import { test, expect } from '@playwright/test';
import { clearTestUser, setTestAdmin } from './helpers/db';

const testAdminEmail = 'admin_cats_test@eyeware.com';
const testPassword = 'AdminSecret123!';
const categoryName = 'Playwright Test Category';

test.describe('Suite 12a: Admin Categories CRUD', () => {
  test.beforeAll(async ({ request }) => {
    await clearTestUser(testAdminEmail);
    // Register test admin
    await request.post('/api/v1/auth/register', {
      data: {
        name: 'Admin User',
        email: testAdminEmail,
        phone: '1111111111',
        password: testPassword
      }
    });
    await setTestAdmin(testAdminEmail);
  });

  test.afterAll(async () => {
    await clearTestUser(testAdminEmail);
  });

  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto('/');
    await page.getByRole('button', { name: /EyeWare Admin Console/i }).click();
    await page.locator('input[type="email"]').fill(testAdminEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.getByRole('button', { name: /Secure access Sign In/i }).click();
    await expect(page.getByText('Operations Dashboard', { exact: false })).toBeVisible({ timeout: 10000 });
    
    // Navigate to Categories
    await page.getByRole('button', { name: 'Categories', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Catalog Categories/i })).toBeVisible();
  });

  test('Admin can create, edit, and delete a category', async ({ page }) => {
    // Create
    await page.getByRole('button', { name: /Add Category Class/i }).click();
    await page.getByPlaceholder(/e.g. Photochromic Transitions/i).fill(categoryName);
    await page.getByPlaceholder(/e.g. phototransitions/i).fill('pw-test-category');
    await page.getByPlaceholder(/Describe lens indexes/i).fill('Test description for playwright');
    await page.getByRole('button', { name: /Apply Classification/i }).click();

    // Verify Create
    await expect(page.getByText(categoryName)).toBeVisible();

    // Edit
    // Find the category card and click edit
    const categoryCard = page.locator('div').filter({ hasText: categoryName }).first();
    await categoryCard.getByRole('button', { name: /Edit Class/i }).click();
    
    const updatedName = categoryName + ' Updated';
    await page.getByPlaceholder(/e.g. Photochromic Transitions/i).fill(updatedName);
    await page.getByRole('button', { name: /Apply Classification/i }).click();

    // Verify Edit
    await expect(page.getByText(updatedName)).toBeVisible();

    // Delete
    // Need to handle confirm dialog
    page.on('dialog', dialog => dialog.accept());
    const updatedCard = page.locator('div').filter({ hasText: updatedName }).first();
    await updatedCard.getByRole('button', { name: /Remove/i }).click();

    // Verify Delete
    await expect(page.getByText(updatedName)).not.toBeVisible();
  });
});

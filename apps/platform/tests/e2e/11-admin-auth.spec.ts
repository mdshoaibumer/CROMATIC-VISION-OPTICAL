import { test, expect } from '@playwright/test';
import { clearTestUser, setTestAdmin } from './helpers/db';

const testAdminEmail = 'admin_test@cromaticvision.com';
const testPassword = 'AdminSecret123!';

test.describe('Suite 11: Admin Authentication', () => {
  test.beforeEach(async ({ request }) => {
    await clearTestUser(testAdminEmail);
    // Create user and promote to admin in DB
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

  test('Admin Dashboard Loads and Protects Routes', async ({ page }) => {
    await page.goto('/');
    
    // Switch to Admin View
    await page.getByRole('button', { name: /EyeWare Admin Console/i }).click();

    // Login
    await page.locator('input[type="email"]').fill(testAdminEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.getByRole('button', { name: /Secure access Sign In/i }).click();

    // Verify Admin Dashboard
    await expect(page.getByText('Cromatic Vision Central Console', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sales Terminal', { exact: false })).toBeVisible();

    // Verify Modules are accessible
    await page.getByRole('button', { name: 'Products', exact: true }).click();
    await expect(page.getByRole('button', { name: /Add Optical Item/i })).toBeVisible();
  });
});

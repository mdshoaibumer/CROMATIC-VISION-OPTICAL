import { test, expect } from '@playwright/test';
import { clearTestUser, getUserFromDb, getDbClient } from './helpers/db';
import crypto from 'crypto';

const testEmail = 'test_login@cromaticvision.com';
const testPassword = 'SuperSecret123!';

test.describe('Suite 3: Login', () => {
  test.beforeEach(async () => {
    await clearTestUser(testEmail);
    // Create the test user in the DB bypassing the UI for speed, wait, since hashing is done via Go bcrypt, 
    // it's easier to just register via API in the setup
    const request = (await import('@playwright/test')).request;
    const reqContext = await request.newContext({ baseURL: 'http://localhost:3000' });
    await reqContext.post('/api/v1/auth/register', {
        data: {
            name: 'Login Test User',
            email: testEmail,
            phone: '1234567890',
            password: testPassword
        }
    });
  });

  test.afterAll(async () => {
    await clearTestUser(testEmail);
  });

  test('Login Using Real Backend', async ({ page }) => {
    await page.goto('/');

    // Open Login Modal
    await page.getByRole('button', { name: /Sign In/i }).first().click();

    // Fill form
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);

    // Submit
    await page.getByRole('button', { name: /Secure Authorize/i }).click();

    // Verify Authenticated Session
    await expect(page.locator('button[title="My Control Account Console"]')).toBeVisible({ timeout: 10000 });
    
    // Verify Protected Routes Accessible
    await page.locator('button[title="My Control Account Console"]').click();
    await expect(page.getByText('Security & Personal details', { exact: false })).toBeVisible();

    // Verify Logout Works
    await page.getByRole('button', { name: /Logout customer node/i }).click();
    
    // Verify Session Invalidated
    await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible();
  });
});

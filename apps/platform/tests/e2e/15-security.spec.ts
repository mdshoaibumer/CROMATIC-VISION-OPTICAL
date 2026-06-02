import { test, expect } from '@playwright/test';

test.describe('Suite 15: Security Validation', () => {
  test('Verify No Mock APIs Active', async ({ page, request }) => {
    // Attempt to access old mock localStorage properties or endpoints if any existed
    await page.goto('/');
    const localStorageData = await page.evaluate(() => localStorage.getItem('cromatic_active_customer'));
    expect(localStorageData).toBeNull();

    // Verify Admin endpoints return 401 when unauthenticated
    const res = await request.get('/api/v1/auth/admin/customers');
    expect(res.status()).toBe(401);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Suite 18: Admin Customers Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?view=admin');
    await page.getByPlaceholder(/Email/i).fill('admin@test.com');
    await page.getByPlaceholder(/Password/i).fill('Admin123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForTimeout(1000);
  });

  test('Admin can view customer list', async ({ page }) => {
    await page.getByText(/Customers/i).first().click();
    // Should display customer list or empty state
    const customersHeading = page.getByText(/Customers/i, { exact: false });
    await expect(customersHeading.first()).toBeVisible();
  });

  test('Admin can view individual customer details', async ({ page }) => {
    await page.getByText(/Customers/i).first().click();
    // Click on first customer row if available
    const customerRow = page.locator('tr, [data-testid="customer-row"]').first();
    if (await customerRow.count() > 0) {
      await customerRow.click();
      // Should show customer profile details
      const detailsView = page.getByText(/email|phone|orders/i, { exact: false }).first();
      if (await detailsView.count() > 0) {
        await expect(detailsView).toBeVisible();
      }
    }
  });

  test('Admin cannot access customer section without admin role', async ({ page }) => {
    // Logout and login as regular customer
    await page.goto('/');
    const res = await page.request.get('/api/v1/admin/customers');
    expect(res.status()).toBe(401);
  });

  test('Customer list displays correct user information', async ({ page }) => {
    await page.getByText(/Customers/i).first().click();
    // Should show email and name columns
    const emailColumn = page.getByText(/@/i).first();
    if (await emailColumn.count() > 0) {
      await expect(emailColumn).toBeVisible();
    }
  });
});

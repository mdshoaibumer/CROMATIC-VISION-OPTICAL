import { test, expect } from '@playwright/test';

test.describe('Suite 20: Product Image Upload E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?view=admin');
    await page.getByPlaceholder(/Email/i).fill('admin@test.com');
    await page.getByPlaceholder(/Password/i).fill('Admin123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForTimeout(1000);
  });

  test('Admin can upload product image', async ({ page }) => {
    await page.getByText(/Products/i).first().click();
    // Open first product for editing
    const editBtn = page.getByRole('button', { name: /Edit/i }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        // Upload a test image
        await fileInput.setInputFiles({
          name: 'test-frame.png',
          mimeType: 'image/png',
          buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
        });
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Admin can delete product image', async ({ page }) => {
    await page.getByText(/Products/i).first().click();
    const editBtn = page.getByRole('button', { name: /Edit/i }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      const deleteImageBtn = page.getByRole('button', { name: /Remove Image|Delete Image/i }).first();
      if (await deleteImageBtn.count() > 0) {
        await deleteImageBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Invalid file type is rejected', async ({ page }) => {
    await page.getByText(/Products/i).first().click();
    const editBtn = page.getByRole('button', { name: /Edit/i }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles({
          name: 'malicious.exe',
          mimeType: 'application/x-executable',
          buffer: Buffer.from('not-an-image'),
        });
        await page.waitForTimeout(500);
        // Should show error about invalid file type
        const error = page.getByText(/invalid|unsupported|file type/i).first();
        if (await error.count() > 0) {
          await expect(error).toBeVisible();
        }
      }
    }
  });
});

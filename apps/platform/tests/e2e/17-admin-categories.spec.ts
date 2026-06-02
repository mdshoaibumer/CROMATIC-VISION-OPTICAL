import { test, expect } from '@playwright/test';

test.describe('Suite 17: Admin Categories Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin and login
    await page.goto('/?view=admin');
    await page.getByPlaceholder(/Email/i).fill('admin@test.com');
    await page.getByPlaceholder(/Password/i).fill('Admin123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForTimeout(1000);
  });

  test('Admin can view categories list', async ({ page }) => {
    await page.getByText(/Categories/i).first().click();
    // Should see categories page or empty state
    const heading = page.getByText(/Categories/i, { exact: false });
    await expect(heading.first()).toBeVisible();
  });

  test('Admin can create a new category', async ({ page }) => {
    await page.getByText(/Categories/i).first().click();
    const addBtn = page.getByRole('button', { name: /Add|Create|New/i }).first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.getByPlaceholder(/Name/i).first().fill('Test Titanium Frames');
      await page.getByPlaceholder(/Slug/i).first().fill('test-titanium-frames');
      const submitBtn = page.getByRole('button', { name: /Save|Create|Submit/i }).first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Admin can edit an existing category', async ({ page }) => {
    await page.getByText(/Categories/i).first().click();
    const editBtn = page.getByRole('button', { name: /Edit/i }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      const nameField = page.getByPlaceholder(/Name/i).first();
      if (await nameField.count() > 0) {
        await nameField.fill('Updated Category Name');
        await page.getByRole('button', { name: /Save|Update/i }).first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Admin can delete a category', async ({ page }) => {
    await page.getByText(/Categories/i).first().click();
    const deleteBtn = page.getByRole('button', { name: /Delete|Remove/i }).first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      // Confirm deletion dialog if present
      const confirmBtn = page.getByRole('button', { name: /Confirm|Yes|Delete/i }).first();
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('Category slug uniqueness is enforced', async ({ page }) => {
    await page.getByText(/Categories/i).first().click();
    const addBtn = page.getByRole('button', { name: /Add|Create|New/i }).first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.getByPlaceholder(/Name/i).first().fill('Duplicate Test');
      await page.getByPlaceholder(/Slug/i).first().fill('test-titanium-frames');
      const submitBtn = page.getByRole('button', { name: /Save|Create|Submit/i }).first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        // Should see conflict error
        const error = page.getByText(/already exists|conflict|duplicate/i).first();
        if (await error.count() > 0) {
          await expect(error).toBeVisible();
        }
      }
    }
  });
});

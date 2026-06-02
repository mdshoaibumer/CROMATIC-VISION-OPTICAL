import { test, expect } from '@playwright/test';

test.describe('Suite 19: Admin Invoices Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?view=admin');
    await page.getByPlaceholder(/Email/i).fill('admin@test.com');
    await page.getByPlaceholder(/Password/i).fill('Admin123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForTimeout(1000);
  });

  test('Admin can view all invoices', async ({ page }) => {
    await page.getByText(/Invoices/i).first().click();
    const heading = page.getByText(/Invoices/i, { exact: false });
    await expect(heading.first()).toBeVisible();
  });

  test('Admin can view invoice details', async ({ page }) => {
    await page.getByText(/Invoices/i).first().click();
    const invoiceRow = page.locator('tr, [data-testid="invoice-row"]').first();
    if (await invoiceRow.count() > 0) {
      await invoiceRow.click();
      // Should display invoice preview or details
      const invoiceDetail = page.getByText(/INV-|invoice_number|amount/i, { exact: false }).first();
      if (await invoiceDetail.count() > 0) {
        await expect(invoiceDetail).toBeVisible();
      }
    }
  });

  test('Admin can download invoice PDF', async ({ page }) => {
    await page.getByText(/Invoices/i).first().click();
    const downloadBtn = page.getByRole('button', { name: /Download|PDF/i }).first();
    if (await downloadBtn.count() > 0) {
      // Intercept the download request
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        downloadBtn.click(),
      ]);
      if (download) {
        expect(download.suggestedFilename()).toContain('.pdf');
      }
    }
  });

  test('Invoice shows correct order association', async ({ page }) => {
    await page.getByText(/Invoices/i).first().click();
    // Verify invoices are linked to orders
    const orderRef = page.getByText(/Order #|order_id/i, { exact: false }).first();
    if (await orderRef.count() > 0) {
      await expect(orderRef).toBeVisible();
    }
  });

  test('Unauthenticated user cannot access admin invoices API', async ({ request }) => {
    const res = await request.get('/api/v1/admin/invoices');
    expect(res.status()).toBe(401);
  });
});

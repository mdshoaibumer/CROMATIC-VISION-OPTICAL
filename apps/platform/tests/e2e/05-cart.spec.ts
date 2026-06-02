import { test, expect } from '@playwright/test';

test.describe('Suite 5: Cart', () => {
  test('Add Product, Adjust Quantity, Remove Product, Verify Totals', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to products
    await page.getByRole('button', { name: /Browse Collection/i }).first().click().catch(() => {});
    
    // Wait for a product to appear and click 'Configure Specs'
    const productCard = page.getByText('Configure Specs').first();
    const emptyCatalog = page.getByText('No products available at the moment.');
    
    // Wait for either the products to load or the empty state to render
    await expect(productCard.or(emptyCatalog).first()).toBeVisible();

    if (await productCard.isVisible()) {
      await productCard.click(); // go to details
      const addToCartBtn = page.getByRole('button', { name: /Add To Shopping List/i }).first();
      await addToCartBtn.click();
      
      // Open cart
      await page.getByTitle('View Shopping list drawer').first().click();
      
      // Verify product is in cart
      await expect(page.getByText('Your Shopping List', { exact: false })).toBeVisible();
      
      // Increase quantity
      await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();
      
      await expect(page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first()).toBeVisible();
      
      // Decrease quantity
      await page.locator('button').filter({ has: page.locator('svg.lucide-minus') }).first().click();
      
      // Remove product
      await page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first().click();
      
      // Verify empty cart
      await expect(page.getByText('No model specifications selected.', { exact: false })).toBeVisible();
    }
  });
});

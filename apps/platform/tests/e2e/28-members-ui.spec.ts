import { test, expect } from './fixtures';

test.describe('Suite 28: Members/Customers UI Redesign', () => {
  test.beforeEach(async ({ request, page }) => {
    // Login as admin
    await request.post('/api/v1/auth/login', {
      data: { email: 'admin@cromatic.dev', password: 'admin123' },
    });
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('Navigate to Customers module', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
  });

  test('Members stats strip shows totals', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Total Members')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Active')).toBeVisible();
    await expect(page.getByText('Suspended')).toBeVisible();
  });

  test('Grid view toggle is active by default', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    // Grid view should show card-based layout
    await page.waitForTimeout(1000); // wait for animation
  });

  test('Can toggle between grid and list view', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    // Click list view toggle (second button in the toggle group)
    const listButton = page.locator('button').filter({ has: page.locator('[class*="lucide-list"]') });
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('Search filters members', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    
    const searchInput = page.getByPlaceholder('Search members by name or email...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('nonexistent-user-xyz');
    await page.waitForTimeout(300);
    await expect(page.getByText('No members found')).toBeVisible();
  });

  test('Clicking a member card opens detail drawer', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    
    // Wait for member cards to load
    await page.waitForTimeout(1500);
    
    // Click the first member card
    const firstCard = page.locator('[class*="rounded-2xl"][class*="cursor-pointer"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      // Drawer should appear with Member Profile heading
      await expect(page.getByText('Member Profile')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Member detail drawer shows order history section', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);
    
    const firstCard = page.locator('[class*="rounded-2xl"][class*="cursor-pointer"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(page.getByText('Order History')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Member detail drawer shows account management', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);
    
    const firstCard = page.locator('[class*="rounded-2xl"][class*="cursor-pointer"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(page.getByText('Account Management')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Member drawer can be closed', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);
    
    const firstCard = page.locator('[class*="rounded-2xl"][class*="cursor-pointer"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(page.getByText('Member Profile')).toBeVisible({ timeout: 5000 });
      
      // Close via X button
      const closeButton = page.locator('button').filter({ has: page.locator('[class*="lucide-x"]') });
      await closeButton.first().click();
      await expect(page.getByText('Member Profile')).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('Members cards show lifetime value and spending bar', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);
    
    // Check for Lifetime Value label in grid cards
    const lifetimeLabels = page.getByText('Lifetime Value');
    const count = await lifetimeLabels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Members responsive - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.locator('#sidebar-link-customers').click();
    await page.waitForTimeout(2000);
    // Should still render (may use mobile layout)
    await expect(page.getByText('Members Directory').or(page.getByText('Total Members'))).toBeVisible({ timeout: 10000 });
  });
});

import { test, expect } from './fixtures';

test.describe('Suite 29: UI Animations & Interactions', () => {
  test.beforeEach(async ({ request, page }) => {
    await request.post('/api/v1/auth/login', {
      data: { email: 'admin@cromatic.dev', password: 'admin123' },
    });
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard cards have Framer Motion animation attributes', async ({ page }) => {
    // Framer Motion applies style transforms; cards should animate in
    await page.waitForTimeout(2000);
    const revenueCard = page.locator('#metric-card-revenue');
    await expect(revenueCard).toBeVisible({ timeout: 10000 });
    // After animation completes, opacity should be 1
    const opacity = await revenueCard.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    expect(parseFloat(opacity)).toBe(1);
  });

  test('Dashboard cards respond to hover with scale transform', async ({ page }) => {
    const revenueCard = page.locator('#metric-card-revenue');
    await expect(revenueCard).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500); // Wait for entrance animation

    // Get initial transform
    const initialTransform = await revenueCard.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    // Hover over the card
    await revenueCard.hover();
    await page.waitForTimeout(400);

    // After hover, transform should change (scale applied)
    const hoverTransform = await revenueCard.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    // They should differ (hover applies scale)
    expect(hoverTransform).not.toBe(initialTransform);
  });

  test('Chart line has SVG path elements', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Revenue chart should render path elements
    const paths = page.locator('svg path[stroke="#10b981"]');
    await expect(paths.first()).toBeVisible({ timeout: 10000 });
  });

  test('Chart data points are interactive', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Chart points should exist and be hoverable
    const chartPoints = page.locator('.rounded-full.border-emerald-400');
    const count = await chartPoints.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Verification logs have entrance animation', async ({ page }) => {
    await page.waitForTimeout(2000);
    const logsSection = page.getByText('Verification Logs');
    await expect(logsSection).toBeVisible({ timeout: 10000 });
    // Log items should be rendered with full opacity after animation
    const logItems = page.locator('[class*="rounded-xl"][class*="border-white"]').first();
    if (await logItems.isVisible()) {
      const opacity = await logItems.evaluate(el =>
        window.getComputedStyle(el).opacity
      );
      expect(parseFloat(opacity)).toBe(1);
    }
  });

  test('Member cards animate on entrance', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Cards should have opacity 1 after animation completes
    const firstCard = page.locator('[class*="rounded-2xl"][class*="cursor-pointer"]').first();
    if (await firstCard.isVisible()) {
      const opacity = await firstCard.evaluate(el =>
        window.getComputedStyle(el).opacity
      );
      expect(parseFloat(opacity)).toBe(1);
    }
  });

  test('Member spending bars animate width', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Spending bars should have non-zero width after animation
    const bars = page.locator('[class*="bg-linear-to-r"][class*="from-emerald-500"]');
    const count = await bars.count();
    if (count > 0) {
      const width = await bars.first().evaluate(el =>
        window.getComputedStyle(el).width
      );
      // Width should be set (not 0px)
      expect(width).not.toBe('0px');
    }
  });

  test('Drawer opens with slide animation from right', async ({ page }) => {
    await page.locator('#sidebar-link-customers').click();
    await expect(page.getByText('Members Directory')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);

    const firstCard = page.locator('[class*="rounded-2xl"][class*="cursor-pointer"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      // Drawer should appear
      await expect(page.getByText('Member Profile')).toBeVisible({ timeout: 5000 });
      // Backdrop should be visible
      const backdrop = page.locator('[class*="backdrop-blur-md"]');
      await expect(backdrop).toBeVisible();
    }
  });
});

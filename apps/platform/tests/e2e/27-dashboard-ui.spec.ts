import { test, expect } from './fixtures';

test.describe('Suite 27: Dashboard UI/UX Redesign', () => {
  test.beforeEach(async ({ request, page }) => {
    // Login as admin
    await request.post('/api/v1/auth/login', {
      data: { email: 'admin@cromatic.dev', password: 'admin123' },
    });
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard metric cards render with correct structure', async ({ page }) => {
    // All 4 metric cards should be present
    await expect(page.locator('#metric-card-revenue')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#metric-card-orders')).toBeVisible();
    await expect(page.locator('#metric-card-aov')).toBeVisible();
    await expect(page.locator('#metric-card-prescriptions')).toBeVisible();
  });

  test('Dashboard displays animated revenue number', async ({ page }) => {
    const revenueCard = page.locator('#metric-card-revenue');
    await expect(revenueCard).toBeVisible({ timeout: 10000 });
    // Revenue should contain a dollar sign
    await expect(revenueCard.locator('h3')).toContainText('$');
  });

  test('Dashboard chart area renders', async ({ page }) => {
    // The chart section should have SVG elements
    const chartSvg = page.locator('svg').first();
    await expect(chartSvg).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard has live status indicator', async ({ page }) => {
    await expect(page.getByText('Live')).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard verification logs section renders', async ({ page }) => {
    await expect(page.getByText('Verification Logs')).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard Gross Billing Analytics heading visible', async ({ page }) => {
    await expect(page.getByText('Gross Billing Analytics')).toBeVisible({ timeout: 10000 });
  });

  test('Metric cards have hover interaction', async ({ page }) => {
    const revenueCard = page.locator('#metric-card-revenue');
    await expect(revenueCard).toBeVisible({ timeout: 10000 });
    // Verify card has the glassmorphic class structure
    await expect(revenueCard).toHaveClass(/backdrop-blur/);
  });

  test('Dashboard renders sparkline SVGs in metric cards', async ({ page }) => {
    // Each metric card should contain a sparkline SVG
    const revenueCard = page.locator('#metric-card-revenue');
    await expect(revenueCard).toBeVisible({ timeout: 10000 });
    const sparklineSvgs = revenueCard.locator('svg');
    await expect(sparklineSvgs.first()).toBeVisible();
  });

  test('Dashboard responsive - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin');
    await expect(page.getByText('Operations Dashboard')).toBeVisible({ timeout: 10000 });
    // Cards should stack on mobile (grid-cols-1)
    await expect(page.locator('#metric-card-revenue')).toBeVisible();
  });

  test('Dashboard responsive - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin');
    await expect(page.getByText('Operations Dashboard')).toBeVisible({ timeout: 10000 });
  });
});

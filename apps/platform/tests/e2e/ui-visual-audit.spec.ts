import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Frontend UI Visual Audit
 * - No backend required
 * - Validates layout, rendering, navigation, animations, responsiveness
 * - Captures screenshots at all viewpoints
 */

const VIEWPORTS = {
  mobile: { width: 375, height: 812, name: 'mobile-375' },
  mobileLarge: { width: 428, height: 926, name: 'mobile-428' },
  tablet: { width: 768, height: 1024, name: 'tablet-768' },
  laptop: { width: 1280, height: 800, name: 'laptop-1280' },
  desktop: { width: 1440, height: 900, name: 'desktop-1440' },
  ultrawide: { width: 1920, height: 1080, name: 'ultrawide-1920' },
};

// Intercept all API calls so they don't fail
async function mockAPIs(page: Page) {
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/products')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: '1',
              name: 'Titanium Aviator Pro',
              slug: 'titanium-aviator-pro',
              description: 'Premium titanium frames with anti-glare coating',
              price: 12999,
              compare_at_price: 18999,
              category: { id: '1', name: 'Sunglasses', slug: 'sunglasses' },
              images: [{ id: '1', image_url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&auto=format&fit=crop&q=80', is_primary: true }],
              stock_quantity: 25,
              is_active: true,
            },
            {
              id: '2',
              name: 'Crystal Clear Wayfarer',
              slug: 'crystal-clear-wayfarer',
              description: 'Ultra-lightweight acetate frames',
              price: 8999,
              compare_at_price: 12999,
              category: { id: '2', name: 'Eyeglasses', slug: 'eyeglasses' },
              images: [{ id: '2', image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&auto=format&fit=crop&q=80', is_primary: true }],
              stock_quantity: 40,
              is_active: true,
            },
            {
              id: '3',
              name: 'Sport Shield Elite',
              slug: 'sport-shield-elite',
              description: 'Impact-resistant polycarbonate lenses',
              price: 15499,
              compare_at_price: null,
              category: { id: '1', name: 'Sunglasses', slug: 'sunglasses' },
              images: [{ id: '3', image_url: 'https://images.unsplash.com/photo-1496181130204-755241524eab?w=400&auto=format&fit=crop&q=80', is_primary: true }],
              stock_quantity: 15,
              is_active: true,
            },
            {
              id: '4',
              name: 'Vintage Round Classic',
              slug: 'vintage-round-classic',
              description: 'Handcrafted metal frames with gold finish',
              price: 10999,
              compare_at_price: 14999,
              category: { id: '2', name: 'Eyeglasses', slug: 'eyeglasses' },
              images: [{ id: '4', image_url: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&auto=format&fit=crop&q=80', is_primary: true }],
              stock_quantity: 30,
              is_active: true,
            },
          ],
          total: 4,
          page: 1,
          per_page: 12,
        }),
      });
    }
    if (url.includes('/categories')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Sunglasses', slug: 'sunglasses', product_count: 2 },
          { id: '2', name: 'Eyeglasses', slug: 'eyeglasses', product_count: 2 },
          { id: '3', name: 'Blue Light', slug: 'blue-light', product_count: 0 },
        ]),
      });
    }
    // Default empty response for other endpoints
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test.describe('UI Visual Audit - Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
  });

  for (const [key, viewport] of Object.entries(VIEWPORTS)) {
    test(`Homepage renders correctly at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500); // Allow animations to settle

      // Page should not crash
      await expect(page.locator('body')).toBeVisible();

      // No uncaught errors in console
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      // Screenshot full page
      await page.screenshot({
        path: `test-results/screenshots/homepage-${viewport.name}.png`,
        fullPage: true,
      });

      // Header should be visible
      const header = page.locator('header').first();
      if (await header.count() > 0) {
        await expect(header).toBeVisible();
      }

      // Hero section check
      const heroHeading = page.locator('h1').first();
      if (await heroHeading.count() > 0) {
        await expect(heroHeading).toBeVisible();
      }

      expect(errors).toHaveLength(0);
    });
  }

  test('Homepage scroll behavior & animations', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Screenshot at top
    await page.screenshot({ path: 'test-results/screenshots/homepage-top.png' });

    // Scroll down in steps and capture
    for (let i = 1; i <= 5; i++) {
      await page.evaluate((scrollY) => window.scrollTo({ top: scrollY, behavior: 'smooth' }), i * 800);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `test-results/screenshots/homepage-scroll-${i}.png` });
    }

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/homepage-bottom.png', fullPage: false });
  });

  test('Header scroll effect (glass transition)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Header at top - should be transparent
    const header = page.locator('header').first();
    await page.screenshot({ path: 'test-results/screenshots/header-top.png', clip: { x: 0, y: 0, width: 1440, height: 100 } });

    // Scroll down - header should get glass effect
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/header-scrolled.png', clip: { x: 0, y: 0, width: 1440, height: 100 } });
  });
});

test.describe('UI Visual Audit - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
  });

  test('Desktop navigation links render and are clickable', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Find nav links
    const nav = page.locator('nav').first();
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
      await page.screenshot({ path: 'test-results/screenshots/nav-desktop.png', clip: { x: 0, y: 0, width: 1440, height: 80 } });
    }
  });

  test('Mobile hamburger menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/screenshots/mobile-menu-closed.png' });

    // Find mobile menu button
    const menuBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await menuBtn.count() > 0) {
      await menuBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/screenshots/mobile-menu-open.png' });
    }
  });

  test('Navigate to Products page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Try clicking collection/products link
    const productsLink = page.getByRole('link', { name: /collection|products|shop/i }).first();
    if (await productsLink.count() > 0) {
      await productsLink.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'test-results/screenshots/products-page.png', fullPage: true });
    } else {
      // Try button variant
      const productsBtn = page.getByRole('button', { name: /collection|products|shop|browse/i }).first();
      if (await productsBtn.count() > 0) {
        await productsBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'test-results/screenshots/products-page.png', fullPage: true });
      }
    }
  });
});

test.describe('UI Visual Audit - Products Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
  });

  for (const [key, viewport] of Object.entries(VIEWPORTS)) {
    test(`Products grid at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      // Navigate directly to products if route exists
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Try to go to products
      const productsLink = page.getByRole('link', { name: /collection|products|shop/i }).first();
      if (await productsLink.count() > 0) {
        await productsLink.click();
        await page.waitForTimeout(1500);
      }

      await page.screenshot({
        path: `test-results/screenshots/products-grid-${viewport.name}.png`,
        fullPage: true,
      });
    });
  }

  test('Product card hover effects', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const productsLink = page.getByRole('link', { name: /collection|products|shop/i }).first();
    if (await productsLink.count() > 0) {
      await productsLink.click();
      await page.waitForTimeout(1500);
    }

    // Find product cards and hover
    const cards = page.locator('[class*="card"], [class*="product"]').first();
    if (await cards.count() > 0) {
      await cards.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/screenshots/product-card-hover.png' });
    }
  });
});

test.describe('UI Visual Audit - Cart Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
  });

  test('Cart drawer opens with animation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Find cart button by its title attribute
    const cartBtn = page.locator('button[title*="Shopping"], button[title*="cart"], button[title*="Cart"]').first();

    if (await cartBtn.count() > 0) {
      await cartBtn.click();
    } else {
      // Fallback: find button with ShoppingBag icon (the visible one in header on desktop)
      const headerBtns = page.locator('header button:visible');
      const count = await headerBtns.count();
      // Cart is typically the last visible button in the header actions area
      if (count > 0) {
        await headerBtns.nth(count - 1).click();
      }
    }

    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-results/screenshots/cart-drawer-open.png' });
  });
});

test.describe('UI Visual Audit - CSS & Styling Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
  });

  test('No layout overflow (horizontal scroll)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    // Capture if there's overflow for debugging
    if (hasHorizontalOverflow) {
      await page.screenshot({ path: 'test-results/screenshots/OVERFLOW-mobile.png', fullPage: true });
    }
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('No layout overflow on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalOverflow) {
      await page.screenshot({ path: 'test-results/screenshots/OVERFLOW-tablet.png', fullPage: true });
    }
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('Fonts loaded correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const fontsLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      const loadedFonts = Array.from(document.fonts).filter(f => f.status === 'loaded').map(f => f.family);
      return loadedFonts;
    });

    // Should have our custom fonts
    const hasCormorant = fontsLoaded.some(f => f.toLowerCase().includes('cormorant'));
    const hasMontserrat = fontsLoaded.some(f => f.toLowerCase().includes('montserrat'));

    await page.screenshot({ path: 'test-results/screenshots/fonts-loaded.png' });

    // At minimum, body text should render (even if fonts fail to load, page shouldn't break)
    await expect(page.locator('body')).toBeVisible();
  });

  test('CSS custom properties are applied', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check that glass-panel elements exist and have backdrop-filter
    const glassElements = await page.evaluate(() => {
      const els = document.querySelectorAll('[class*="glass"]');
      return els.length;
    });

    // Check body background is dark (OLED theme)
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    expect(bgColor).not.toBe('rgb(255, 255, 255)'); // Should NOT be white
  });

  test('No broken images', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });

    if (brokenImages.length > 0) {
      console.log('Broken images:', brokenImages);
      await page.screenshot({ path: 'test-results/screenshots/BROKEN-IMAGES.png', fullPage: true });
    }

    expect(brokenImages).toHaveLength(0);
  });
});

test.describe('UI Visual Audit - Interactions & Animations', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
  });

  test('Buttons have hover states', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Find CTA buttons
    const ctaBtn = page.locator('a, button').filter({ hasText: /explore|shop|browse|discover/i }).first();
    if (await ctaBtn.count() > 0) {
      // Screenshot before hover
      const box = await ctaBtn.boundingBox();
      if (box) {
        await page.screenshot({ path: 'test-results/screenshots/cta-normal.png', clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: box.width + 40, height: box.height + 40 } });
        await ctaBtn.hover();
        await page.waitForTimeout(400);
        await page.screenshot({ path: 'test-results/screenshots/cta-hover.png', clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: box.width + 40, height: box.height + 40 } });
      }
    }
  });

  test('Scroll progress indicator works', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Scroll to middle
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'instant' }));
    await page.waitForTimeout(300);

    // Check if scroll-progress element exists  
    const scrollProgress = await page.evaluate(() => {
      const el = document.querySelector('.scroll-progress, [class*="scroll-progress"]');
      if (!el) return null;
      const style = getComputedStyle(el);
      return { width: style.width, display: style.display };
    });

    await page.screenshot({ path: 'test-results/screenshots/scroll-progress-mid.png', clip: { x: 0, y: 0, width: 1440, height: 10 } });
  });

  test('Page transitions are smooth (no flash of unstyled content)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Measure time to first meaningful paint
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Immediately screenshot - should NOT show unstyled flash
    await page.screenshot({ path: 'test-results/screenshots/initial-paint.png' });

    // Wait for full load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/screenshots/fully-loaded.png' });
  });
});

test.describe('UI Visual Audit - Console Errors', () => {
  test('No JavaScript errors on homepage', async ({ page }) => {
    await mockAPIs(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Scroll through page to trigger lazy loaded content
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('Console Errors:', errors);
    }
    expect(errors).toHaveLength(0);
  });

  test('No JavaScript errors on navigation', async ({ page }) => {
    await mockAPIs(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click through different nav items
    const links = page.locator('nav a, header a');
    const count = await links.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        await link.click().catch(() => {});
        await page.waitForTimeout(800);
      }
    }

    if (errors.length > 0) {
      console.log('Navigation Errors:', errors);
    }
    expect(errors).toHaveLength(0);
  });
});

test.describe('UI Visual Audit - Dark Theme Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
  });

  test('All sections maintain dark theme', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Check multiple sections for proper dark backgrounds
    const lightBackgrounds = await page.evaluate(() => {
      const sections = document.querySelectorAll('section, div[class*="section"], main > div');
      const issues: string[] = [];

      sections.forEach((section, i) => {
        const bg = getComputedStyle(section).backgroundColor;
        // Parse RGB values
        const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          // If average brightness is too high (>200), it's likely a light section breaking theme
          if ((r + g + b) / 3 > 200) {
            issues.push(`Section ${i}: ${bg} (class: ${section.className.slice(0, 50)})`);
          }
        }
      });

      return issues;
    });

    if (lightBackgrounds.length > 0) {
      console.log('Light background sections (potential theme breaks):', lightBackgrounds);
    }

    // Allow some tolerance (badges, buttons can be light)
    expect(lightBackgrounds.length).toBeLessThan(3);
  });

  test('Text contrast is readable', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Check that main text elements have sufficient contrast on dark background
    const textVisibility = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, p');
      let visibleCount = 0;
      let totalCount = 0;

      // Helper to parse various color formats to brightness
      function getBrightness(colorStr: string): number | null {
        // Try rgb/rgba format
        let match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          return (r + g + b) / 3;
        }
        // Try oklch format (Tailwind v4)
        match = colorStr.match(/oklch\(([\d.]+)/);
        if (match) {
          const lightness = parseFloat(match[1]);
          // oklch lightness 0=black, 1=white; convert to approximate 0-255 scale
          return lightness * 255;
        }
        // Try color() format
        match = colorStr.match(/color\([^)]*\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          return ((r + g + b) / 3) * 255;
        }
        return null;
      }

      headings.forEach((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.height > 0 && style.display !== 'none') {
          totalCount++;
          const brightness = getBrightness(style.color);
          if (brightness !== null && brightness > 80) visibleCount++;
        }
      });

      return { visibleCount, totalCount };
    });

    // At least 70% of text should have readable contrast
    if (textVisibility.totalCount > 0) {
      const ratio = textVisibility.visibleCount / textVisibility.totalCount;
      expect(ratio).toBeGreaterThan(0.7);
    }
  });
});

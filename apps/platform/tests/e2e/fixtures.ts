import { test as base, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

/**
 * Custom Playwright fixtures for Cromatic Vision Optical E2E tests.
 *
 * Overrides the default `request` fixture to send requests directly to the Go
 * backend on port 8080, bypassing Vite's dev server. This is needed because
 * Playwright's APIRequestContext doesn't reliably go through Vite's proxy.
 *
 * Page navigation (page.goto) still uses baseURL (Vite on port 3001).
 */

const API_BASE_URL = 'http://localhost:8080';

export const test = base.extend<{ request: APIRequestContext }>({
  request: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL: API_BASE_URL,
    });
    await use(apiContext);
    await apiContext.dispose();
  },
});

export { expect };

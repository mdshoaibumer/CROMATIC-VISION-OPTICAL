import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

/**
 * Playwright E2E Configuration for Cromatic Vision Optical
 *
 * Architecture:
 *   - Go devserver (in-memory mock): http://localhost:8080
 *   - Vite frontend (React SPA):     http://localhost:3001 (proxies /api → 8080)
 *
 * baseURL is set to the frontend for page.goto() navigation.
 * API tests use custom fixtures from ./tests/e2e/fixtures.ts that route to port 8080.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 8000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1,
  reporter: [['html'], ['list']],
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-headed',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: [
    {
      command: 'go run cmd/devserver/main.go',
      port: 8080,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      port: 3001,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    }
  ],
});

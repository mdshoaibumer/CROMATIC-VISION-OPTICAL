import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

export default defineConfig({
  // globalSetup: './tests/e2e/global.setup.ts', // Disabled: requires Postgres
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 8000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // run serially to avoid database concurrency conflicts
  reporter: [['html'], ['list']],
  use: {
    actionTimeout: 0,
    // Frontend Vite dev server runs on 3001; backend Go API runs on 3000.
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
      // Dev server with in-memory mock repos — no Docker/Postgres/Redis needed
      command: 'go run cmd/devserver/main.go',
      port: 3000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      // Vite React frontend — runs on port 3001 (package.json: "dev": "vite --port=3001")
      command: 'npm run dev',
      port: 3001,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    }
  ],
});

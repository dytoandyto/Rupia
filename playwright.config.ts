import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    ...devices['iPhone 14'], // Mobile viewport 390x844
  },
  webServer: {
    command: 'npm.cmd run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});


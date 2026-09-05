import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    { command: 'PORT=8787 DATA_DIR=.test-data/service npm run dev:service', url: 'http://127.0.0.1:8787/health', timeout: 120_000, reuseExistingServer: false },
    { command: 'npm run dev', url: 'http://127.0.0.1:5173', timeout: 120_000, reuseExistingServer: false },
  ],
});

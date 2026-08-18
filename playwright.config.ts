import { defineConfig } from '@playwright/test';

const host = '127.0.0.1';
const port = Number(process.env.AR_PLAYWRIGHT_PORT || 4173);
const baseURL = process.env.AR_PLAYWRIGHT_BASE_URL || `http://${host}:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  outputDir: './node_modules/.cache/playwright-test-results',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL,
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.AR_PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          BROWSER: 'none',
          HOST: host,
          PORT: String(port),
          WDS_SOCKET_PORT: '0',
        },
      },
});

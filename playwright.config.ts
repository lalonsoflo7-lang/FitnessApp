import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs the production build (with the service worker) against the Firebase Emulator Suite.
 * Run with `npm run test:e2e`, which starts the emulators first.
 * Set CHROMIUM_PATH to use a preinstalled Chromium instead of Playwright's download.
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Pixel 7'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || undefined,
      // Talk to localhost/emulators directly even when an HTTP proxy is configured.
      args: ['--no-proxy-server'],
    },
  },
  webServer: {
    command: `npm run build:e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

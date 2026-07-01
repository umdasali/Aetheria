// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Aetheria – Responsive / Layout Playwright config.
 *
 * All tests run against the Expo web build (expo start --web).
 * The app is landscape-only, so every viewport is W > H.
 */
module.exports = defineConfig({
  testDir: './tests/responsive',
  testMatch: '**/*.spec.js',
  timeout: 60_000,
  retries: 1,
  workers: 1, // serial – single Expo web server

  use: {
    baseURL: 'http://localhost:8081',
    headless: true,
    screenshot: 'on',          // save screenshots for all tests
    video: 'off',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
  },

  outputDir: 'test-results/screenshots',

  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
  ],

  // Landscape device matrix
  projects: [
    // ── Phones ──────────────────────────────────────────────────────────────
    {
      name: 'iPhone SE landscape',
      use: { viewport: { width: 667, height: 375 } },
    },
    {
      name: 'iPhone 14 landscape',
      use: { viewport: { width: 844, height: 390 } },
    },
    {
      name: 'iPhone 14 Plus landscape',
      use: { viewport: { width: 932, height: 430 } },
    },
    {
      name: 'Samsung Galaxy S23 landscape',
      use: { viewport: { width: 915, height: 412 } },
    },
    {
      name: 'Pixel 7 landscape',
      use: { viewport: { width: 869, height: 411 } },
    },

    // ── Tablets ─────────────────────────────────────────────────────────────
    {
      name: 'iPad Mini landscape',
      use: { viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'iPad Air landscape',
      use: { viewport: { width: 1180, height: 820 } },
    },
    {
      name: 'iPad Pro 11 landscape',
      use: { viewport: { width: 1194, height: 834 } },
    },
    {
      name: 'iPad Pro 12.9 landscape',
      use: { viewport: { width: 1366, height: 1024 } },
    },

    // ── Desktop / TV ─────────────────────────────────────────────────────────
    {
      name: 'Desktop HD',
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'Desktop FHD',
      use: { viewport: { width: 1920, height: 1080 } },
    },
  ],

  // Auto-start Expo web server before tests run
  webServer: {
    command: 'EXPO_NO_DOCTOR=1 npx expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

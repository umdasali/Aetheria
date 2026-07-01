// @ts-check
/**
 * Snapshot suite – captures a screenshot on every viewport immediately after
 * the app loads and the loading screen finishes. Useful for quick visual
 * diffing across device sizes.
 *
 * Run: npm run test:responsive
 * View: npm run test:responsive:report
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const SCREENS_DIR = 'test-results/screenshots';

async function waitForApp(page) {
  await page.waitForSelector('#root, .css-view-175oi2r', {
    state: 'visible',
    timeout: 25_000,
  });
  // Loading screen takes ~3.4 s; wait 8 s to clear it + any transition animation
  await page.waitForTimeout(8000);
  // Dismiss onboarding if it appears
  const skip = page.getByText(/skip/i);
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await page.waitForTimeout(800);
  }
}

test('responsive snapshot – home screen', async ({ page }, testInfo) => {
  const { width, height } = testInfo.project.use.viewport;
  const dir = path.join(SCREENS_DIR, testInfo.project.name.replace(/\s+/g, '-'));
  fs.mkdirSync(dir, { recursive: true });

  await page.goto('/');
  await waitForApp(page);

  // ── Layout measurements ─────────────────────────────────────────────────

  const metrics = await page.evaluate(() => {
    const html = document.documentElement;
    return {
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      scrollHeight: html.scrollHeight,
      clientHeight: html.clientHeight,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });

  // ── Assertions ──────────────────────────────────────────────────────────

  // 1. No horizontal scroll
  expect(
    metrics.scrollWidth,
    `Horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth}`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);

  // 2. Viewport width/height match what Playwright set
  expect(metrics.innerWidth).toBe(width);
  expect(metrics.innerHeight).toBe(height);

  // 3. Landscape check
  expect(width).toBeGreaterThan(height);

  // ── Screenshot ──────────────────────────────────────────────────────────
  const screenshotPath = path.join(dir, `home-${width}x${height}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  // Attach to Playwright HTML report
  await testInfo.attach(`home-${width}x${height}`, {
    path: screenshotPath,
    contentType: 'image/png',
  });

  // ── Log layout summary ──────────────────────────────────────────────────
  console.log(`
  [${testInfo.project.name}]  ${width}×${height}
    scrollWidth  : ${metrics.scrollWidth}
    clientWidth  : ${metrics.clientWidth}
    scrollHeight : ${metrics.scrollHeight}
    clientHeight : ${metrics.clientHeight}
    overflow H   : ${metrics.scrollWidth > metrics.clientWidth + 1 ? '⚠️  YES' : '✅ none'}
    landscape    : ${width > height ? '✅' : '❌'}
  `);
});

test('responsive snapshot – loading screen', async ({ page }, testInfo) => {
  const { width, height } = testInfo.project.use.viewport;
  const dir = path.join(SCREENS_DIR, testInfo.project.name.replace(/\s+/g, '-'));
  fs.mkdirSync(dir, { recursive: true });

  await page.goto('/');
  // Capture loading screen before it finishes
  await page.waitForSelector('#root, .css-view-175oi2r', { state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(800); // mid-progress

  const screenshotPath = path.join(dir, `loading-${width}x${height}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await testInfo.attach(`loading-${width}x${height}`, {
    path: screenshotPath,
    contentType: 'image/png',
  });

  // No horizontal overflow even on loading screen
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

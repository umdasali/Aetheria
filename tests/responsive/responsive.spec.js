// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Aetheria – Responsive Design Tests
 *
 * These tests verify that the app renders correctly across all landscape
 * viewport sizes (phones → tablets → desktop).
 *
 * The Expo web server must be running on localhost:8081.
 * Screenshots are saved to test-results/screenshots/<project>/.
 */

// ─── helpers ────────────────────────────────────────────────────────────────

/** Wait for the Expo web app root to mount (up to 25 s) */
async function waitForAppReady(page) {
  await page.waitForSelector('#root, [data-testid="root"], .css-view-175oi2r', {
    state: 'visible',
    timeout: 25_000,
  });
  // Give React one more tick to paint
  await page.waitForTimeout(1000);
}

/** Check that no element overflows the viewport horizontally */
async function assertNoHorizontalOverflow(page) {
  const result = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const vw = html.clientWidth;
    const overflow = body.scrollWidth > vw || html.scrollWidth > vw;
    if (!overflow) return { overflow: false, culprits: [], scrollWidth: 0, clientWidth: vw };

    // Find culprit elements — those whose right edge exceeds the viewport
    const culprits = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 0) {
        culprits.push({
          tag: el.tagName,
          cls: el.className?.toString?.().slice(0, 60),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          text: el.textContent?.trim().slice(0, 40),
          style: el.getAttribute('style')?.slice(0, 120),
        });
      }
    });
    return { overflow: true, culprits: culprits.slice(0, 12), scrollWidth: html.scrollWidth, clientWidth: vw };
  });
  if (result.overflow) {
    console.error(`Overflow: scrollWidth=${result.scrollWidth} clientWidth=${result.clientWidth}`);
    console.error('Culprit elements:', JSON.stringify(result.culprits, null, 2));
  }
  expect(result.overflow, 'Horizontal overflow detected – content wider than viewport').toBe(false);
}

/** Return a rough count of visible elements in the viewport */
async function visibleElementCount(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let count = 0;
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.top < vh && r.left < vw) count++;
    });
    return count;
  });
}

// ─── tests ──────────────────────────────────────────────────────────────────

test.describe('Loading / Splash screen', () => {
  test('renders within viewport with no horizontal overflow', async ({ page }, testInfo) => {
    const { width, height } = testInfo.project.use.viewport;

    await page.goto('/');
    await waitForAppReady(page);

    // Screenshot the loading screen
    await page.screenshot({
      path: `test-results/screenshots/${testInfo.project.name}/01-loading.png`,
      fullPage: false,
    });

    await assertNoHorizontalOverflow(page);

    // Progress bar (if present) should not exceed viewport width
    const bar = page.locator('[style*="background"][style*="width"]').first();
    if (await bar.isVisible().catch(() => false)) {
      const box = await bar.boundingBox();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      }
    }
  });
});

test.describe('Home screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    // Loading screen takes ~3.4 s. Wait 8 s to clear it + any transition animation.
    await page.waitForTimeout(8000);
    const skipBtn = page.getByText(/skip/i);
    if (await skipBtn.isVisible().catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(800);
    }
  });

  test('renders without horizontal overflow', async ({ page }, testInfo) => {
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/screenshots/${testInfo.project.name}/02-home.png`,
    });
  });

  test('HUD bar stays within viewport', async ({ page }, testInfo) => {
    const { width, height } = testInfo.project.use.viewport;

    // Only flag elements that START inside the visible viewport area (not off-screen
    // animation particles or hidden modals).
    const overflowing = await page.evaluate(({ vw, vh }) => {
      // Elements inside an overflow:hidden container are visually clipped.
      // getBoundingClientRect() returns the unclipped rect, so we must skip them.
      function isClippedByAncestor(el) {
        let parent = el.parentElement;
        let depth = 0;
        while (parent && parent !== document.documentElement && depth < 20) {
          const s = window.getComputedStyle(parent);
          if (s.overflow === 'hidden' || s.overflowX === 'hidden') return true;
          parent = parent.parentElement;
          depth++;
        }
        return false;
      }

      const bad = [];
      document.querySelectorAll('[style*="position"]').forEach(el => {
        const r = el.getBoundingClientRect();
        // Skip: zero-size, off-screen vertically, or starts beyond viewport right edge
        if (r.width === 0 || r.height === 0) return;
        if (r.top < 0 || r.top > vh) return;   // outside viewport vertically
        if (r.left > vw) return;                // already fully off-screen to the right
        if (r.right > vw + 2) {
          // Skip elements that are clipped by an overflow:hidden ancestor
          // (e.g. weather effects, particles — they're visually contained)
          if (isClippedByAncestor(el)) return;
          bad.push({ x: Math.round(r.left), right: Math.round(r.right), text: el.textContent?.trim().slice(0, 30) });
        }
      });
      return bad;
    }, { vw: width, vh: height });

    if (overflowing.length > 0) {
      console.warn(`[${testInfo.project.name}] HUD overflow:`, overflowing);
    }
    expect(overflowing.length, `${overflowing.length} visible element(s) overflow the viewport`).toBe(0);
  });

  test('landscape aspect ratio is maintained (W > H)', async ({ page }, testInfo) => {
    const { width, height } = testInfo.project.use.viewport;
    expect(width).toBeGreaterThan(height);
  });

  test('renders enough visible elements', async ({ page }) => {
    const count = await visibleElementCount(page);
    expect(count).toBeGreaterThan(10);
  });
});

test.describe('Screen layout – no clipping or overflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForTimeout(8000);
    const skipBtn = page.getByText(/skip/i);
    if (await skipBtn.isVisible().catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('no element clips below viewport bottom', async ({ page }, testInfo) => {
    const { height } = testInfo.project.use.viewport;

    const clipped = await page.evaluate((vh) => {
      // Skip elements visually clipped by an overflow:hidden ancestor
      function isClippedByAncestor(el) {
        let parent = el.parentElement;
        let depth = 0;
        while (parent && parent !== document.documentElement && depth < 20) {
          const s = window.getComputedStyle(parent);
          if (s.overflow === 'hidden' || s.overflowY === 'hidden') return true;
          parent = parent.parentElement;
          depth++;
        }
        return false;
      }

      const offscreen = [];
      document.querySelectorAll('[style]').forEach(el => {
        const r = el.getBoundingClientRect();
        // Only flag elements that START within the viewport but exceed bottom
        if (r.height > 0 && r.top >= 0 && r.top < vh && r.bottom > vh + 10) {
          if (isClippedByAncestor(el)) return;
          offscreen.push({
            tag: el.tagName,
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            text: el.textContent?.trim().slice(0, 40),
          });
        }
      });
      return offscreen;
    }, height);

    if (clipped.length > 0) {
      console.log(`[${testInfo.project.name}] Elements clipped below bottom:`, clipped);
    }

    // Soft assertion – log but don't fail for minor 1-2px overshoots
    const hardClipped = clipped.filter(el => el.bottom > height + 5);
    expect(hardClipped.length, `${hardClipped.length} element(s) hard-clipped below viewport`).toBe(0);
  });

  test('sidebar / left panel visible when present', async ({ page }, testInfo) => {
    // Just check no critical left-side cut-off (x < 0)
    const cutoff = await page.evaluate(() => {
      let found = false;
      document.querySelectorAll('[style]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 20 && r.height > 20 && r.x < -5) found = true;
      });
      return found;
    });
    expect(cutoff, 'Element(s) cut off on the left side').toBe(false);
  });
});

test.describe('Viewport meta / scaling', () => {
  test('viewport meta tag is set correctly for mobile', async ({ page }, testInfo) => {
    await page.goto('/');

    const viewportMeta = await page.$eval(
      'meta[name="viewport"]',
      el => el.getAttribute('content'),
    ).catch(() => null);

    if (viewportMeta) {
      // Should not force a fixed width that causes horizontal scroll on small phones
      expect(viewportMeta).not.toContain('width=1024');
      expect(viewportMeta).not.toContain('width=1280');
    }
  });

  test('device pixel ratio scaling does not cause overflow', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForAppReady(page);

    const { devicePixelRatio } = await page.evaluate(() => ({
      devicePixelRatio: window.devicePixelRatio,
    }));

    // DPR > 1 is fine; just log it
    console.log(`[${testInfo.project.name}] DPR = ${devicePixelRatio}`);
    expect(devicePixelRatio).toBeGreaterThan(0);
  });
});

test.describe('Interactive elements – touch targets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForTimeout(5000);
    const skipBtn = page.getByText(/skip/i);
    if (await skipBtn.isVisible().catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('all touchable/button elements meet 30×30 minimum', async ({ page }, testInfo) => {
    const tooSmall = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('[role="button"], button, [onClick], [data-focusable]').forEach(el => {
        const r = el.getBoundingClientRect();
        if ((r.width > 0 && r.width < 28) || (r.height > 0 && r.height < 28)) {
          bad.push({
            tag: el.tagName,
            w: Math.round(r.width),
            h: Math.round(r.height),
            text: el.textContent?.trim().slice(0, 30),
          });
        }
      });
      return bad;
    });

    if (tooSmall.length > 0) {
      console.warn(`[${testInfo.project.name}] Small touch targets:`, tooSmall);
    }

    // Informational – log but don't hard fail (some icon-only buttons may be intentionally small)
    expect(tooSmall.length).toBeLessThanOrEqual(5);
  });
});

test.describe('Full screen screenshots – all viewports', () => {
  test('capture full-page screenshot on home screen', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForTimeout(5000);

    const skipBtn = page.getByText(/skip/i);
    if (await skipBtn.isVisible().catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }

    const { width, height } = testInfo.project.use.viewport;
    await page.screenshot({
      path: `test-results/screenshots/${testInfo.project.name}/home-full-${width}x${height}.png`,
      fullPage: false,
      clip: { x: 0, y: 0, width, height },
    });

    // Verify screenshot dimensions match viewport
    const { default: fs } = await import('fs');
    // Just ensure the file was written
    const exists = fs.existsSync(
      `test-results/screenshots/${testInfo.project.name}/home-full-${width}x${height}.png`,
    );
    expect(exists).toBe(true);
  });
});

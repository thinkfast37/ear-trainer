import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

test.describe('US-3.4 Anchor-song reference', () => {
  test('AC-3.4.3 — Anchor songs are browsable without starting a session', async ({ page }) => {
    await open(page, '#/level/intervals/3');
    await page.locator('[data-action="open-reference"]').tap();
    await expect(page.locator('[data-role="reference"]')).toBeVisible();
    const sections = page.locator('[data-role="reference"] > section[data-interval]');
    await expect(sections).toHaveCount(5);
    for (const iv of ['P8', 'P5', 'M3', 'm3', 'P4']) {
      const sec = page.locator(`[data-role="reference"] > section[data-interval="${iv}"]`);
      // one panel per direction (AC-3.4.2), each with at least one anchor
      await expect(sec.locator('[data-role="anchors"]')).toHaveCount(2);
      await expect(sec.locator('[data-role="anchors"][data-direction="asc"]')).toHaveCount(1);
      await expect(sec.locator('[data-role="anchors"][data-direction="desc"]')).toHaveCount(1);
      expect(await sec.locator('[data-role="anchor-list"] li').count()).toBeGreaterThan(1);
    }
    // no session was started
    const started = await page.evaluate(() => Boolean(window.__test.session));
    expect(started).toBe(false);
    expect(page.url()).toContain('#/reference/intervals/3');
  });
});

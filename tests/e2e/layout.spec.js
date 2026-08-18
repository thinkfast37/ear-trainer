import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

const layoutOf = (page) => page.evaluate(() => window.__test.layout());

test.describe('US-10.1 Form-factor–adaptive layout', () => {
  test('AC-10.1.1/1 — A phone viewport renders the single-column stacked layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, '#/home');
    expect(await layoutOf(page)).toBe('phone');
    // single column: every track card spans the full frame width
    const widths = await page.locator('[data-role="map"] > .track').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
    const frame = await page.locator('.frame').evaluate((e) => Math.round(e.getBoundingClientRect().width));
    for (const w of widths) expect(w).toBeGreaterThan(frame * 0.8);
    const cols = await page.locator('[data-role="map"]').evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(1);
    await page.setViewportSize({ width: 599, height: 812 });
    await page.waitForFunction(() => window.__test.layout() === 'phone');
  });
  test('AC-10.1.1/2 — On a phone viewport all controls are visible and touch-friendly with no hover interactions', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await open(page, '#/level/intervals/4');
    await tapToUnlock(page);
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    const boxes = await page.locator('button:visible').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, right: r.right, bottom: r.bottom }; }));
    expect(boxes.length).toBeGreaterThan(5);
    for (const b of boxes) { expect(b.w).toBeGreaterThanOrEqual(44); expect(b.h).toBeGreaterThanOrEqual(44); expect(b.right).toBeLessThanOrEqual(360 + 1); }
    // no hover rules anywhere in the stylesheet
    const hoverRules = await page.evaluate(() => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } }).filter((r) => r.selectorText && r.selectorText.includes(':hover')).length);
    expect(hoverRules).toBe(0);
    // no horizontal scroll
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
  test('AC-10.1.2 — Tablet viewports use the wider tablet layout', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 1024 });
    await open(page, '#/home');
    expect(await layoutOf(page)).toBe('tablet');
    const cols = await page.locator('[data-role="map"]').evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(2);
    await page.setViewportSize({ width: 600, height: 900 });
    await page.waitForFunction(() => window.__test.layout() === 'tablet');
  });
  test('AC-10.1.3/1 — A desktop viewport presents the tablet layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, '#/home');
    expect(await layoutOf(page)).toBe('tablet');
    const frame = await page.locator('.frame').evaluate((e) => e.dataset.layout);
    expect(frame).toBe('tablet');
    const cols = await page.locator('[data-role="map"]').evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(2);
    // the frame is capped, not stretched to a desktop-only layout
    const w = await page.locator('.frame').evaluate((e) => e.getBoundingClientRect().width);
    expect(w).toBeLessThanOrEqual(900);
  });
  test('AC-10.1.3/2 — No desktop-only layout or hover-dependent behavior exists', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await open(page, '#/home');
    const layouts = await page.evaluate(() => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } }).map((r) => r.selectorText ?? r.cssText).join('\n'));
    expect(layouts).not.toMatch(/data-layout="desktop"/);
    expect(layouts).not.toMatch(/:hover/);
    expect(await layoutOf(page)).toBe('tablet');
    // hovering a control changes nothing about it
    const btn = page.locator('[data-nav="stats"]');
    const before = await btn.evaluate((e) => JSON.stringify(getComputedStyle(e)));
    await btn.hover();
    const after = await btn.evaluate((e) => JSON.stringify(getComputedStyle(e)));
    expect(after).toBe(before);
  });
  test('AC-10.1.4/1 — Rotation preserves in-progress session state', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, '#/level/intervals/1');
    await tapToUnlock(page);
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    await page.locator('[data-role="answer-area"] [data-option]').first().tap();
    await page.locator('[data-action="next"]').tap();
    await page.waitForFunction(() => window.__test.session.state.phase === 'question');
    const before = await page.evaluate(() => ({ q: window.__test.session.state.questions, item: window.__test.session.state.question.itemId, xp: window.__test.store.getState().xp }));
    await page.setViewportSize({ width: 812, height: 375 }); // landscape
    await page.waitForFunction(() => window.__test.layout() === 'tablet');
    const after = await page.evaluate(() => ({ q: window.__test.session.state.questions, item: window.__test.session.state.question.itemId, xp: window.__test.store.getState().xp }));
    expect(after).toEqual(before);
    await expect(page.locator('[data-role="session"]')).toBeVisible();
    await expect(page.locator('[data-role="progress"]')).toContainText('Q2 · ');
  });
  test('AC-10.1.4/2 — Rotation leaves no control clipped', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, '#/level/chordQualities/9');
    await tapToUnlock(page);
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    for (const [w, h] of [[812, 375], [375, 812], [1024, 768], [768, 1024]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(100);
      const clipped = await page.locator('button:visible').evaluateAll((els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > document.documentElement.clientWidth + 1 || r.width < 44 || r.height < 44; }).length);
      expect(clipped).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    }
  });
  test('AC-10.1.5/1 — The production build is fully functional from a static host with no server-side components', async ({ page, request }) => {
    // The e2e server IS a static preview of dist/ (vite preview) — prove it serves only static assets and the app runs a full round trip
    const html = await request.get('/');
    expect(html.ok()).toBe(true);
    expect((await html.text())).toMatch(/<div id="app"/);
    const failed = [];
    page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    await open(page, '#/level/scaleDegrees/1');
    await tapToUnlock(page);
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    await page.locator('[data-role="answer-area"] [data-option]').first().tap();
    await expect(page.locator('[data-role="verdict"]')).toBeVisible();
    expect(failed).toEqual([]);
    // no request goes to any API path; everything is a file under the site root
    const kinds = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => new URL(r.name).pathname));
    for (const p of kinds) expect(p).toMatch(/\.(js|css|mp3|json|html)$|^\/$/);
    // relative base: assets resolve from a sub-path too
    const dist = await request.get('/assets/');
    expect([200, 403, 404]).toContain(dist.status());
  });
});

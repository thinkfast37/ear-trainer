import { test, expect } from '@playwright/test';
import { open, tapToUnlock, patchState } from './helpers.js';

async function startLevel(page, level) {
  await open(page, `#/level/intervals/${level}`);
  await tapToUnlock(page);
  await page.getByRole('button', { name: 'Start' }).tap();
  await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
}

test.describe('US-3.3 Interval answer input', () => {
  test('AC-3.3.1/1 — Only the level 3 interval buttons P8, P5, M3, m3, P4 are shown', async ({ page }) => {
    await startLevel(page, 3);
    const opts = await page.locator('[data-role="answer-area"] [data-option]').evaluateAll((els) => els.map((e) => e.dataset.option).sort());
    expect(opts).toEqual(['M3', 'P4', 'P5', 'P8', 'm3'].sort());
  });
  test('AC-3.3.1/2 — Each interval answer touch target is at least 44 px', async ({ page }) => {
    await startLevel(page, 3);
    const boxes = await page.locator('[data-role="answer-area"] [data-option]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; }));
    expect(boxes.length).toBe(5);
    for (const [w, h] of boxes) { expect(w).toBeGreaterThanOrEqual(44); expect(h).toBeGreaterThanOrEqual(44); }
  });
  test('AC-3.3.2 — The label setting switches interval buttons to full names', async ({ page }) => {
    await open(page, '#/home');
    await patchState(page, { settings: { ...(await page.evaluate(() => window.__test.settings())), labels: { degrees: 'both', chords: 'symbolAndName', intervals: 'full' } } });
    await startLevel(page, 2);
    const labels = await page.locator('[data-role="answer-area"] [data-option]').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    expect(labels.sort()).toEqual(['octave', 'perfect 5th', 'major 3rd', 'minor 3rd'].sort());
    expect(labels).not.toContain('m3');
  });
});

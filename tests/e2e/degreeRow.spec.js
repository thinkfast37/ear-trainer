import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

async function startDegrees(page, level = 1) {
  await open(page, `#/level/scaleDegrees/${level}`);
  await tapToUnlock(page);
  await page.getByRole('button', { name: 'Start' }).tap();
  await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
}

test.describe('US-4.3 Degree answer input', () => {
  test('AC-4.3.1 — Degree buttons show syllable and number when the setting is "both"', async ({ page }) => {
    await open(page, '#/home');
    const isBoth = await page.evaluate(() => window.__test.settings().labels.degrees === 'both');
    expect(isBoth).toBe(true);
    await startDegrees(page, 1);
    const labels = await page.locator('[data-role="answer-area"] [data-option]').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    expect(labels).toEqual(expect.arrayContaining(['Do · 1', 'Mi · 3', 'Sol · 5']));
  });
  test('AC-4.3.2 — The degree answer row is scoped to the level pool', async ({ page }) => {
    await startDegrees(page, 1);
    const opts = await page.locator('[data-role="answer-area"] [data-option]').evaluateAll((els) => els.map((e) => e.dataset.option).sort());
    expect(opts).toEqual(['Do', 'Mi', 'Sol']);
  });
});

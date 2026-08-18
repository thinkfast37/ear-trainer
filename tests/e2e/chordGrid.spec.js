import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

test.describe('US-5.3 Chord quality answer input', () => {
  test('AC-5.3.1/1 — The m7b5 button reads m7♭5 · half-diminished', async ({ page }) => {
    await open(page, '#/level/chordQualities/7');
    await tapToUnlock(page);
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    await expect(page.locator('[data-role="answer-area"] [data-option="m7b5"]')).toHaveText('m7♭5 · half-diminished');
  });
  test("AC-5.3.1/2 — Only the chord level's pool is shown", async ({ page }) => {
    await open(page, '#/level/chordQualities/7');
    await tapToUnlock(page);
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    const opts = await page.locator('[data-role="answer-area"] [data-option]').evaluateAll((els) => els.map((e) => e.dataset.option).sort());
    expect(opts).toEqual(['dim7', 'dom7', 'm7', 'm7b5', 'maj7']);
  });
});

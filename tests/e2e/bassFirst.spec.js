import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

test.describe('US-8.4 Bass-first sub-mode', () => {
  test('AC-8.4.1/1 — Step 1 asks for the bass scale degrees', async ({ page }) => {
    await open(page, '#/level/progressions/2');
    await tapToUnlock(page);
    await page.locator('[data-role="bass-first-toggle"]').check();
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    await expect(page.locator('[data-role="step-indicator"]')).toHaveText('Step 1 of 2');
    await expect(page.locator('[data-role="step-prompt"]')).toContainText('bass scale degrees');
    const opts = await page.locator('[data-role="options"] [data-option]').evaluateAll((els) => els.map((e) => e.dataset.option));
    expect(opts).toEqual(expect.arrayContaining(['1', '2', '3', '4', '5', '6', '7']));
    expect(opts).not.toContain('I');
  });
  test('AC-8.4.1/2 — Step 2 asks for the full roman numerals', async ({ page }) => {
    await open(page, '#/level/progressions/2');
    await tapToUnlock(page);
    await page.locator('[data-role="bass-first-toggle"]').check();
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    await page.evaluate(() => window.__test.session.submit(window.__test.session.state.question.steps[0].answer));
    await expect(page.locator('[data-role="step-indicator"]')).toHaveText('Step 2 of 2');
    await expect(page.locator('[data-role="step-prompt"]')).toContainText('roman numerals');
    const opts = await page.locator('[data-role="options"] [data-option]').evaluateAll((els) => els.map((e) => e.dataset.option).sort());
    expect(opts).toEqual(['I', 'IV', 'V', 'vi']);
  });
  test('AC-8.4.1/3 — Each bass-first step is scored separately', async ({ page }) => {
    await open(page, '#/level/progressions/2');
    await tapToUnlock(page);
    await page.locator('[data-role="bass-first-toggle"]').check();
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    const scores = await page.evaluate(() => {
      const s = window.__test.session; const q = s.state.question;
      const bass = q.steps[0].answer; const wrongBass = bass.map((b, i) => (i === 0 ? (b === '1' ? '5' : '1') : b));
      s.submit(wrongBass);           // step 1: one wrong
      s.submit(q.steps[1].answer);   // step 2: all right
      return s.state.result.steps.map((st) => ({ kind: st.kind, matches: st.matches, total: st.total }));
    });
    expect(scores.length).toBe(2);
    expect(scores[0].kind).toBe('bass'); expect(scores[0].matches).toBe(scores[0].total - 1);
    expect(scores[1].kind).toBe('numerals'); expect(scores[1].matches).toBe(scores[1].total);
    const li = page.locator('[data-role="step-scores"] li');
    await expect(li).toHaveCount(2);
    await expect(li.nth(0)).toContainText('Bass degrees');
    await expect(li.nth(1)).toContainText('Roman numerals');
  });
  test('AC-8.4.2/1 — The bass-first toggle is unavailable at progression level 1', async ({ page }) => {
    await open(page, '#/level/progressions/1');
    await expect(page.locator('[data-role="bass-first-toggle"]')).toHaveCount(0);
    await expect(page.locator('[data-role="bass-first-unavailable"]')).toContainText('available from Level 2');
  });
  test('AC-8.4.2/2 — The bass-first toggle is available from progression level 2 onward', async ({ page }) => {
    for (const lvl of [2, 3, 7, 13]) {
      await open(page, `#/level/progressions/${lvl}`);
      await expect(page.locator('[data-role="bass-first-toggle"]')).toBeVisible();
      await expect(page.locator('[data-role="bass-first-unavailable"]')).toHaveCount(0);
    }
  });
});

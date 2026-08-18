import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

async function startProgressions(page, level = 2) {
  await open(page, `#/level/progressions/${level}`);
  await tapToUnlock(page);
  await page.getByRole('button', { name: 'Start' }).tap();
  await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
}
const seq = (page) => page.locator('[data-role="sequence"] .tok[data-index]').evaluateAll((els) => els.map((e) => e.textContent.trim()));

test.describe('US-8.3 Roman numeral answer input', () => {
  test('AC-8.3.1 — The numeral row is scoped to the level vocabulary', async ({ page }) => {
    await startProgressions(page, 2);
    const opts = await page.locator('[data-role="options"] [data-option]').evaluateAll((els) => els.map((e) => e.dataset.option).sort());
    expect(opts).toEqual(['I', 'IV', 'V', 'vi']);
  });
  test('AC-8.3.2/1 — Tapping a numeral appends to the visible numeral sequence', async ({ page }) => {
    await startProgressions(page, 2);
    expect(await seq(page)).toEqual([]);
    await page.locator('[data-option="I"]').tap(); await page.locator('[data-option="V"]').tap(); await page.locator('[data-option="vi"]').tap();
    expect(await seq(page)).toEqual(['I', 'V', 'vi']);
  });
  test('AC-8.3.2/2 — Delete-last, clear-all and insert-at-cursor edit the numeral sequence', async ({ page }) => {
    await startProgressions(page, 2);
    for (const n of ['I', 'V', 'vi', 'IV']) await page.locator(`[data-option="${n}"]`).tap();
    await page.locator('[data-action="delete-last"]').tap();
    expect(await seq(page)).toEqual(['I', 'V', 'vi']);
    // insert at cursor: tap the second token to place the cursor before it, then a numeral
    await page.locator('[data-role="sequence"] .tok[data-index="1"]').tap();
    await page.locator('[data-option="IV"]').tap();
    expect(await seq(page)).toEqual(['I', 'IV', 'V', 'vi']);
    await page.locator('[data-action="clear-all"]').tap();
    expect(await seq(page)).toEqual([]);
    await expect(page.locator('[data-action="submit"]')).toBeDisabled();
  });
});

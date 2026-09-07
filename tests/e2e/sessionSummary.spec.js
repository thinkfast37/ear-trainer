import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

/** Start intervals level 1 and answer `n` questions through the UI. */
async function practise(page, n) {
  await open(page, '#/level/intervals/1');
  await tapToUnlock(page);
  await page.getByRole('button', { name: 'Start' }).tap();
  await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
  for (let i = 0; i < n; i++) {
    await page.locator('[data-role="answer-area"] [data-option]').first().tap();
    if (i < n - 1) {
      await page.locator('[data-action="next"]').tap();
      await page.waitForFunction(() => window.__test.session.state.phase === 'question');
    }
  }
}

test.describe('US-2.6 — ending a session', () => {
  test("AC-2.6.3/1 — The summary shows the session's questions answered and correct count", async ({ page }) => {
    await practise(page, 3);
    await page.locator('[data-action="end-session"]').tap();
    const summary = page.locator('[data-role="session-summary"]');
    await expect(summary).toBeVisible();
    await expect(summary.locator('[data-role="session-tally"]')).toContainText('3 questions answered');
    // and the summary is readable where it appears, without scrolling
    const box = await summary.boundingBox();
    const viewport = page.viewportSize();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("AC-2.6.3/2 — The summary shows the level's three mastery conditions with current values", async ({ page }) => {
    await practise(page, 3);
    await page.locator('[data-action="end-session"]').tap();
    const panel = page.locator('[data-role="session-summary"] [data-role="mastery-progress"]');
    await expect(panel.locator('[data-condition="answers"]')).toContainText('3/10');
    await expect(panel.locator('[data-condition="accuracy"]')).toContainText('90%');
    await expect(panel.locator('[data-condition="boxes"]')).toContainText('/2');
  });

  test('AC-2.6.3/3 — The summary states that progress is saved', async ({ page }) => {
    await practise(page, 2);
    await page.locator('[data-action="end-session"]').tap();
    await expect(page.locator('[data-role="session-summary"] [data-role="saved-note"]')).toContainText(/saved/i);
    // the claim is true: the answers survive a reload
    await page.reload();
    await page.waitForFunction(() => window.__test && window.__test.ready === true);
    const answered = await page.evaluate(() => window.__test.store.getState().levels['intervals:1'].history.length);
    expect(answered).toBe(2);
  });

  test('AC-2.6.3/4 — Dismissing the summary returns to the menu', async ({ page }) => {
    await practise(page, 2);
    await page.locator('[data-action="end-session"]').tap();
    await page.locator('[data-action="summary-close"]').tap();
    await expect(page.locator('[data-role="map"]')).toBeVisible();
    await expect(page.locator('[data-role="session-summary"]')).toHaveCount(0);
  });
});

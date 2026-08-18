import { test, expect } from '@playwright/test';
import { open, tapToUnlock, patchState } from './helpers.js';

test.describe('US-9.2 — stopping point', () => {
  test('AC-9.2.2 — A dismissible stopping-point suggestion follows the goal', async ({ page }) => {
    await open(page, '#/home');
    const s = await page.evaluate(() => window.__test.settings());
    await patchState(page, { settings: { ...s, sessionGoal: { minutes: 10, questions: 3 } } });
    await open(page, '#/level/intervals/1');
    await tapToUnlock(page);
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    for (let i = 0; i < 2; i++) {
      await page.locator('[data-role="answer-area"] [data-option]').first().tap();
      await expect(page.locator('[data-role="stopping-point"]')).toHaveCount(0);
      await page.locator('[data-action="next"]').tap();
      await page.waitForFunction(() => window.__test.session.state.phase === 'question');
    }
    // third answer meets the goal; the message appears once the question completes
    await page.locator('[data-role="answer-area"] [data-option]').first().tap();
    const toast = page.locator('[data-role="stopping-point"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('good stopping point');
    await toast.locator('[data-action="dismiss-toast"]').tap();
    await expect(toast).toHaveCount(0);
    // the session continues normally
    await page.locator('[data-action="next"]').tap();
    await page.waitForFunction(() => window.__test.session.state.phase === 'question');
  });
});

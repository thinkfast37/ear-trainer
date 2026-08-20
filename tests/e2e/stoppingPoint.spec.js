import { test, expect } from '@playwright/test';
import { open, tapToUnlock, patchState } from './helpers.js';

test.describe('US-9.2 — stopping point', () => {
  test('AC-9.2.2/1 — A dismissible message suggests a good stopping point when the goal is met', async ({ page }) => {
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

  test('AC-9.2.2/2 — The message appears within the viewport without scrolling', async ({ page }) => {
    await open(page, '#/home');
    const s = await page.evaluate(() => window.__test.settings());
    await patchState(page, { settings: { ...s, sessionGoal: { minutes: 10, questions: 1 } } });
    await open(page, '#/level/intervals/1');
    await tapToUnlock(page);
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    await page.locator('[data-role="answer-area"] [data-option]').first().tap();
    const toast = page.locator('[data-role="stopping-point"]');
    await expect(toast).toBeVisible();
    const box = await toast.boundingBox();
    const viewport = page.viewportSize();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    // and without any scrolling having happened
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

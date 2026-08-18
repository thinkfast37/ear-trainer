import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

test.describe('US-6.2 — combined answer', () => {
  test('AC-6.2.2/1 — Inversion level 3 requires selecting both quality and inversion', async ({ page }) => {
    await open(page, '#/level/inversions/3');
    await tapToUnlock(page);
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    const submit = page.locator('[data-action="submit-combined"]');
    await expect(submit).toBeDisabled();
    await page.locator('[data-quality="maj"]').tap();
    await expect(submit).toBeDisabled(); // quality alone is not enough
    await page.locator('[data-inversion="inv1"]').tap();
    await expect(submit).toBeEnabled();
    const answer = await page.evaluate(() => window.__test.session.state.question.answer);
    await submit.tap();
    const result = await page.evaluate(() => window.__test.session.state.result);
    expect(result.chosen).toBe('maj:inv1');
    expect(result.correct).toBe(answer === 'maj:inv1');
    await expect(page.locator('[data-role="verdict"]')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

test.describe('US-9.3 — celebration', () => {
  test('AC-9.3.2 — Mastering a level shows a celebration with level stats', async ({ page }) => {
    await open(page, '#/level/scaleDegrees/1');
    await tapToUnlock(page);
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    // scale-degree level 1 has 3 items → minimum max(10, 3×3) = 10 answers (AC-2.2.4):
    // 9 correct answers through the API, then the 10th through the UI
    await page.evaluate(async () => { const s = window.__test.session; for (let i = 0; i < 9; i++) { s.submit(s.state.question.answer); await s.next(); } });
    const answer = await page.evaluate(() => window.__test.session.state.question.answer);
    await page.locator(`[data-option="${answer}"]`).tap();
    const cel = page.locator('[data-role="celebration"]');
    await expect(cel).toBeVisible();
    await expect(cel).toContainText('Level 1 mastered');
    await expect(cel.locator('[data-stat="accuracy"]')).toContainText('Accuracy 100%');
    await expect(cel.locator('[data-stat="time"]')).toContainText('Time');
    await expect(cel.locator('[data-stat="weakest"]')).toContainText('Weakest item conquered: degree:');
    await cel.locator('[data-action="continue"]').tap();
    await expect(page.locator('[data-track="scaleDegrees"] [data-level="1"]')).toHaveAttribute('data-state', 'mastered');
  });
});

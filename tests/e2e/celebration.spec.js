import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

/** Master scale-degree level 1: 9 answers through the API, the 10th through the UI (AC-2.2.4). */
async function masterLevelOne(page) {
  await open(page, '#/level/scaleDegrees/1');
  await tapToUnlock(page);
  await page.getByRole('button', { name: 'Start' }).tap();
  await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
  await page.evaluate(async () => { const s = window.__test.session; for (let i = 0; i < 9; i++) { s.submit(s.state.question.answer); await s.next(); } });
  const answer = await page.evaluate(() => window.__test.session.state.question.answer);
  await page.locator(`[data-option="${answer}"]`).tap();
}

test.describe('US-9.3 — mastery dialog', () => {
  test('AC-9.3.2/1 — The dialog interrupts at the mastery moment and shows accuracy, time and weakest item', async ({ page }) => {
    await masterLevelOne(page);
    const cel = page.locator('[data-role="mastery-dialog"] [data-role="celebration"]');
    await expect(cel).toBeVisible();
    await expect(cel).toContainText('Level 1 mastered');
    await expect(cel.locator('[data-stat="accuracy"]')).toContainText('Accuracy 100%');
    await expect(cel.locator('[data-stat="time"]')).toContainText('Time');
    await expect(cel.locator('[data-stat="weakest"]')).toContainText('Weakest item conquered: degree:');
    // it interrupts: visible within the viewport with no scrolling
    const box = await cel.boundingBox();
    const viewport = page.viewportSize();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  });

  test('AC-9.3.2/2 — Choosing to return to the main menu ends the session and shows the main menu', async ({ page }) => {
    await masterLevelOne(page);
    await page.locator('[data-action="to-menu"]').tap();
    await expect(page.locator('[data-track="scaleDegrees"] [data-level="1"]')).toHaveAttribute('data-state', 'mastered');
  });

  test('AC-9.3.2/3 — Choosing to keep practising closes the dialog and the session continues on the same level', async ({ page }) => {
    await masterLevelOne(page);
    await page.locator('[data-action="keep-practising"]').tap();
    await expect(page.locator('[data-role="mastery-dialog"]')).toHaveCount(0);
    await page.locator('[data-action="next"]').tap();
    await page.waitForFunction(() => window.__test.session.state.phase === 'question' && window.__test.session.state.question.levelNo === 1);
    // answering again does not re-open the dialog
    await page.locator('[data-role="answer-area"] [data-option]').first().tap();
    await expect(page.locator('[data-role="mastery-dialog"]')).toHaveCount(0);
  });
});

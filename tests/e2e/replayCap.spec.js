import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

async function startMelodic(page) {
  await open(page, '#/level/melodic/1');
  await tapToUnlock(page);
  await page.getByRole('button', { name: 'Start' }).tap();
  await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
}

test.describe('US-7.3 Limited replays with replay scoring', () => {
  test("AC-7.3.1 — The replay button disables at the level's replay cap", async ({ page }) => {
    await startMelodic(page);
    const limit = await page.evaluate(() => window.__test.session.state.question.replayLimit);
    expect(limit).toBe(3);
    const replay = page.locator('[data-role="stimulus"] [data-action="replay"]');
    await expect(replay).toBeEnabled();
    for (let i = 1; i <= 3; i++) { await replay.tap(); await expect(replay).toContainText(`(${i}/3)`); }
    await expect(replay).toBeDisabled();
    const used = await page.evaluate(() => window.__test.session.state.replaysUsed);
    expect(used).toBe(3);
    // a further attempt through the session API is refused too
    expect(await page.evaluate(() => window.__test.session.replay())).toBe(false);
  });
  test('AC-7.3.3 — Session stats report average replays per question', async ({ page }) => {
    await startMelodic(page);
    await page.evaluate(async () => {
      const s = window.__test.session;
      for (let i = 0; i < 4; i++) { if (i < 2) await s.replay(); s.submit(s.state.question.answer); if (i < 3) await s.next(); }
    });
    await page.locator('[data-action="end-session"]').tap();
    await page.locator('[data-nav="stats"]').tap();
    const li = page.locator('[data-role="sessions"] li').first();
    await expect(li).toContainText('4 questions');
    await expect(li.locator('[data-role="avg-replays"]')).toHaveText('avg replays 0.5');
  });
});

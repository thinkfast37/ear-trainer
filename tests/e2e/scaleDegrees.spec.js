import { test, expect } from '@playwright/test';
import { open, tapToUnlock, clearAudioLog, audioLog } from './helpers.js';

async function startDegrees(page) {
  await open(page, '#/level/scaleDegrees/1');
  await tapToUnlock(page);
  await page.getByRole('button', { name: 'Start' }).tap();
  await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
  await page.waitForFunction(() => window.__test.audioLog.length >= 28); // 15 scale + 12 cadence + target
}

test.describe('US-4.1 — re-hear cadence', () => {
  test('AC-4.1.3/1 — Tapping re-hear cadence replays the cadence', async ({ page }) => {
    await startDegrees(page);
    // the cadence part alone — at level 1 the prelude also carries the scale reference (US-4.4)
    const prelude = await page.evaluate(() => window.__test.session.state.question.exercise.prelude.parts.cadence.events.map((e) => e.midi));
    await clearAudioLog(page);
    await page.locator('[data-action="rehear-cadence"]').tap();
    await page.waitForFunction((n) => window.__test.audioLog.length >= n, prelude.length);
    const log = await audioLog(page);
    expect(log.map((e) => e.midi)).toEqual(prelude);
    // only the cadence, not the target note
    expect(log.length).toBe(prelude.length);
  });
  test('AC-4.1.3/2 — Re-hearing the cadence leaves the replay count and score unaffected', async ({ page }) => {
    await startDegrees(page);
    const before = await page.evaluate(() => ({ replays: window.__test.session.state.replaysUsed, xp: window.__test.store.getState().xp }));
    await page.locator('[data-action="rehear-cadence"]').tap();
    await page.locator('[data-action="rehear-cadence"]').tap();
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => ({ replays: window.__test.session.state.replaysUsed, xp: window.__test.store.getState().xp }));
    expect(after.replays).toBe(before.replays);
    expect(after.xp).toBe(before.xp);
    // answering correctly afterwards scores as if no replay was used
    const answer = await page.evaluate(() => window.__test.session.state.question.answer);
    await page.locator(`[data-option="${answer}"]`).tap();
    const result = await page.evaluate(() => window.__test.session.state.result);
    expect(result.replaysUsed).toBe(0);
    expect(result.score).toBe(1);
  });
});

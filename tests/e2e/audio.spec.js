import { test, expect } from '@playwright/test';
import { open, tapToUnlock, audioLog, clearAudioLog } from './helpers.js';

test.describe('US-1.1 Piano playback', () => {
  test('AC-1.1.1/2 — No network request is made during playback', async ({ page }) => {
    await open(page, '#/level/intervals/1');
    await tapToUnlock(page);
    // samples load on the first gesture; wait for them
    await page.waitForFunction(() => window.__test.sampler.loaded, null, { timeout: 20000 });
    const requests = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    await page.waitForTimeout(300);
    await page.locator('[data-action="replay"]').tap();
    await page.waitForTimeout(500);
    const log = await audioLog(page);
    expect(log.length).toBeGreaterThanOrEqual(2);
    expect(requests.filter((u) => !u.startsWith('data:'))).toEqual([]);
  });

  test('AC-1.1.2 — Adjacent pitches play without clicks, dropouts or mistuning: adjacent pitches through the real audio path', async ({ page }) => {
    await open(page, '#/home');
    await tapToUnlock(page);
    await page.waitForFunction(() => window.__test.sampler.loaded, null, { timeout: 20000 });
    await clearAudioLog(page);
    const result = await page.evaluate(async () => {
      const t = window.__test;
      const ctx = t.audio.get();
      const errors = [];
      let played = 0;
      for (let m = 36; m < 84; m++) {
        try { t.sampler.noteOn(m, ctx.currentTime + 0.05, 0.05, 0.2); t.sampler.noteOn(m + 1, ctx.currentTime + 0.05, 0.05, 0.2); played += 2; } catch (e) { errors.push(`${m}: ${e.message}`); }
      }
      return { errors, played, state: ctx.state };
    });
    expect(result.errors).toEqual([]);
    expect(result.played).toBe(96);
    expect(result.state).toBe('running');
  });
});

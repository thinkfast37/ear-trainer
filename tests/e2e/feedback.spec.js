import { test, expect } from '@playwright/test';
import { open, tapToUnlock, clearAudioLog, audioLog } from './helpers.js';

async function startIntervals(page, level = 1) {
  await open(page, `#/level/intervals/${level}`);
  await tapToUnlock(page);
  await page.getByRole('button', { name: 'Start' }).tap();
  await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
}

test.describe('US-2.4 Immediate feedback with comparison replay', () => {
  test('AC-2.4.1 — The verdict is displayed within 200 ms of submitting', async ({ page }) => {
    await startIntervals(page);
    for (let i = 0; i < 5; i++) {
      const answer = await page.evaluate(() => window.__test.session.state.question.answer);
      const ms = await page.evaluate(async (a) => {
        const btn = document.querySelector(`[data-option="${a}"]`);
        const t0 = performance.now();
        btn.click();
        // the verdict is rendered synchronously in the click handler; measure until it is in the DOM
        return new Promise((res) => { const check = () => { if (document.querySelector('[data-role="verdict"]')) res(performance.now() - t0); else requestAnimationFrame(check); }; check(); });
      }, answer);
      expect(ms).toBeLessThan(200);
      await expect(page.locator('[data-role="verdict"]')).toHaveText(/Correct!|Not quite/);
      await page.locator('[data-action="next"]').tap();
      await page.waitForFunction(() => window.__test.session.state.phase === 'question');
    }
  });

  test('AC-2.4.2/1 — Tapping comparison plays the correct answer then my chosen answer', async ({ page }) => {
    await open(page, '#/level/chordQualities/9');
    await tapToUnlock(page);
    await page.waitForFunction(() => window.__test.sampler.loaded, null, { timeout: 20000 });
    // force a sus4 question answered as sus2
    await page.evaluate(async () => {
      const t = window.__test; const s = t.session;
      // no session yet: start one on chord level 9
      window.location.hash = '#/session/chordQualities/9';
      await new Promise((r) => setTimeout(r, 300));
      const sess = t.session;
      let guard = 0;
      while (sess.state.question.answer !== 'sus4' && guard++ < 200) { sess.submit(sess.state.question.answer); await sess.next(); }
      if (sess.state.question.answer !== 'sus4') throw new Error('no sus4 question generated');
      void s;
    });
    await page.locator('[data-option="sus2"]').tap();
    await expect(page.locator('[data-role="verdict"]')).toHaveText('Not quite');
    await clearAudioLog(page);
    await page.locator('[data-action="compare"]').tap();
    await page.waitForFunction(() => window.__test.audioLog.length >= 6);
    const log = await audioLog(page);
    // two chords back-to-back: first onset group = correct (sus4), second = chosen (sus2)
    const groups = [...new Set(log.map((e) => e.at.toFixed(3)))].map((t) => log.filter((e) => e.at.toFixed(3) === t).map((e) => e.midi).sort((a, b) => a - b));
    expect(groups.length).toBe(2);
    const intervals = (g) => g.map((m) => m - g[0]);
    expect(intervals(groups[0])).toEqual([0, 5, 7]);
    expect(intervals(groups[1])).toEqual([0, 2, 7]);
  });

  test('AC-2.4.2/2 — Both answers are labeled on screen during comparison playback', async ({ page }) => {
    await startIntervals(page);
    const wrong = await page.evaluate(() => { const q = window.__test.session.state.question; return q.options.find((o) => o !== q.answer); });
    const right = await page.evaluate(() => window.__test.session.state.question.answer);
    await page.locator(`[data-option="${wrong}"]`).tap();
    await page.locator('[data-action="compare"]').tap();
    await expect(page.locator('[data-role="label-correct"]')).toContainText(`Correct: ${right}`);
    await expect(page.locator('[data-role="label-chosen"]')).toContainText(`Yours: ${wrong}`);
  });

  test('AC-2.4.3 — Replay from the feedback screen uses identical rendering', async ({ page }) => {
    await startIntervals(page, 3);
    await page.waitForFunction(() => window.__test.audioLog.length >= 2);
    const first = await page.evaluate(() => window.__test.audioLog.map((e) => [e.midi, e.dur]));
    const rel0 = await page.evaluate(() => { const l = window.__test.audioLog; return l.map((e) => +(e.at - l[0].at).toFixed(4)); });
    const answer = await page.evaluate(() => window.__test.session.state.question.answer);
    await page.locator(`[data-option="${answer}"]`).tap();
    await clearAudioLog(page);
    await page.locator('[data-role="feedback"] [data-action="replay-stimulus"]').tap();
    await page.waitForFunction(() => window.__test.audioLog.length >= 2);
    const again = await page.evaluate(() => window.__test.audioLog.map((e) => [e.midi, e.dur]));
    const rel1 = await page.evaluate(() => { const l = window.__test.audioLog; return l.map((e) => +(e.at - l[0].at).toFixed(4)); });
    expect(again).toEqual(first);
    expect(rel1).toEqual(rel0);
  });
});

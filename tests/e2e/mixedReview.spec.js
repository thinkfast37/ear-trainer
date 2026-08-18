import { test, expect } from '@playwright/test';
import { open, tapToUnlock, setState, getState } from './helpers.js';

/** Build a progress document with the given levels mastered (all items in `box`). */
async function masteredDoc(page, entries, box = 5) {
  return page.evaluate(({ entries, box }) => {
    const t = window.__test;
    const p = t.store.getState();
    const doc = JSON.parse(JSON.stringify(p));
    for (const { trackId, levelNo, itemBox } of entries) {
      const track = t.tracks.byId[trackId];
      const subs = track.def.subStages.length ? track.def.subStages : [null];
      const key = `${trackId}:${levelNo}`;
      doc.levels[key] = { mastered: true, masteredAt: 1, subStage: subs[subs.length - 1], subStages: {}, history: [] };
      for (const s of subs) {
        const ids = track.itemsFor(levelNo, s ?? undefined);
        for (const id of ids) doc.items[id] = { box: itemBox ?? box, attempts: 10, correct: 9, lastSeen: 1, confusions: {} };
        const hist = Array.from({ length: 20 }, (_, i) => ({ item: ids[i % ids.length], correct: true, at: 1000 + i, replays: 0, score: 1 }));
        if (s) doc.levels[key].subStages[s] = { mastered: true, history: hist }; else doc.levels[key].history = hist;
      }
    }
    return doc;
  }, { entries, box });
}

test.describe('US-2.3 Interleaved review mode', () => {
  test('AC-2.3.1 — Mixed Review is locked until two levels are mastered', async ({ page }) => {
    await open(page, '#/home');
    const mixed = page.locator('[data-track="mixed"]');
    await expect(mixed).toHaveAttribute('data-unlocked', 'false');
    await expect(mixed.locator('[data-role="lock-message"]')).toContainText('Master 2 levels');
    // one mastered level: still locked
    await setState(page, await masteredDoc(page, [{ trackId: 'intervals', levelNo: 1 }]));
    await expect(page.locator('[data-track="mixed"]')).toHaveAttribute('data-unlocked', 'false');
    // two mastered levels: available
    await setState(page, await masteredDoc(page, [{ trackId: 'intervals', levelNo: 1 }, { trackId: 'scaleDegrees', levelNo: 1 }]));
    await expect(page.locator('[data-track="mixed"]')).toHaveAttribute('data-unlocked', 'true');
    await expect(page.locator('[data-action="start-mixed"]')).toBeVisible();
  });

  test('AC-2.3.2/1 — Mixed Review questions are drawn from multiple tracks', async ({ page }) => {
    await open(page, '#/home');
    await tapToUnlock(page);
    await setState(page, await masteredDoc(page, [{ trackId: 'intervals', levelNo: 1 }, { trackId: 'scaleDegrees', levelNo: 1 }, { trackId: 'chordQualities', levelNo: 1 }]));
    await page.locator('[data-action="start-mixed"]').tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    const trackIds = await page.evaluate(async () => {
      const s = window.__test.session; const seen = new Set();
      for (let i = 0; i < 30; i++) { seen.add(s.state.question.trackId); s.submit(s.state.question.answer); await s.next(); }
      return [...seen];
    });
    expect(trackIds.length).toBeGreaterThanOrEqual(2);
  });

  test('AC-2.3.2/2 — Mixed Review selection is weighted by Leitner box', async ({ page }) => {
    await open(page, '#/home');
    await tapToUnlock(page);
    // intervals items in box 1 (weight 5), scaleDegrees items in box 5 (weight 1)
    await setState(page, await masteredDoc(page, [{ trackId: 'intervals', levelNo: 1, itemBox: 1 }, { trackId: 'scaleDegrees', levelNo: 1, itemBox: 5 }]));
    await page.locator('[data-action="start-mixed"]').tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    const counts = await page.evaluate(async () => {
      const s = window.__test.session; const c = {};
      // sample the draw 30 times without answering, so boxes stay where the document put them
      for (let i = 0; i < 30; i++) { const q = s.state.question; c[q.trackId] = (c[q.trackId] ?? 0) + 1; await s.next(); }
      return c;
    });
    expect(counts.intervals ?? 0).toBeGreaterThan(counts.scaleDegrees ?? 0);
  });

  test("AC-2.3.2/3 — Each Mixed Review feedback screen labels the question's track", async ({ page }) => {
    await open(page, '#/home');
    await tapToUnlock(page);
    await setState(page, await masteredDoc(page, [{ trackId: 'intervals', levelNo: 1 }, { trackId: 'scaleDegrees', levelNo: 1 }]));
    await page.locator('[data-action="start-mixed"]').tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    for (let i = 0; i < 6; i++) {
      const trackName = await page.evaluate(() => window.__test.session.state.question.trackLabel);
      await page.locator('[data-option]').first().tap();
      await expect(page.locator('[data-role="feedback"] [data-role="track-label-feedback"]')).toContainText(`Track: ${trackName}`);
      await page.locator('[data-action="next"]').tap();
      await page.waitForFunction(() => window.__test.session.state.phase === 'question');
    }
    const st = await getState(page);
    expect(Object.keys(st.items).length).toBeGreaterThan(0);
  });
});

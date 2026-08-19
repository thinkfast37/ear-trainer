import { describe, it, expect } from 'vitest';
import { evaluate, rollingAccuracy, getLevelState, minAnswers, WINDOW } from '../../../src/learning/mastery.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { levelNodeState, isLevelMastered } from '../../../src/learning/unlocks.js';
import { harness, answerMany } from '../helpers/harness.js';

describe('US-2.2 Mastery-gated level advancement', () => {
  it('AC-2.2.1/1 — The level is marked mastered on the satisfying answer', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, seed: 3 });
    const results = await answerMany(h.session, 20);
    const ls = getLevelState(h.store.getState(), 'scaleDegrees', 1);
    expect(ls.mastered).toBe(true);
    // marked on the answer that satisfied both conditions, not before
    const idx = results.findIndex((r) => r.levelMastered);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(results.slice(0, idx).every((r) => !r.levelMastered)).toBe(true);
    const ev = evaluate(ls.history, h.store.getState().items, h.tracks.byId.scaleDegrees.itemsFor(1));
    expect(ev.mastered).toBe(true); expect(rollingAccuracy(ls.history)).toBeGreaterThanOrEqual(0.9);
  });
  it('AC-2.2.1/2 — The next level unlocks when the level is mastered', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, seed: 3 });
    const defs = h.tracks.defs;
    expect(levelNodeState(h.store.getState(), defs.scaleDegrees, 2, defs)).toBe('locked');
    await answerMany(h.session, 20);
    expect(isLevelMastered(h.store.getState(), 'scaleDegrees', 1)).toBe(true);
    expect(levelNodeState(h.store.getState(), defs.scaleDegrees, 2, defs)).toBe('available');
  });
  it('AC-2.2.2/1 — The level is not mastered while an item is below box 3', () => {
    // 20 answers at 95% but one item stuck in box 2 → not mastered, and it says which condition
    const items = { 'degree:Do:major': { box: 5, attempts: 10, correct: 10, lastSeen: 1, confusions: {} }, 'degree:Mi:major': { box: 5, attempts: 10, correct: 10, lastSeen: 1, confusions: {} }, 'degree:Sol:major': { box: 2, attempts: 3, correct: 1, lastSeen: 1, confusions: {} } };
    const history = Array.from({ length: 20 }, (_, i) => ({ item: 'degree:Do:major', correct: i !== 0, at: i, replays: 0, score: 1 }));
    const ev = evaluate(history, items, Object.keys(items));
    expect(ev.accuracy).toBeGreaterThanOrEqual(0.9);
    expect(ev.mastered).toBe(false);
    expect(ev.unmet).toEqual(['boxes']); expect(ev.weakItems).toEqual(['degree:Sol:major']);
  });
  it("AC-2.2.3/1 — An incorrect answer in a mastered level decreases that item's box", async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, seed: 3 });
    await answerMany(h.session, 20);
    expect(getLevelState(h.store.getState(), 'scaleDegrees', 1).mastered).toBe(true);
    // replay the mastered level and get one wrong
    const s2 = h.newSession({});
    await s2.start();
    const q = s2.state.question;
    const before = h.store.getState().items[q.itemId].box;
    s2.submit(q.options.find((o) => o !== q.answer));
    expect(h.store.getState().items[q.itemId].box).toBeLessThan(before);
    expect(h.store.getState().items[q.itemId].box).toBe(1);
  });
  it('AC-2.2.3/2 — The mastered status is retained for unlock purposes after decay', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, seed: 3 });
    await answerMany(h.session, 20);
    const s2 = h.newSession({});
    await answerMany(s2, 6, (q) => q.options.find((o) => o !== q.answer));
    const p = h.store.getState();
    expect(getLevelState(p, 'scaleDegrees', 1).mastered).toBe(true);
    expect(levelNodeState(p, h.tracks.defs.scaleDegrees, 2, h.tracks.defs)).toBe('available');
    expect(rollingAccuracy(getLevelState(p, 'scaleDegrees', 1).history)).toBeLessThan(0.9);
  });
  it('AC-2.2.4/1 — A two-item level requires at least 10 answers', async () => {
    expect(minAnswers(2)).toBe(10);
    // 8 perfect answers on intervals L1 (2 items) are not enough; the 10th masters it
    const h = harness({ trackId: 'intervals', levelNo: 1, seed: 3 });
    const results = await answerMany(h.session, 10);
    expect(results.slice(0, 9).every((r) => !r.levelMastered)).toBe(true);
    const ev8 = evaluate(getLevelState(h.store.getState(), 'intervals', 1).history.slice(0, 8), h.store.getState().items, h.tracks.byId.intervals.itemsFor(1));
    expect(ev8.unmet).toContain('answers'); expect(ev8.required).toBe(10);
    expect(results[9].levelMastered).toBe(true);
    expect(getLevelState(h.store.getState(), 'intervals', 1).mastered).toBe(true);
  });
  it('AC-2.2.4/2 — A twelve-item level requires at least 36 answers', () => {
    expect(minAnswers(12)).toBe(36);
    const track = buildTracks().byId.intervals;
    const ids = track.itemsFor(6); expect(ids.length).toBe(12);
    const items = Object.fromEntries(ids.map((id) => [id, { box: 5, attempts: 10, correct: 10, lastSeen: 1, confusions: {} }]));
    const hist = (n) => Array.from({ length: n }, (_, i) => ({ item: ids[i % ids.length], correct: true, at: i, replays: 0, score: 1 }));
    const ev35 = evaluate(hist(35), items, ids);
    expect(ev35.mastered).toBe(false); expect(ev35.unmet).toEqual(['answers']); expect(ev35.required).toBe(36); expect(ev35.answered).toBe(35);
    expect(evaluate(hist(36), items, ids).mastered).toBe(true);
    // a level with more presentations has more items: L10 (asc + desc) needs 72
    expect(minAnswers(track.itemsFor(10).length)).toBe(72);
  });
  it('AC-2.2.4/3 — Rolling accuracy is measured over the last 20 answers regardless of item count', () => {
    const track = buildTracks().byId.intervals;
    for (const lvl of [1, 6, 10]) {
      const ids = track.itemsFor(lvl);
      const items = Object.fromEntries(ids.map((id) => [id, { box: 5, attempts: 10, correct: 10, lastSeen: 1, confusions: {} }]));
      // 100 answers (past every level's minimum): 80 wrong then 20 right → rolling accuracy is 100% (last 20 only), regardless of the level's item count
      const hist = Array.from({ length: 100 }, (_, i) => ({ item: ids[i % ids.length], correct: i >= 80, at: i, replays: 0, score: 1 }));
      const ev = evaluate(hist, items, ids);
      expect(rollingAccuracy(hist)).toBe(1); expect(ev.accuracy).toBe(1); expect(ev.mastered).toBe(true);
      // and 100 answers with the last 20 at 80% is not mastered even though the overall rate is higher
      const hist2 = Array.from({ length: 100 }, (_, i) => ({ item: ids[i % ids.length], correct: i < 80 || i % 5 !== 0, at: i, replays: 0, score: 1 }));
      expect(rollingAccuracy(hist2)).toBe(0.8); expect(evaluate(hist2, items, ids).unmet).toEqual(['accuracy']);
    }
    expect(WINDOW).toBe(20);
  });
});

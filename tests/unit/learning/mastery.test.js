import { describe, it, expect } from 'vitest';
import { evaluate, rollingAccuracy, getLevelState } from '../../../src/learning/mastery.js';
import { levelNodeState, isLevelMastered } from '../../../src/learning/unlocks.js';
import { harness, answerMany } from '../helpers/harness.js';
import { emptyProgress } from '../../../src/storage/schema.js';

// Intervals L1 has 2 items (P8, P5) per sub-stage; drive the "asc" sub-stage to mastery.
async function masterSubStage(h, wrongEvery = 0) {
  return answerMany(h.session, 20, (q, i) => (wrongEvery && i % wrongEvery === 0 ? q.options.find((o) => o !== q.answer) : q.answer));
}

describe('US-2.2 Mastery-gated level advancement', () => {
  it('AC-2.2.1/1 — The level is marked mastered on the satisfying answer', async () => {
    // scaleDegrees has no sub-stages: mastering the level itself
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
  it('sub-stage mastery advances the sub-stage (intervals L1 asc → desc)', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, seed: 3 });
    await masterSubStage(h);
    const ls = getLevelState(h.store.getState(), 'intervals', 1);
    expect(ls.subStages.asc.mastered).toBe(true); expect(ls.subStage).toBe('desc'); expect(ls.mastered).toBe(false);
    expect(emptyProgress().levels).toEqual({});
  });
});

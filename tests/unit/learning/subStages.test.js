import { describe, it, expect } from 'vitest';
import { harness, answerMany } from '../helpers/harness.js';
import { isSubStageUnlocked, currentSubStage } from '../../../src/learning/subStages.js';
import { getLevelState } from '../../../src/learning/mastery.js';

describe('US-3.2 Interval presentation sub-stages', () => {
  it('AC-3.2.1/1 — Mastering the ascending sub-stage unlocks the descending sub-stage', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 2, seed: 8 });
    const subs = h.tracks.defs.intervals.subStages;
    expect(isSubStageUnlocked(getLevelState(h.store.getState(), 'intervals', 2), subs, 'desc')).toBe(false);
    const results = await answerMany(h.session, 20);
    const ls = getLevelState(h.store.getState(), 'intervals', 2);
    expect(ls.subStages.asc.mastered).toBe(true);
    expect(isSubStageUnlocked(ls, subs, 'desc')).toBe(true);
    expect(currentSubStage(ls, subs)).toBe('desc');
    expect(results.some((r) => r.subMastered)).toBe(true);
  });
  it('AC-3.2.1/2 — The harmonic sub-stage remains locked until descending is mastered', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 2, seed: 8 });
    const subs = h.tracks.defs.intervals.subStages;
    await answerMany(h.session, 20); // asc mastered
    let ls = getLevelState(h.store.getState(), 'intervals', 2);
    expect(isSubStageUnlocked(ls, subs, 'harm')).toBe(false);
    // work in descending but with a wrong answer every 4th → not mastered → harmonic still locked
    const s2 = h.newSession({});
    await answerMany(s2, 20, (q, i) => (i % 4 === 0 ? q.options.find((o) => o !== q.answer) : q.answer));
    ls = getLevelState(h.store.getState(), 'intervals', 2);
    expect(ls.subStages.desc?.mastered ?? false).toBe(false);
    expect(isSubStageUnlocked(ls, subs, 'harm')).toBe(false);
    // master descending → harmonic unlocks
    const s3 = h.newSession({});
    await answerMany(s3, 24);
    ls = getLevelState(h.store.getState(), 'intervals', 2);
    expect(ls.subStages.desc.mastered).toBe(true);
    expect(isSubStageUnlocked(ls, subs, 'harm')).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { harness } from '../helpers/harness.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';

describe('US-3.2 — items and roots', () => {
  it('AC-3.2.2 — Each interval presentation form is a separate Leitner item: asc correct and desc incorrect move only their own items', async () => {
    // Put m6 asc and desc both in box 3 and answer through sessions on each sub-stage
    const p = emptyProgress();
    p.items['interval:m6:asc'] = { box: 3, attempts: 4, correct: 3, lastSeen: 1, confusions: {} };
    p.items['interval:m6:desc'] = { box: 3, attempts: 4, correct: 3, lastSeen: 1, confusions: {} };
    p.items['interval:m6:harm'] = { box: 3, attempts: 4, correct: 3, lastSeen: 1, confusions: {} };
    p.levels['intervals:5'] = { mastered: false, masteredAt: null, subStage: 'asc', subStages: {}, history: [] };
    const h = harness({ trackId: 'intervals', levelNo: 5, progress: p, seed: 4 });
    await h.session.start();
    let guard = 0;
    while (h.session.state.question.answer !== 'm6' && guard++ < 300) await h.session.next();
    expect(h.session.state.question.itemId).toBe('interval:m6:asc');
    h.session.submit('m6');
    // switch the level to the descending sub-stage and answer m6 wrongly
    h.store.update((d) => { d.levels['intervals:5'].subStage = 'desc'; });
    const s2 = h.newSession({});
    await s2.start(); guard = 0;
    while (s2.state.question.answer !== 'm6' && guard++ < 300) await s2.next();
    expect(s2.state.question.itemId).toBe('interval:m6:desc');
    s2.submit('M6');
    const items = h.store.getState().items;
    expect(items['interval:m6:asc'].box).toBe(4);
    expect(items['interval:m6:desc'].box).toBe(1);
    expect(items['interval:m6:harm'].box).toBe(3);
  });
  it('AC-3.2.3/1 — Root notes vary across the configured register range over 20 questions', () => {
    const track = buildTracks().byId.intervals; const rng = createRng(21);
    const settings = { ...DEFAULT_SETTINGS, register: { low: 48, high: 72 } };
    const roots = Array.from({ length: 20 }, () => track.generate({ levelNo: 1, subStage: 'asc', progress: emptyProgress(), rng, settings }).meta.low);
    expect(new Set(roots).size).toBeGreaterThanOrEqual(6);
    for (const r of roots) { expect(r).toBeGreaterThanOrEqual(48); expect(r).toBeLessThanOrEqual(72); }
    expect(Math.max(...roots) - Math.min(...roots)).toBeGreaterThanOrEqual(8);
  });
  it('AC-3.2.3/2 — No fixed reference pitch recurs in a detectable pattern', () => {
    const track = buildTracks().byId.intervals; const rng = createRng(22);
    const roots = Array.from({ length: 40 }, () => track.generate({ levelNo: 3, subStage: 'asc', progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS }).meta.low);
    // no single pitch dominates, and no period-2/3/4 repetition
    const counts = {}; for (const r of roots) counts[r] = (counts[r] ?? 0) + 1;
    expect(Math.max(...Object.values(counts))).toBeLessThan(roots.length / 3);
    for (const period of [1, 2, 3, 4]) { let same = 0; for (let i = period; i < roots.length; i++) if (roots[i] === roots[i - period]) same++; expect(same).toBeLessThan((roots.length - period) / 2); }
  });
});

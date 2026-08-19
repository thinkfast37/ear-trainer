import { describe, it, expect } from 'vitest';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { INTERVALS } from '../../../src/theory/intervals.js';
const SIMPLE_IDS = INTERVALS.filter((i) => !i.simple).map((i) => i.id);
const COMPOUND_IDS = INTERVALS.filter((i) => i.simple).map((i) => i.id);
import { parseItemId } from '../../../src/tracks/intervals.js';

const tracks = buildTracks();
const track = tracks.byId.intervals;
const levelDef = (n) => track.def.levels.find((l) => l.no === n);

/** The set of intervals (and presentations) that actually appear over `n` generated questions at a level. */
function observedPool(levelNo, n = 300, progress = emptyProgress(), seed = 1) {
  const rng = createRng(seed); const seen = new Map(); const lastAsked = {};
  for (let i = 0; i < n; i++) {
    const recency = Object.fromEntries(Object.entries(lastAsked).map(([k, v]) => [k, i - v]));
    const q = track.generate({ levelNo, progress, rng, settings: DEFAULT_SETTINGS, recency });
    lastAsked[q.itemId] = i;
    seen.set(q.answer, (seen.get(q.answer) ?? 0) + 1);
    seen.presentations = seen.presentations ?? new Set(); seen.presentations.add(q.meta.presentation);
  }
  return seen;
}
/** Assert a level's pool AND presentations, by definition and by what generation actually produces. */
const exact = (levelNo, ids, presentations) => {
  const def = levelDef(levelNo);
  expect([...def.pool].sort()).toEqual([...ids].sort());
  expect([...def.presentations].sort()).toEqual([...presentations].sort());
  const seen = observedPool(levelNo, Math.max(300, 25 * ids.length * presentations.length));
  expect([...seen.keys()].sort()).toEqual([...ids].sort());
  expect([...seen.presentations].sort()).toEqual([...presentations].sort());
};
const S12 = SIMPLE_IDS;
const C1 = ['m9', 'M9', 'm10', 'M10'];
const C2 = ['P11', 'P12', 'm13', 'M13'];

describe('US-3.1 Interval level progression', () => {
  it('AC-3.1.1/1 — Interval level 1 is ascending P8, P5', () => exact(1, ['P8', 'P5'], ['asc']));
  it('AC-3.1.1/2 — Interval level 2 is ascending P8, P5, M3, m3', () => exact(2, ['P8', 'P5', 'M3', 'm3'], ['asc']));
  it('AC-3.1.1/3 — Interval level 3 is ascending P8, P5, M3, m3, P4', () => exact(3, ['P8', 'P5', 'M3', 'm3', 'P4'], ['asc']));
  it('AC-3.1.1/4 — Interval level 4 is ascending P8, P5, M3, m3, P4, M2, m2', () => exact(4, ['P8', 'P5', 'M3', 'm3', 'P4', 'M2', 'm2'], ['asc']));
  it('AC-3.1.1/5 — Interval level 5 is ascending P8, P5, M3, m3, P4, M2, m2, M6, m6', () => exact(5, ['P8', 'P5', 'M3', 'm3', 'P4', 'M2', 'm2', 'M6', 'm6'], ['asc']));
  it('AC-3.1.1/6 — Interval level 6 is ascending all 12 simple intervals', () => { exact(6, S12, ['asc']); expect(levelDef(6).pool).toEqual(expect.arrayContaining(['M7', 'm7', 'TT'])); });
  it('AC-3.1.1/7 — Interval level 7 is descending P8, P5, P4, M3, m3', () => exact(7, ['P8', 'P5', 'P4', 'M3', 'm3'], ['desc']));
  it('AC-3.1.1/8 — Interval level 8 is descending P8, P5, P4, M3, m3, M2, m2, M6, m6', () => exact(8, ['P8', 'P5', 'P4', 'M3', 'm3', 'M2', 'm2', 'M6', 'm6'], ['desc']));
  it('AC-3.1.1/9 — Interval level 9 is descending all 12 simple intervals', () => exact(9, S12, ['desc']));
  it('AC-3.1.1/10 — Interval level 10 is ascending and descending mixed over all 12 simple intervals', () => exact(10, S12, ['asc', 'desc']));
  it('AC-3.1.1/11 — Interval level 11 is harmonic P8, P5, P4, TT, M2, m2', () => exact(11, ['P8', 'P5', 'P4', 'TT', 'M2', 'm2'], ['harm']));
  it('AC-3.1.1/12 — Interval level 12 is harmonic P8, P5, P4, TT, M2, m2, M3, m3, M6, m6', () => exact(12, ['P8', 'P5', 'P4', 'TT', 'M2', 'm2', 'M3', 'm3', 'M6', 'm6'], ['harm']));
  it('AC-3.1.1/13 — Interval level 13 is harmonic all 12 simple intervals', () => { exact(13, S12, ['harm']); expect(levelDef(13).pool).toEqual(expect.arrayContaining(['M7', 'm7'])); });
  it('AC-3.1.1/14 — Interval level 14 is ascending all 12 simple plus m9, M9, m10, M10', () => exact(14, [...S12, ...C1], ['asc']));
  it('AC-3.1.1/15 — Interval level 15 is ascending all 12 simple plus all eight compound intervals', () => { exact(15, [...S12, ...C1, ...C2], ['asc']); expect([...C1, ...C2].sort()).toEqual([...COMPOUND_IDS].sort()); });
  it('AC-3.1.1/16 — Interval level 16 is all presentations mixed over all simple and compound intervals', () => { exact(16, [...S12, ...COMPOUND_IDS], ['asc', 'desc', 'harm']); expect(levelDef(16).mixedReview).toBe(true); });

  it('AC-3.1.2/1 — Intervals from all previous levels of the tier appear in the question stream', () => {
    // A tier is a run of levels sharing a presentation list; the pool re-grows inside each tier.
    const tierStart = (lvl) => { let k = lvl; while (k > 1 && JSON.stringify(levelDef(k - 1).presentations) === JSON.stringify(levelDef(lvl).presentations)) k--; return k; };
    let checked = 0;
    for (let lvl = 2; lvl <= 16; lvl++) {
      const first = tierStart(lvl);
      if (first === lvl) continue;
      const seen = observedPool(lvl, 60, emptyProgress(), lvl);
      const previous = new Set(); for (let k = first; k < lvl; k++) for (const iv of levelDef(k).pool) previous.add(iv);
      for (const iv of previous) expect(seen.has(iv), `level ${lvl} stream missing ${iv}`).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(8); // levels 2–6, 8–9, 12–13, 15
  });
  it('AC-3.1.2/2 — Selection among cumulative intervals is weighted by Leitner box', () => {
    const p = emptyProgress();
    // earlier-level intervals P8/P5 in box 5, the rest of level 5 in box 1
    for (const iv of levelDef(5).pool) p.items[`interval:${iv}:asc`] = { box: ['P8', 'P5'].includes(iv) ? 5 : 1, attempts: 5, correct: 3, lastSeen: 1, confusions: {} };
    const seen = observedPool(5, 500, p, 3);
    const strong = seen.get('P8') + seen.get('P5');
    const weak = [...seen.entries()].filter(([k]) => !['P8', 'P5'].includes(k)).reduce((s, [, v]) => s + v, 0);
    expect(strong / 2).toBeLessThan(weak / 7);
    // both still appear
    expect(seen.get('P8')).toBeGreaterThan(0);
  });
});

describe('US-3.2 Interval presentation tiers', () => {
  const pres = (lvl) => levelDef(lvl).presentations;
  it('AC-3.2.1/1 — Levels 1 to 6 present intervals ascending only', () => { for (let l = 1; l <= 6; l++) expect(pres(l)).toEqual(['asc']); });
  it('AC-3.2.1/2 — Levels 7 to 9 present intervals descending only', () => { for (let l = 7; l <= 9; l++) expect(pres(l)).toEqual(['desc']); });
  it('AC-3.2.1/3 — Level 10 mixes ascending and descending presentations', () => { expect([...pres(10)].sort()).toEqual(['asc', 'desc']); expect(track.itemsFor(10)).toEqual(expect.arrayContaining(['interval:P5:asc', 'interval:P5:desc'])); });
  it('AC-3.2.1/4 — Levels 11 to 13 present intervals harmonically only', () => { for (let l = 11; l <= 13; l++) expect(pres(l)).toEqual(['harm']); });
  it("AC-3.2.1/5 — A level's presentation is fixed by its definition and does not change with progress", () => {
    // Whatever the learner has done, level 7 generates descending items only.
    const p = emptyProgress();
    for (const id of track.itemsFor(7)) p.items[id] = { box: 5, attempts: 30, correct: 30, lastSeen: 1, confusions: {} };
    p.levels['intervals:7'] = { mastered: true, masteredAt: 1, history: [] };
    const seen = observedPool(7, 100, p, 5);
    expect([...seen.presentations]).toEqual(['desc']);
    expect(track.def.subStages).toBeUndefined();
  });
  it('AC-3.2.2 — Each interval presentation form is a separate Leitner item', () => {
    expect(track.itemsFor(5)).toContain('interval:m6:asc');
    expect(track.itemsFor(8)).toContain('interval:m6:desc');
    expect(track.itemsFor(12)).toContain('interval:m6:harm');
    expect(parseItemId('interval:m6:desc')).toEqual({ intervalId: 'm6', presentation: 'desc' });
  });
});

import { describe, it, expect } from 'vitest';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { SIMPLE_IDS, COMPOUND_IDS } from '../../../src/theory/intervals.js';
import { parseItemId } from '../../../src/tracks/intervals.js';

const tracks = buildTracks();
const track = tracks.byId.intervals;
const levelDef = (n) => track.def.levels.find((l) => l.no === n);

/** The set of intervals that actually appear over `n` generated questions at a level. */
function observedPool(levelNo, n = 300, progress = emptyProgress(), seed = 1) {
  const rng = createRng(seed); const seen = new Map(); const lastAsked = {};
  for (let i = 0; i < n; i++) {
    const recency = Object.fromEntries(Object.entries(lastAsked).map(([k, v]) => [k, i - v]));
    const q = track.generate({ levelNo, subStage: 'asc', progress, rng, settings: DEFAULT_SETTINGS, recency });
    lastAsked[q.itemId] = i;
    seen.set(q.answer, (seen.get(q.answer) ?? 0) + 1);
  }
  return seen;
}
const exact = (levelNo, ids) => { const pool = levelDef(levelNo).pool; expect([...pool].sort()).toEqual([...ids].sort()); expect([...observedPool(levelNo).keys()].sort()).toEqual([...ids].sort()); };
const S12 = SIMPLE_IDS;

describe('US-3.1 Interval level progression', () => {
  it('AC-3.1.1/1 — Interval level 1 pool is exactly P8, P5', () => exact(1, ['P8', 'P5']));
  it('AC-3.1.1/2 — Interval level 2 pool is exactly P8, P5, M3, m3', () => exact(2, ['P8', 'P5', 'M3', 'm3']));
  it('AC-3.1.1/3 — Interval level 3 pool is exactly P8, P5, M3, m3, P4', () => exact(3, ['P8', 'P5', 'M3', 'm3', 'P4']));
  it('AC-3.1.1/4 — Interval level 4 pool is exactly P8, P5, M3, m3, P4, M2, m2', () => exact(4, ['P8', 'P5', 'M3', 'm3', 'P4', 'M2', 'm2']));
  it('AC-3.1.1/5 — Interval level 5 pool is exactly P8, P5, M3, m3, P4, M2, m2, M6, m6', () => exact(5, ['P8', 'P5', 'M3', 'm3', 'P4', 'M2', 'm2', 'M6', 'm6']));
  it('AC-3.1.1/6 — Interval level 6 pool is all 12 simple intervals', () => { exact(6, S12); expect(levelDef(6).pool).toEqual(expect.arrayContaining(['M7', 'm7', 'TT'])); expect(levelDef(6).mixedReview).toBe(false); });
  it('AC-3.1.1/7 — Interval level 7 pool is all 12 simple intervals as mixed review', () => { exact(7, S12); expect(levelDef(7).mixedReview).toBe(true); });
  it('AC-3.1.1/8 — Interval level 8 pool adds m9 and M9', () => exact(8, [...S12, 'm9', 'M9']));
  it('AC-3.1.1/9 — Interval level 9 pool adds m10 and M10', () => exact(9, [...S12, 'm9', 'M9', 'm10', 'M10']));
  it('AC-3.1.1/10 — Interval level 10 pool adds P11 and P12', () => exact(10, [...S12, 'm9', 'M9', 'm10', 'M10', 'P11', 'P12']));
  it('AC-3.1.1/11 — Interval level 11 pool adds m13 and M13', () => exact(11, [...S12, 'm9', 'M9', 'm10', 'M10', 'P11', 'P12', 'm13', 'M13']));
  it('AC-3.1.1/12 — Interval level 12 pool is all simple and compound intervals as mixed review', () => { exact(12, [...S12, ...COMPOUND_IDS]); expect(levelDef(12).mixedReview).toBe(true); });

  it('AC-3.1.2/1 — Intervals from all previous levels appear in the question stream', () => {
    for (let lvl = 2; lvl <= 12; lvl++) {
      const seen = observedPool(lvl, 50, emptyProgress(), lvl);
      const previous = new Set(); for (let k = 1; k < lvl; k++) for (const iv of levelDef(k).pool) previous.add(iv);
      for (const iv of previous) expect(seen.has(iv), `level ${lvl} stream missing ${iv}`).toBe(true);
    }
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

describe('US-3.2 Interval presentation sub-stages', () => {
  it('AC-3.2.2 — Each interval presentation form is a separate Leitner item', () => {
    for (const s of ['asc', 'desc', 'harm']) expect(track.itemsFor(5, s)).toContain(`interval:m6:${s}`);
    expect(parseItemId('interval:m6:desc')).toEqual({ intervalId: 'm6', presentation: 'desc' });
  });
});

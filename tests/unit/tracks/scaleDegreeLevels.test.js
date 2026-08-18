import { describe, it, expect } from 'vitest';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { degreeWeights } from '../../../src/tracks/scaleDegrees.js';

const track = buildTracks().byId.scaleDegrees;
const level = (n) => track.def.levels.find((l) => l.no === n);
function counts(levelNo, accuracy, n = 500, seed = 4) {
  const rng = createRng(seed); const c = {}; const lastAsked = {};
  for (let i = 0; i < n; i++) {
    const recency = Object.fromEntries(Object.entries(lastAsked).map(([k, v]) => [k, i - v]));
    const q = track.generate({ levelNo, progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS, accuracy, recency });
    lastAsked[q.itemId] = i; c[q.answer] = (c[q.answer] ?? 0) + 1;
  }
  return c;
}

describe('US-4.2 Scale degree level progression', () => {
  it('AC-4.2.1/1 — Scale-degree level 1 pool is Do, Mi, Sol in major keys', () => {
    expect(level(1).pool).toEqual(['Do', 'Mi', 'Sol']); expect(level(1).mode).toBe('major');
    expect(Object.keys(counts(1, 0.5)).sort()).toEqual(['Do', 'Mi', 'Sol']);
  });
  it('AC-4.2.1/2 — Scale-degree level 2 pool adds Re and La', () => {
    expect([...level(2).pool].sort()).toEqual(['Do', 'La', 'Mi', 'Re', 'Sol']);
    expect(Object.keys(counts(2, 0.5)).sort()).toEqual(['Do', 'La', 'Mi', 'Re', 'Sol']);
  });
  it('AC-4.2.1/3 — Scale-degree level 3 pool adds Fa and Ti for all diatonic major degrees', () => {
    expect([...level(3).pool].sort()).toEqual(['Do', 'Fa', 'La', 'Mi', 'Re', 'Sol', 'Ti']); expect(level(3).mode).toBe('major');
    expect(Object.keys(counts(3, 0.5)).length).toBe(7);
  });
  it('AC-4.2.1/4 — Scale-degree level 4 uses all diatonic degrees in minor keys with a minor cadence', () => {
    expect(level(4).mode).toBe('minor');
    expect([...level(4).pool].sort()).toEqual(['Do', 'Fa', 'Le', 'Me', 'Re', 'Sol', 'Te']);
    const q = track.generate({ levelNo: 4, progress: emptyProgress(), rng: createRng(1), settings: DEFAULT_SETTINGS, withCadence: true });
    expect(q.meta.mode).toBe('minor');
    // minor cadence: the first chord is a minor triad on the tonic (i)
    const first = q.exercise.prelude.events.filter((e) => e.at === 0).map((e) => (e.midi - q.meta.tonic + 120) % 12).sort((a, b) => a - b);
    expect(first).toEqual([0, 3, 7]);
  });
  it('AC-4.2.1/5 — Scale-degree level 5 adds chromatic degrees with movable-do chromatic syllables', () => {
    expect(level(5).pool).toEqual(expect.arrayContaining(['Di', 'Ri', 'Fi', 'Si', 'Li']));
    expect(level(5).pool.length).toBe(12);
    const c = counts(5, 0.5); expect(Object.keys(c)).toEqual(expect.arrayContaining(['Di', 'Ri', 'Fi', 'Si', 'Li']));
    expect(track.optionLabel('Fi', { labels: { degrees: 'both' } })).toBe('Fi · ♯4');
  });
  it('AC-4.2.2 — Stable degrees are weighted higher before proficiency', () => {
    const c = counts(3, 0.6, 50 * 10);
    const stable = (c.Do + c.Sol + c.Mi) / 3; const tendency = (c.Fa + c.Ti) / 2;
    expect(stable).toBeGreaterThan(tendency * 1.5);
    const w = degreeWeights(level(3).pool, 0.6); expect(w.Do).toBeGreaterThan(w.Fa);
    // over exactly 50 questions the ordering holds too
    const c50 = counts(3, 0.6, 50, 9); expect(c50.Do + c50.Sol + c50.Mi).toBeGreaterThan(c50.Fa + c50.Ti);
  });
  it('AC-4.2.3 — Tendency tones are weighted higher after proficiency', () => {
    const before = counts(3, 0.6, 500); const after = counts(3, 0.8, 500);
    expect(after.Fa + after.Ti).toBeGreaterThan(before.Fa + before.Ti);
    const w = degreeWeights(level(3).pool, 0.8); expect(w.Fa).toBeGreaterThan(w.Do); expect(w.Ti).toBeGreaterThan(w.Sol);
    const c50 = counts(3, 0.8, 50, 9); expect(c50.Fa + c50.Ti).toBeGreaterThan(0);
  });
});

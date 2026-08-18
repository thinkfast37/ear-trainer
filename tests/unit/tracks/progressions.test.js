import { describe, it, expect } from 'vitest';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { catalogItems, parseItemId } from '../../../src/tracks/progressions.js';
import { parseNumeral, rotations } from '../../../src/theory/progressions.js';
import catalog from '../../../src/data/progressions.json';
import { harness } from '../helpers/harness.js';

const track = buildTracks().byId.progressions;
function sample(levelNo, n = 200, seed = 1, subStage = 'block') {
  const rng = createRng(seed); const out = [];
  for (let i = 0; i < n; i++) out.push(track.generate({ levelNo, subStage, progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS }));
  return out;
}
const numeralsUsed = (qs) => new Set(qs.flatMap((q) => q.answer));

describe('US-8.2 Progression level design', () => {
  it('AC-8.2.1/1 — Progression level 1 uses only I, IV, V in root position', () => {
    const qs = sample(1);
    for (const n of numeralsUsed(qs)) { expect(['I', 'IV', 'V']).toContain(n); expect(parseNumeral(n).inversion).toBe(0); }
    expect(track.def.levels[0].vocabulary).toEqual(['I', 'IV', 'V']);
  });
  it('AC-8.2.1/2 — Progression level 2 adds vi with 4-chord pop templates', () => {
    const qs = sample(2); const used = numeralsUsed(qs);
    expect(used.has('vi')).toBe(true);
    for (const n of used) expect(['I', 'IV', 'V', 'vi']).toContain(n);
    expect(qs.some((q) => q.answer.length === 4 && q.answer.includes('vi'))).toBe(true);
    expect(qs.some((q) => q.answer.join('-') === 'I-V-vi-IV')).toBe(true);
  });
  it('AC-8.2.1/3 — Progression level 3 adds ii and iii', () => {
    const used = numeralsUsed(sample(3, 300)); expect(used.has('ii')).toBe(true); expect(used.has('iii')).toBe(true);
    for (const n of used) expect(['I', 'ii', 'iii', 'IV', 'V', 'vi']).toContain(n);
  });
  it('AC-8.2.1/4 — Progression level 4 uses minor-key vocabulary i, iv, v, V, VI, VII, III', () => {
    const qs = sample(4, 400);
    const minor = qs.filter((q) => q.meta.mode === 'minor');
    expect(minor.length).toBeGreaterThan(50);
    const used = numeralsUsed(minor);
    for (const n of used) expect(['i', 'iv', 'v', 'V', 'V7', 'VI', 'VII', 'III']).toContain(n);
    expect(used.has('i')).toBe(true); expect(used.has('VII')).toBe(true);
    // v vs V discrimination is present (natural-minor cadence in the catalog)
    expect(catalog.filter((e) => e.level === 4).some((e) => e.numerals.includes('v'))).toBe(true);
  });
  it('AC-8.2.1/5 — Progression level 5 uses diatonic seventh qualities', () => {
    const qs = sample(5, 400).filter((q) => q.meta.entry.level === 5);
    expect(qs.length).toBeGreaterThan(20);
    for (const q of qs) for (const n of q.answer) expect(['maj7', 'm7', 'dom7']).toContain(parseNumeral(n).quality);
    expect(numeralsUsed(qs)).toEqual(expect.any(Set)); expect([...numeralsUsed(qs)]).toEqual(expect.arrayContaining(['ii7', 'V7', 'Imaj7']));
  });
  it('AC-8.2.1/6 — Progression level 6 uses inversions in the bass', () => {
    const qs = sample(6, 500).filter((q) => q.meta.entry.level === 6);
    expect(qs.length).toBeGreaterThan(20);
    expect(qs.some((q) => q.answer.some((n) => parseNumeral(n).inversion > 0))).toBe(true);
    // the bass note is the inversion tone
    const q = qs.find((x) => x.answer.includes('V6'));
    if (q) { const idx = q.answer.indexOf('V6'); const onsets = [...new Set(q.exercise.events.map((e) => e.at))].sort((a, b) => a - b); const bass = Math.min(...q.exercise.events.filter((e) => e.at === onsets[idx]).map((e) => e.midi)); expect((bass - q.meta.tonic + 120) % 12).toBe(11); }
  });
  it('AC-8.2.1/7 — Progression level 7 uses 8-chord phrases and borrowed chords', () => {
    const qs = sample(7, 600).filter((q) => q.meta.entry.level === 7);
    expect(qs.some((q) => q.answer.length === 8)).toBe(true);
    const used = numeralsUsed(qs);
    expect([...used].some((n) => /^b/.test(n) || n === 'iv' || n === 'III')).toBe(true);
    expect(used.has('bVII')).toBe(true);
  });
  it('AC-8.2.1/8 — Every generated progression is played in a randomly selected key', () => {
    const qs = sample(2, 40, 7);
    const keys = new Set(qs.map((q) => q.meta.key));
    expect(keys.size).toBeGreaterThanOrEqual(6);
    for (const q of qs) { expect(q.meta.key).toBeGreaterThanOrEqual(0); expect(q.meta.key).toBeLessThan(12); expect(q.exercise.key.tonicMidi % 12).toBe(q.meta.key % 12); }
  });
  it('AC-8.2.2 — Progressions are drawn only from the built-in catalog at or below the level', () => {
    for (const lvl of [1, 2, 3, 4, 5, 6, 7]) {
      for (const q of sample(lvl, 120, lvl)) {
        const { entryId, rotation } = parseItemId(q.itemId);
        const entry = catalog.find((e) => e.id === entryId);
        expect(entry).toBeTruthy(); expect(entry.level).toBeLessThanOrEqual(lvl); expect(entry.active).toBe(true);
        const expected = entry.rotations ? rotations(entry.numerals)[rotation] : entry.numerals;
        expect(q.answer).toEqual(expected);
      }
    }
  });
  it('AC-8.2.4 — Each rotation of a rotation-marked family is a distinct Leitner item', async () => {
    const items = catalogItems(catalog, 2, 'block').filter((c) => c.entry.id === 8);
    expect(items.map((c) => c.id)).toEqual(['prog:8r0:block', 'prog:8r1:block', 'prog:8r2:block', 'prog:8r3:block']);
    expect(items.map((c) => c.numerals.join('–'))).toEqual(['I–V–vi–IV', 'V–vi–IV–I', 'vi–IV–I–V', 'IV–I–V–vi']);
    // answering one rotation moves only that item
    const p = emptyProgress(); for (const c of items) p.items[c.id] = { box: 3, attempts: 2, correct: 1, lastSeen: 1, confusions: {} };
    const h = harness({ trackId: 'progressions', levelNo: 2, progress: p, seed: 5 });
    await h.session.start(); let guard = 0;
    while (h.session.state.question.itemId !== 'prog:8r2:block' && guard++ < 500) await h.session.next();
    expect(h.session.state.question.itemId).toBe('prog:8r2:block');
    h.session.submit(h.session.state.question.answer);
    const after = h.store.getState().items;
    expect(after['prog:8r2:block'].box).toBe(4); expect(after['prog:8r0:block'].box).toBe(3); expect(after['prog:8r1:block'].box).toBe(3); expect(after['prog:8r3:block'].box).toBe(3);
  });
  it('AC-8.2.5 — A cadence establishes the key before every progression', async () => {
    for (const q of sample(3, 30)) {
      const pre = q.exercise.prelude.events; const onsets = [...new Set(pre.map((e) => e.at))].sort((a, b) => a - b);
      expect(onsets.length).toBe(4);
      const first = new Set(pre.filter((e) => e.at === onsets[0]).map((e) => (e.midi - q.meta.tonic + 120) % 12));
      expect([...first].sort((a, b) => a - b)).toEqual(q.meta.mode === 'minor' ? [0, 3, 7] : [0, 4, 7]);
      expect(q.exercise.prelude.duration).toBeGreaterThan(onsets[3]);
    }
    const h = harness({ trackId: 'progressions', levelNo: 1, seed: 1 });
    await h.session.start();
    const notes = h.sampler.notes.filter((n) => n.midi);
    const stimulusStart = notes.length - h.session.state.question.exercise.events.length;
    expect(notes.slice(0, stimulusStart).length).toBe(12);
  });
});

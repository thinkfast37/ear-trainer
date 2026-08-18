import { describe, it, expect } from 'vitest';
import { buildTracks } from '../../../src/tracks/index.js';
import { DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { maxLeap } from '../helpers/melody.js';
import { harness } from '../helpers/harness.js';

const track = buildTracks().byId.melodic;
function phrases(levelNo, n = 100, seed = 1) {
  const rng = createRng(seed); const out = [];
  for (let i = 0; i < n; i++) out.push(track.generate({ levelNo, rng, settings: DEFAULT_SETTINGS }));
  return out;
}
const isStep = (degrees) => maxLeap(degrees) <= 2;

describe('US-7.1 Melodic dictation levels', () => {
  it('AC-7.1.1/1 — Melodic level 1 phrases are 3 stepwise notes starting on Do in even eighths', () => {
    for (const q of phrases(1)) { const p = q.meta.phrase; expect(p.degrees.length).toBe(3); expect(p.degrees[0]).toBe(1); expect(isStep(p.degrees)).toBe(true); expect(p.rhythm.every((r) => r === 0.5)).toBe(true); expect(q.answer).toEqual(p.degrees.map(String)); }
  });
  it('AC-7.1.1/2 — Melodic level 2 phrases are 4 to 5 notes of steps and thirds starting on Do', () => {
    const ps = phrases(2);
    for (const q of ps) { const p = q.meta.phrase; expect([4, 5]).toContain(p.degrees.length); expect(p.degrees[0]).toBe(1); expect(maxLeap(p.degrees)).toBeLessThanOrEqual(4); }
    expect(ps.some((q) => q.meta.phrase.degrees.length === 4)).toBe(true); expect(ps.some((q) => q.meta.phrase.degrees.length === 5)).toBe(true);
    expect(ps.some((q) => maxLeap(q.meta.phrase.degrees) >= 3)).toBe(true); // thirds occur
  });
  it('AC-7.1.1/3 — Melodic level 3 phrases are 8 eighth notes with diatonic leaps up to P5', () => {
    const ps = phrases(3);
    for (const q of ps) { const p = q.meta.phrase; expect(p.degrees.length).toBe(8); expect(p.rhythm).toEqual(Array(8).fill(0.5)); expect(maxLeap(p.degrees)).toBeLessThanOrEqual(7); }
    expect(ps.some((q) => maxLeap(q.meta.phrase.degrees) >= 5)).toBe(true);
  });
  it('AC-7.1.1/4 — Melodic level 4 phrases start on a degree other than Do', () => {
    for (const q of phrases(4)) { expect(q.meta.phrase.degrees[0]).not.toBe(1); expect(q.meta.phrase.degrees[0]).not.toBe(8); }
  });
  it('AC-7.1.1/5 — Melodic level 5 phrases allow leaps larger than P5 and non-scalar contours', () => {
    const ps = phrases(5, 200);
    expect(ps.some((q) => maxLeap(q.meta.phrase.degrees) > 7)).toBe(true);
    // non-scalar: a contour that is not a monotonic run of steps
    expect(ps.some((q) => { const d = q.meta.phrase.degrees; return d.some((x, i) => i > 1 && Math.sign(x - d[i - 1]) !== Math.sign(d[i - 1] - d[i - 2]) && Math.abs(x - d[i - 1]) > 1); })).toBe(true);
    // levels 1–4 never exceed P5
    for (const l of [1, 2, 3, 4]) for (const q of phrases(l, 50, 5)) expect(maxLeap(q.meta.phrase.degrees)).toBeLessThanOrEqual(7);
  });
  it('AC-7.1.1/6 — Melodic level 6 phrases vary rhythm with quarters, eighths and simple syncopation', () => {
    const ps = phrases(6, 200);
    expect(ps.some((q) => q.meta.phrase.rhythm.includes(1) && q.meta.phrase.rhythm.includes(0.5))).toBe(true);
    expect(ps.some((q) => q.meta.phrase.syncopated)).toBe(true);
    for (const l of [1, 2, 3, 4, 5]) for (const q of phrases(l, 30, 6)) expect(q.meta.phrase.rhythm.every((r) => r === 0.5)).toBe(true);
  });
  it('AC-7.1.2 — A cadence and tonic reference precede every phrase', async () => {
    for (const q of phrases(3, 30)) {
      const pre = q.exercise.prelude.events;
      const onsets = [...new Set(pre.map((e) => e.at))].sort((a, b) => a - b);
      expect(onsets.length).toBe(5); // 4 cadence chords + tonic reference
      const last = pre.filter((e) => e.at === onsets[4]);
      expect(last.length).toBe(1); expect(last[0].midi).toBe(q.meta.tonic);
      expect(q.exercise.prelude.duration).toBeGreaterThan(onsets[4]);
    }
    const h = harness({ trackId: 'melodic', levelNo: 1, seed: 2 });
    await h.session.start();
    const notes = h.sampler.notes.filter((n) => n.midi);
    const stim = h.session.state.question.exercise.events.length;
    expect(notes.length).toBeGreaterThan(stim + 12);
  });
});

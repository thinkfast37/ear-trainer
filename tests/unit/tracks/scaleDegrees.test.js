import { describe, it, expect } from 'vitest';
import { harness } from '../helpers/harness.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { degreeToMidi } from '../../../src/theory/scales.js';

describe('US-4.1 Tonal context establishment', () => {
  it('AC-4.1.1 — A cadence in the question key precedes each scale-degree question', async () => {
    const track = buildTracks().byId.scaleDegrees; const rng = createRng(2);
    // generate until the key is E♭ (index 3)
    let q; let guard = 0;
    do { q = track.generate({ levelNo: 3, progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS, withCadence: true }); } while (q.meta.key !== 3 && guard++ < 200);
    expect(q.meta.key).toBe(3);
    const tonicPc = q.meta.tonic % 12; expect(tonicPc).toBe(3);
    // prelude = I–IV–V–I in E♭ before the target
    const onsets = [...new Set(q.exercise.prelude.events.map((e) => e.at))].sort((a, b) => a - b);
    expect(onsets.length).toBe(4);
    const pcs = onsets.map((t) => [...new Set(q.exercise.prelude.events.filter((e) => e.at === t).map((e) => e.midi % 12))].sort((a, b) => a - b));
    expect(pcs[0]).toEqual([3, 7, 10]); expect(pcs[1]).toEqual([3, 8, 0].sort((a, b) => a - b)); expect(pcs[2]).toEqual([10, 2, 5].sort((a, b) => a - b)); expect(pcs[3]).toEqual([3, 7, 10]);
    // then the target degree in that key
    expect(q.exercise.events[0].midi).toBe(degreeToMidi(q.meta.tonic, q.answer));
    // and the renderer plays prelude before stimulus (session path, everyQuestion setting)
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, seed: 2 });
    await h.session.start();
    const notes = h.sampler.notes.filter((n) => n.midi);
    const stimulus = notes[notes.length - 1];
    expect(notes.filter((n) => n.at < stimulus.at).length).toBeGreaterThanOrEqual(12);
  });
  it('AC-4.1.2 — Keys rotate across a session', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 2, seed: 6 });
    await h.session.start();
    const keys = new Set();
    for (let i = 0; i < 24; i++) { keys.add(h.session.state.question.meta.key); h.session.submit(h.session.state.question.answer); if (i < 23) await h.session.next(); }
    expect(keys.size).toBeGreaterThanOrEqual(6);
    for (const k of keys) { expect(k).toBeGreaterThanOrEqual(0); expect(k).toBeLessThan(12); }
  });
});

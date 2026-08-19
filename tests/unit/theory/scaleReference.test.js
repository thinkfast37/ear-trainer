import { describe, it, expect } from 'vitest';
import { harness } from '../helpers/harness.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { createScaleDegreesTrack } from '../../../src/tracks/scaleDegrees.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { scaleDegreeExercise } from '../../../src/theory/exercise.js';
import { scaleReferenceEvents } from '../../../src/theory/cadence.js';
import { MAJOR } from '../../../src/theory/scales.js';
import levels from '../../../src/data/levels.json';

const G = 67; // G4
const UP_DOWN = [...MAJOR, 12, ...[...MAJOR].reverse()]; // Do Re Mi Fa Sol La Ti Do' Ti La Sol Fa Mi Re Do

function gen(levelNo, seed = 3, settings = DEFAULT_SETTINGS) {
  const track = buildTracks().byId.scaleDegrees;
  return track.generate({ levelNo, progress: emptyProgress(), rng: createRng(seed), settings });
}

describe('US-4.4 — Scale reference scaffold for novices', () => {
  it('AC-4.4.1/1 — The major scale plays ascending Do to Do and back down before the cadence at level 1', () => {
    const q = gen(1);
    const tonic = q.meta.tonic;
    const events = [...q.exercise.prelude.events].sort((a, b) => a.at - b.at);
    const scaleNotes = events.slice(0, UP_DOWN.length);
    expect(scaleNotes.map((e) => e.midi - tonic)).toEqual(UP_DOWN);
    // one note at a time: strictly increasing onsets
    for (let i = 1; i < scaleNotes.length; i++) expect(scaleNotes[i].at).toBeGreaterThan(scaleNotes[i - 1].at);
    // the cadence's first chord starts after the last scale note
    const scaleEnd = scaleNotes[scaleNotes.length - 1].at;
    const cadenceStart = q.exercise.prelude.parts.cadence.duration ? events[UP_DOWN.length].at : null;
    expect(cadenceStart).toBeGreaterThan(scaleEnd);
  });

  it('AC-4.4.1/2 — The cadence follows the scale at level 1', () => {
    const ex = scaleDegreeExercise(G, 'Mi', 'major', { scale: 'auto' });
    const scaleDur = ex.prelude.parts.scale.duration;
    const chords = ex.prelude.events.filter((e) => e.at >= scaleDur);
    const onsets = [...new Set(chords.map((e) => e.at))].sort((a, b) => a - b);
    expect(onsets.length).toBe(4); // I IV V I
    const pcs = onsets.map((t) => [...new Set(chords.filter((e) => e.at === t).map((e) => e.midi % 12))].sort((a, b) => a - b));
    expect(pcs[0]).toEqual([2, 7, 11]); // G B D
    expect(pcs[3]).toEqual([2, 7, 11]);
  });

  it('AC-4.4.1/3 — The target note follows the cadence at level 1', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, seed: 3 });
    await h.session.start();
    const notes = h.sampler.notes.filter((n) => n.midi);
    const target = notes[notes.length - 1];
    const q = h.session.state.question;
    expect(target.midi).toBe(q.exercise.events[0].midi);
    const preludeEnd = Math.max(...notes.slice(0, -1).map((n) => n.at));
    expect(target.at).toBeGreaterThan(preludeEnd);
    // 15 scale notes + 12 cadence notes precede it
    expect(notes.length - 1).toBe(UP_DOWN.length + 12);
  });

  it("AC-4.4.1/4 — The scale is part of the question's prelude, rendered by the one renderer", async () => {
    const q = gen(1);
    expect(q.exercise.prelude.parts.scale.events.length).toBe(UP_DOWN.length);
    expect(q.exercise.prelude.events.length).toBe(UP_DOWN.length + 12);
    // the same exercise renders identically twice through the renderer (D-003)
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, seed: 3 });
    const a = await h.renderer.play(q.exercise);
    const b = await h.renderer.play(q.exercise);
    const rel = (r) => r.log.filter((x) => x.midi).map((x) => [x.midi, +(x.at - r.start).toFixed(6)]);
    expect(rel(a)).toEqual(rel(b));
    expect(rel(a).length).toBe(UP_DOWN.length + 12 + 1);
  });

  it('AC-4.4.2/1 — Level 1 auto-plays the scale and offers it on demand', async () => {
    const q = gen(1);
    expect(q.meta.scaleReference).toBe('auto');
    expect(q.exercise.prelude.parts.scale).toBeTruthy();
    expect(q.exercise.prelude.events.length).toBe(UP_DOWN.length + 12);
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1 });
    await h.session.start();
    expect(h.session.scaleAvailable()).toBe(true);
  });

  it('AC-4.4.2/2 — Level 2 does not auto-play the scale but offers it on demand', async () => {
    const q = gen(2);
    expect(q.meta.scaleReference).toBe('onDemand');
    expect(q.exercise.prelude.parts.scale).toBeTruthy();
    expect(q.exercise.prelude.events.length).toBe(12); // cadence only auto-plays
    const h = harness({ trackId: 'scaleDegrees', levelNo: 2 });
    await h.session.start();
    expect(h.session.scaleAvailable()).toBe(true);
    const played = h.sampler.notes.filter((n) => n.midi).length;
    expect(played).toBe(12 + 1);
  });

  it('AC-4.4.2/3 — Level 3 and above neither play nor offer the scale', async () => {
    for (const no of [3, 4, 5]) {
      const q = gen(no);
      expect(q.meta.scaleReference).toBe('none');
      expect(q.exercise.prelude.parts.scale).toBeUndefined();
      expect(q.exercise.prelude.events.length).toBe(12);
    }
    const h = harness({ trackId: 'scaleDegrees', levelNo: 3 });
    await h.session.start();
    expect(h.session.scaleAvailable()).toBe(false);
    expect(await h.session.hearScale()).toBe(false);
  });

  it('AC-4.4.2/4 — The scale scaffold policy is read from the level definition, not fixed in code', () => {
    const def = levels.tracks.find((t) => t.id === 'scaleDegrees');
    const policy = Object.fromEntries(def.levels.map((l) => [l.no, l.scaleReference]));
    expect(policy).toEqual({ 1: 'auto', 2: 'onDemand', 3: 'none', 4: 'none', 5: 'none' });
    // the track honours an altered definition rather than its own table
    const altered = structuredClone(def);
    altered.levels.find((l) => l.no === 3).scaleReference = 'auto';
    altered.levels.find((l) => l.no === 1).scaleReference = 'none';
    const t = createScaleDegreesTrack(altered);
    const args = (levelNo) => ({ levelNo, progress: emptyProgress(), rng: createRng(1), settings: DEFAULT_SETTINGS });
    expect(t.generate(args(3)).exercise.prelude.parts.scale).toBeTruthy();
    expect(t.generate(args(1)).exercise.prelude.parts.scale).toBeUndefined();
  });

  it('AC-4.4.6/1 — The scale auto-plays only when the cadence auto-plays', async () => {
    const played = async (cadenceFrequency) => {
      const p = emptyProgress(); p.settings.cadenceFrequency = cadenceFrequency;
      const h = harness({ trackId: 'scaleDegrees', levelNo: 1, progress: p });
      await h.session.start();
      const first = h.sampler.notes.filter((n) => n.midi).length;
      h.sampler.notes.length = 0;
      h.session.submit(h.session.state.question.answer);
      await h.session.next();
      const second = h.sampler.notes.filter((n) => n.midi).length;
      return [first, second];
    };
    expect(await played('everyQuestion')).toEqual([UP_DOWN.length + 12 + 1, UP_DOWN.length + 12 + 1]);
    expect(await played('firstOnly')).toEqual([UP_DOWN.length + 12 + 1, 1]);
    expect(await played('never')).toEqual([1, 1]);
  });
});

describe('scaleReferenceEvents', () => {
  it('spans Do to Do and back at eighth notes of the tempo', () => {
    const r = scaleReferenceEvents(60, 'major', 0, 120);
    expect(r.events.map((e) => e.midi - 60)).toEqual(UP_DOWN);
    expect(r.events[1].at - r.events[0].at).toBeCloseTo(0.25);
    expect(r.duration).toBeCloseTo(UP_DOWN.length * 0.25);
  });
});

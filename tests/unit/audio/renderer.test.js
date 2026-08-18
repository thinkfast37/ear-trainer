import { describe, it, expect } from 'vitest';
import { createRenderer } from '../../../src/audio/renderer.js';
import { FakeAudioContext, fakeSampler } from './fakeAudioContext.js';
import { singleNote, intervalExercise, chordExercise, melodicExercise, progressionExercise, scaleDegreeExercise } from '../../../src/theory/exercise.js';
import { numeralToChord } from '../../../src/theory/progressions.js';
import { blockVoicings } from '../../../src/theory/voicing.js';
import { LOOKAHEAD } from '../../../src/audio/scheduler.js';

function setup() {
  const ctx = new FakeAudioContext({ currentTime: 0, state: 'running' });
  const sampler = fakeSampler(ctx);
  const audio = { ensureRunning: async () => ctx, get: () => ctx, now: () => 0 };
  return { ctx, sampler, renderer: createRenderer({ audio, sampler }) };
}
const notes = (log) => log.map((e) => ({ midi: e.midi, at: Number((e.at - LOOKAHEAD).toFixed(6)), dur: Number(e.dur.toFixed(6)) }));

describe('US-1.3 Unified exercise renderer', () => {
  it('AC-1.3.1/1 — A single note renders as one note at its pitch and duration', async () => {
    const { renderer } = setup();
    const { log } = await renderer.play(singleNote(64, { dur: 0.7 }));
    expect(notes(log)).toEqual([{ midi: 64, at: 0, dur: 0.7 }]);
  });
  it('AC-1.3.1/2 — An ascending interval renders its two notes lower then higher', async () => {
    const { renderer } = setup();
    const { log } = await renderer.play(intervalExercise(60, 7, 'asc'));
    const n = notes(log); expect(n.map((x) => x.midi)).toEqual([60, 67]); expect(n[1].at).toBeGreaterThan(n[0].at);
  });
  it('AC-1.3.1/3 — A descending interval renders its two notes higher then lower', async () => {
    const { renderer } = setup();
    const { log } = await renderer.play(intervalExercise(60, 7, 'desc'));
    const n = notes(log); expect(n.map((x) => x.midi)).toEqual([67, 60]); expect(n[1].at).toBeGreaterThan(n[0].at);
  });
  it('AC-1.3.1/4 — A harmonic interval renders both notes at the same onset', async () => {
    const { renderer } = setup();
    const { log } = await renderer.play(intervalExercise(60, 7, 'harm'));
    const n = notes(log); expect(n.map((x) => x.midi).sort()).toEqual([60, 67]); expect(n[0].at).toBe(n[1].at);
  });
  it('AC-1.3.1/5 — A block chord renders all chord tones at the same onset', async () => {
    const { renderer } = setup();
    const { log } = await renderer.play(chordExercise(60, 'dom7', 0, 'block'));
    const n = notes(log); expect(n.map((x) => x.midi)).toEqual([60, 64, 67, 70]); expect(new Set(n.map((x) => x.at)).size).toBe(1);
  });
  it('AC-1.3.1/6 — An arpeggiated chord renders its tones in sequence at the arpeggiation tempo', async () => {
    const { renderer } = setup();
    const { log } = await renderer.play(chordExercise(60, 'maj', 0, 'arp', { tempo: 120 }));
    const n = notes(log); expect(n.map((x) => x.midi)).toEqual([60, 64, 67]); expect(n.map((x) => x.at)).toEqual([0, 0.25, 0.5]);
    const { log: slow } = await renderer.play(chordExercise(60, 'maj', 0, 'arp', { tempo: 60 }));
    expect(notes(slow).map((x) => x.at)).toEqual([0, 0.5, 1]);
  });
  it('AC-1.3.1/7 — A melodic sequence renders each note at its own onset and duration', async () => {
    const { renderer } = setup();
    const ex = melodicExercise(60, [1, 2, 3, 5], [0.5, 0.5, 1, 0.5], 'major', { bpm: 120, withPrelude: false });
    const { log } = await renderer.play(ex);
    const n = notes(log); expect(n.map((x) => x.midi)).toEqual([60, 62, 64, 67]);
    expect(n.map((x) => x.at)).toEqual([0, 0.25, 0.5, 1]);
    expect(n[2].dur).toBeGreaterThan(n[0].dur);
  });
  it('AC-1.3.1/8 — A chord progression renders each chord in order at its own onset', async () => {
    const { renderer } = setup();
    const chords = blockVoicings(['I', 'IV', 'V'].map((x) => numeralToChord(x, 60)));
    const ex = progressionExercise(chords, 'block', { tonicMidi: 60, mode: 'major' }, { withCadence: false, chordDur: 1 });
    const { log } = await renderer.play(ex);
    const onsets = [...new Set(notes(log).map((x) => x.at))];
    expect(onsets).toEqual([0, 1, 2]);
    const chordAt = (t) => notes(log).filter((x) => x.at === t).map((x) => x.midi % 12).sort((a, b) => a - b);
    expect(chordAt(0)).toEqual([0, 4, 7]); expect(chordAt(1)).toEqual([0, 5, 9]); expect(chordAt(2)).toEqual([2, 7, 11]);
  });
  it('AC-1.3.2 — A cadence prelude plays in the exercise key before the stimulus', async () => {
    const { renderer } = setup();
    const ex = scaleDegreeExercise(69, 'Mi', 'major'); // A major, target C#
    const { log } = await renderer.play(ex);
    const n = notes(log);
    const stimulusAt = n[n.length - 1].at;
    const prelude = n.filter((x) => x.at < stimulusAt);
    const onsets = [...new Set(prelude.map((x) => x.at))];
    expect(onsets.length).toBe(4);
    const pcs = onsets.map((t) => new Set(prelude.filter((x) => x.at === t).map((x) => x.midi % 12)));
    const sorted = (s) => [...s].sort((a, b) => a - b);
    // I (A C# E), IV (D F# A), V (E G# B), I — in A major
    expect(sorted(pcs[0])).toEqual([1, 4, 9]); expect(sorted(pcs[1])).toEqual([2, 6, 9]); expect(sorted(pcs[2])).toEqual([4, 8, 11]); expect(sorted(pcs[3])).toEqual([1, 4, 9]);
    expect(n[n.length - 1].midi).toBe(73);
  });
});

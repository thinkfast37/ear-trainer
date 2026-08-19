/** Cadence preludes, tonic references and the scale reference as event lists (Exercise fragments). */
import { chordTones } from './chords.js';
import { MAJOR, MINOR, HARMONIC_MINOR } from './scales.js';

const CHORD_DUR = 0.55;

/**
 * I–IV–V–I in major, i–iv–V–i in minor (raised leading tone on V), voiced around the tonic
 * octave. Returns {events, duration}.
 */
export function cadenceEvents(tonicMidi, mode = 'major', at = 0) {
  const scale = mode === 'minor' ? MINOR : MAJOR;
  const degrees = mode === 'minor' ? [[1, 'min'], [4, 'min'], [5, 'maj'], [1, 'min']] : [[1, 'maj'], [4, 'maj'], [5, 'maj'], [1, 'maj']];
  const events = [];
  let t = at;
  for (const [deg, q] of degrees) {
    const root = tonicMidi + (mode === 'minor' && deg === 5 ? HARMONIC_MINOR[4] : scale[deg - 1]) - (deg >= 4 ? 12 : 0);
    // keep IV and V below the tonic so the cadence sits under the stimulus register
    for (const m of chordTones(root, q, 0)) events.push({ midi: m, at: t, dur: CHORD_DUR, gain: 0.7 });
    t += CHORD_DUR;
  }
  return { events, duration: t - at };
}

export function tonicReference(tonicMidi, at = 0) {
  return { events: [{ midi: tonicMidi, at, dur: 0.6, gain: 0.8 }], duration: 0.7 };
}

/**
 * Scale reference (US-4.4): the scale one note at a time, ascending Do → Do (octave) and back
 * down to the starting Do, at eighth notes of `tempo` BPM. Returns {events, duration}.
 */
export function scaleReferenceEvents(tonicMidi, mode = 'major', at = 0, tempo = 120) {
  const scale = mode === 'minor' ? MINOR : MAJOR;
  const up = [...scale, 12];
  const steps = [...up, ...up.slice(0, -1).reverse()];
  const step = 60 / tempo / 2;
  const events = steps.map((semi, i) => ({ midi: tonicMidi + semi, at: at + i * step, dur: step * 0.9, gain: 0.8 }));
  return { events, duration: steps.length * step };
}

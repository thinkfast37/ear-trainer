/**
 * Exercise builders (D-003). Every track produces one of these; the renderer knows nothing
 * else. Shape: { kind, presentation, key, events:[{midi,at,dur,gain}], prelude?:{events,duration}, meta }.
 */
import { chordTones } from './chords.js';
import { arpeggiate, arpeggioDuration } from './voicing.js';
import { cadenceEvents, tonicReference, scaleReferenceEvents } from './cadence.js';
import { degreeToMidi, scaleStep } from './scales.js';

const NOTE = 0.8;
const GAP = 0.15;

export function singleNote(midi, { dur = NOTE } = {}) {
  return { kind: 'single', presentation: 'single', events: [{ midi, at: 0, dur, gain: 1 }] };
}

export function intervalExercise(low, semitones, presentation) {
  const high = low + semitones;
  if (presentation === 'harm') {
    return { kind: 'interval', presentation, events: [{ midi: low, at: 0, dur: 1.2, gain: 0.9 }, { midi: high, at: 0, dur: 1.2, gain: 0.9 }] };
  }
  const order = presentation === 'desc' ? [high, low] : [low, high];
  return { kind: 'interval', presentation, events: order.map((m, i) => ({ midi: m, at: i * (NOTE + GAP), dur: NOTE, gain: 1 })) };
}

export function chordExercise(root, quality, inversion, presentation, { tempo = 120 } = {}) {
  const tones = chordTones(root, quality, inversion);
  if (presentation === 'arp') return { kind: 'chord', presentation, events: arpeggiate(tones, 0, tempo) };
  return { kind: 'chord', presentation, events: tones.map((midi) => ({ midi, at: 0, dur: 1.4, gain: 0.9 })) };
}

/** Degrees (numbers) + rhythm (beats) in a key → melodic sequence with cadence + tonic prelude. */
export function melodicExercise(tonicMidi, degrees, rhythm, mode = 'major', { bpm = 100, withPrelude = true } = {}) {
  const beat = 60 / bpm;
  const events = [];
  let t = 0;
  degrees.forEach((d, i) => {
    events.push({ midi: tonicMidi + scaleStep(d, mode), at: t, dur: rhythm[i] * beat * 0.95, gain: 1 });
    t += rhythm[i] * beat;
  });
  const ex = { kind: 'sequence', presentation: 'melodic', key: { tonicMidi, mode }, events };
  if (withPrelude) {
    const cad = cadenceEvents(tonicMidi, mode, 0);
    const ref = tonicReference(tonicMidi, cad.duration + 0.2);
    ex.prelude = { events: [...cad.events, ...ref.events], duration: cad.duration + 0.2 + ref.duration + 0.3 };
  }
  return ex;
}

/**
 * A single scale degree with cadence prelude. `scale` is the level's scale-reference policy
 * (US-4.4): 'auto' puts the scale before the cadence in the prelude, 'onDemand' builds it as a
 * prelude part without auto-playing it, 'none' omits it. `prelude.parts` carries the cadence
 * and (when offered) the scale separately so each can be re-heard alone.
 */
export function scaleDegreeExercise(tonicMidi, degreeId, mode = 'major', { withCadence = true, scale = 'none', tempo = 120 } = {}) {
  const midi = degreeToMidi(tonicMidi, degreeId);
  const ex = { ...singleNote(midi, { dur: 1.0 }), presentation: 'degree', key: { tonicMidi, mode } };
  if (withCadence) {
    const cad = cadenceEvents(tonicMidi, mode, 0);
    const parts = { cadence: cad };
    if (scale !== 'none') parts.scale = scaleReferenceEvents(tonicMidi, mode, 0, tempo);
    if (scale === 'auto') {
      const gap = 0.3;
      const cadOffset = parts.scale.duration + gap;
      const cadShifted = cadenceEvents(tonicMidi, mode, cadOffset);
      ex.prelude = { events: [...parts.scale.events, ...cadShifted.events], duration: cadOffset + cad.duration + 0.4, parts };
    } else {
      ex.prelude = { events: cad.events, duration: cad.duration + 0.4, parts };
    }
  }
  return ex;
}

/** Voiced chords ({tones}) → progression exercise in a texture. */
export function progressionExercise(voiced, texture, key, { tempo = 120, chordDur = 1.1, withCadence = true } = {}) {
  const events = [];
  let t = 0;
  for (const c of voiced) {
    if (texture === 'arp') {
      events.push(...arpeggiate(c.tones, t, tempo, { hold: true }));
      t += Math.max(chordDur, arpeggioDuration(c.tones.length, tempo));
    } else {
      for (const midi of c.tones) events.push({ midi, at: t, dur: chordDur * 0.95, gain: 0.85 });
      t += chordDur;
    }
  }
  const ex = { kind: 'progression', presentation: texture, key, events, chords: voiced.map((c) => c.numeral) };
  if (withCadence) {
    const cad = cadenceEvents(key.tonicMidi, key.mode, 0);
    ex.prelude = { events: cad.events, duration: cad.duration + 0.5 };
  }
  return ex;
}

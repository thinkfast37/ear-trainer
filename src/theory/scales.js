/** Keys, modes, scale degrees and movable-do solfège (incl. chromatic syllables). */
import { NOTE_NAMES } from './notes.js';

export const KEY_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
export const MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const MINOR = [0, 2, 3, 5, 7, 8, 10]; // natural minor
export const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11];

/** Diatonic degrees by mode; chromatic syllables carry their own semitone offset. */
const DEGREES = {
  // id, number label, semitones from tonic, mode ('major' | 'minor' | 'chromatic')
  Do: [1, 0], Di: ['♯1', 1], Ra: ['♭2', 1], Re: [2, 2], Ri: ['♯2', 3], Me: ['♭3', 3], Mi: [3, 4],
  Fa: [4, 5], Fi: ['♯4', 6], Se: ['♭5', 6], Sol: [5, 7], Si: ['♯5', 8], Le: ['♭6', 8], La: [6, 9],
  Li: ['♯6', 10], Te: ['♭7', 10], Ti: [7, 11],
};
export const DEGREE_IDS = Object.keys(DEGREES);
export const MAJOR_DEGREES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'];
export const MINOR_DEGREES = ['Do', 'Re', 'Me', 'Fa', 'Sol', 'Le', 'Te'];
export const CHROMATIC_DEGREES = ['Di', 'Ri', 'Fi', 'Si', 'Li'];

export function isDegree(id) { return id in DEGREES; }
export function degreeSemitones(id) {
  if (!(id in DEGREES)) throw new Error(`unknown degree ${id}`);
  return DEGREES[id][1];
}
export function degreeNumber(id) { return DEGREES[id][0]; }

/** 'syllable' → "Do"; 'number' → "1"; 'both' → "Do · 1". */
export function degreeLabel(id, mode = 'both') {
  const n = String(degreeNumber(id));
  if (mode === 'syllable') return id;
  if (mode === 'number') return n;
  return `${id} · ${n}`;
}

/** MIDI for a degree above a tonic MIDI. */
export function degreeToMidi(tonicMidi, degreeId, octaveOffset = 0) {
  return tonicMidi + degreeSemitones(degreeId) + 12 * octaveOffset;
}

/** Scale-degree number (1..7) → semitones in a mode. */
export function scaleStep(number, mode = 'major') {
  const scale = mode === 'minor' ? MINOR : MAJOR;
  const idx = ((number - 1) % 7 + 7) % 7;
  const oct = Math.floor((number - 1) / 7);
  return scale[idx] + 12 * oct;
}

/** The pitch class of a key by name index (0..11). */
export function keyPitchClass(keyIndex) { return keyIndex % 12; }
export function keyName(keyIndex, mode = 'major') {
  return `${KEY_NAMES[keyIndex % 12]} ${mode}`;
}
export function tonicMidiForKey(keyIndex, octave = 4) { return (octave + 1) * 12 + (keyIndex % 12); }
export function pitchClassName(pc) { return NOTE_NAMES[pc % 12]; }

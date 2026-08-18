/** MIDI ↔ pitch names, registers. Middle C = 60. */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = { Db: 1, Eb: 3, Gb: 6, Ab: 8, Bb: 10, 'D♭': 1, 'E♭': 3, 'G♭': 6, 'A♭': 8, 'B♭': 10 };

export const SAMPLE_LOW = 36; // C2
export const SAMPLE_HIGH = 84; // C6

export function midiToName(midi) {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function nameToMidi(name) {
  const m = /^([A-G])([#b♭♯]?)(-?\d+)$/.exec(name.trim());
  if (!m) throw new Error(`bad note name ${name}`);
  const [, letter, acc, oct] = m;
  let pc = NOTE_NAMES.indexOf(letter);
  if (acc === '#' || acc === '♯') pc += 1;
  if (acc === 'b' || acc === '♭') pc = FLAT_NAMES[`${letter}b`];
  return (Number(oct) + 1) * 12 + pc;
}

export function pitchClass(midi) { return ((midi % 12) + 12) % 12; }
export function octaveOf(midi) { return Math.floor(midi / 12) - 1; }

/** Fold a MIDI note into [low, high] by octave shifts; if the range is narrower than an octave, clamp. */
export function clampToRegister(midi, low, high) {
  let m = midi;
  while (m < low) m += 12;
  while (m > high) m -= 12;
  if (m < low) m = low;
  return m;
}

export function midiToFrequency(midi) { return 440 * 2 ** ((midi - 69) / 12); }

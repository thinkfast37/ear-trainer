/** Interval vocabulary: 12 simple (m2 … P8) and 8 compound (m9 … M13). */
const DEF = [
  ['m2', 1, 'minor 2nd'], ['M2', 2, 'major 2nd'], ['m3', 3, 'minor 3rd'], ['M3', 4, 'major 3rd'],
  ['P4', 5, 'perfect 4th'], ['TT', 6, 'tritone'], ['P5', 7, 'perfect 5th'], ['m6', 8, 'minor 6th'],
  ['M6', 9, 'major 6th'], ['m7', 10, 'minor 7th'], ['M7', 11, 'major 7th'], ['P8', 12, 'octave'],
  ['m9', 13, 'minor 9th', 'm2'], ['M9', 14, 'major 9th', 'M2'], ['m10', 15, 'minor 10th', 'm3'],
  ['M10', 16, 'major 10th', 'M3'], ['P11', 17, 'perfect 11th', 'P4'], ['P12', 19, 'perfect 12th', 'P5'],
  ['m13', 20, 'minor 13th', 'm6'], ['M13', 21, 'major 13th', 'M6'],
];

export const INTERVALS = DEF.map(([id, semitones, full, simple = null]) => ({ id, semitones, full, simple }));
const BY_ID = new Map(INTERVALS.map((i) => [i.id, i]));


export function intervalById(id) {
  const i = BY_ID.get(id);
  if (!i) throw new Error(`unknown interval ${id}`);
  return i;
}
export function isInterval(id) { return BY_ID.has(id); }
export function isCompound(id) { return Boolean(intervalById(id).simple); }
export function simpleOf(id) { return intervalById(id).simple ?? id; }
export function semitonesOf(id) { return intervalById(id).semitones; }

/** 'short' → "m3"; 'full' → "minor 3rd". */
export function intervalLabel(id, mode = 'short') {
  const i = intervalById(id);
  return mode === 'full' ? i.full : i.id;
}

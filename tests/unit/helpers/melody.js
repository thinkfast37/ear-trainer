import { scaleStep } from '../../../src/theory/scales.js';
/** Largest melodic leap in semitones (test helper). */
export function maxLeap(degrees, mode = 'major') {
  let m = 0;
  for (let i = 1; i < degrees.length; i++) m = Math.max(m, Math.abs(scaleStep(degrees[i], mode) - scaleStep(degrees[i - 1], mode)));
  return m;
}

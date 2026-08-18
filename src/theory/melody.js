/** Constrained melodic phrase generation (US-7.1). Degrees are numbers 1..7 (+7 per octave). */
import { scaleStep } from './scales.js';

const MOTION_MAX = { step: 2, third: 4, leap5: 7, any: 12 };

function pickWeighted(rng, cands) {
  return cands[Math.floor(rng() * cands.length)];
}

/**
 * @param spec {notes:[min,max], motion:'step'|'third'|'leap5'|'any', startOnDo:boolean, rhythm:'even8'|'mixed'|'syncopated'}
 * @returns {{degrees:number[], rhythm:number[], syncopated:boolean}} degrees are scale-degree numbers 1..8 (8 = upper Do), rhythm in beats
 */
export function generatePhrase(spec, rng, mode = 'major') {
  const [min, max] = spec.notes;
  const count = min + Math.floor(rng() * (max - min + 1));
  const maxSemis = MOTION_MAX[spec.motion] ?? 12;
  const range = [1, 8];
  const degrees = [];
  let current = spec.startOnDo ? 1 : 2 + Math.floor(rng() * 6); // 2..7
  degrees.push(current);
  for (let i = 1; i < count; i++) {
    const cands = [];
    for (let d = range[0]; d <= range[1]; d++) {
      if (d === current) continue;
      const semis = Math.abs(scaleStep(d, mode) - scaleStep(current, mode));
      if (semis <= maxSemis) cands.push(d);
    }
    // stepwise: prefer continuing direction sometimes for contour, but stay within constraint
    current = pickWeighted(rng, cands);
    degrees.push(current);
  }
  let rhythm;
  let syncopated = false;
  if (spec.rhythm === 'even8') rhythm = degrees.map(() => 0.5);
  else {
    rhythm = degrees.map(() => (rng() < 0.4 ? 1 : 0.5));
    if (spec.rhythm === 'mixed' && rng() < 0.5) { syncopated = true; rhythm[0] = 0.25; rhythm[1] = 0.75; }
  }
  return { degrees, rhythm, syncopated };
}

/** Largest melodic leap in semitones. */
export function maxLeap(degrees, mode = 'major') {
  let m = 0;
  for (let i = 1; i < degrees.length; i++) m = Math.max(m, Math.abs(scaleStep(degrees[i], mode) - scaleStep(degrees[i - 1], mode)));
  return m;
}

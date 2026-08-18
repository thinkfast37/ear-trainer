/** Textures for chord progressions (US-8.5) and arpeggiation (US-5.2). */
import { chordTones } from './chords.js';
import { clampToRegister } from './notes.js';

/** Identical close voicings: every chord in the same inversion as written, same register. */
export function blockVoicings(chords, low = 55, high = 79) {
  return chords.map((c) => ({ ...c, tones: c.tones.map((t) => clampToRegister(t, low, high)).sort((a, b) => a - b) }));
}

/**
 * Voice-led: for each chord after the first, choose the octave placement (and, for
 * root-position chords, the inversion) minimising total semitone movement from the previous.
 */
export function voiceLedVoicings(chords, low = 52, high = 84) {
  const out = [];
  let prev = null;
  for (const c of chords) {
    let best = null;
    const candidates = [];
    const n = c.tones.length;
    const invs = c.inversion === 0 ? [...Array(n).keys()] : [c.inversion];
    for (const inv of invs) {
      const base = chordTones(c.root, c.quality, inv);
      for (const shift of [-12, 0, 12]) {
        const tones = base.map((t) => t + shift);
        if (tones[0] < low || tones[tones.length - 1] > high) continue;
        candidates.push(tones);
      }
    }
    if (candidates.length === 0) candidates.push(c.tones);
    for (const tones of candidates) {
      const cost = prev ? tones.reduce((s, t, i) => s + Math.abs(t - (prev[Math.min(i, prev.length - 1)] ?? t)), 0) : Math.abs(tones[0] - 60);
      if (!best || cost < best.cost) best = { tones, cost };
    }
    prev = best.tones;
    out.push({ ...c, tones: best.tones });
  }
  return out;
}

/** Expand chord events into an arpeggiated (or strummed) texture at `tempo` BPM eighths. */
export function arpeggiate(tones, at, tempo = 120, { hold = true, strum = false } = {}) {
  const step = strum ? 0.06 : 60 / tempo / 2;
  const total = strum ? 1.0 : step * tones.length + 0.2;
  return tones.map((midi, i) => ({ midi, at: at + i * step, dur: hold ? total - i * step : step * 0.95, gain: 0.9 }));
}

export function arpeggioDuration(count, tempo = 120) { return (60 / tempo / 2) * count + 0.2; }

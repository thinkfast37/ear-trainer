/** Chord qualities, inversions and close voicings. */
const Q = {
  maj: { intervals: [0, 4, 7], symbol: 'maj', name: 'major' },
  min: { intervals: [0, 3, 7], symbol: 'min', name: 'minor' },
  dim: { intervals: [0, 3, 6], symbol: 'dim', name: 'diminished' },
  aug: { intervals: [0, 4, 8], symbol: 'aug', name: 'augmented' },
  dom7: { intervals: [0, 4, 7, 10], symbol: '7', name: 'dominant 7th' },
  maj7: { intervals: [0, 4, 7, 11], symbol: 'maj7', name: 'major 7th' },
  m7: { intervals: [0, 3, 7, 10], symbol: 'm7', name: 'minor 7th' },
  m7b5: { intervals: [0, 3, 6, 10], symbol: 'm7♭5', name: 'half-diminished' },
  dim7: { intervals: [0, 3, 6, 9], symbol: 'dim7', name: 'diminished 7th' },
  sus2: { intervals: [0, 2, 7], symbol: 'sus2', name: 'suspended 2nd' },
  sus4: { intervals: [0, 5, 7], symbol: 'sus4', name: 'suspended 4th' },
};

export function quality(id) {
  const q = Q[id];
  if (!q) throw new Error(`unknown chord quality ${id}`);
  return q;
}
export function isQuality(id) { return Boolean(Q[id]); }
export function chordSize(id) { return quality(id).intervals.length; }

export const INVERSION_NAMES = ['root position', '1st inversion', '2nd inversion', '3rd inversion'];
export const INVERSION_IDS = ['root', 'inv1', 'inv2', 'inv3'];
export function inversionIndex(id) { return typeof id === 'number' ? id : INVERSION_IDS.indexOf(id); }

/**
 * Close-voiced chord tones for `root` (MIDI) in `inversion` (0..3): the inversion's bass
 * tone is lowest and the remaining tones stacked above it within one octave.
 */
export function chordTones(root, qualityId, inversion = 0) {
  const ivs = quality(qualityId).intervals;
  const n = ivs.length;
  const inv = ((inversion % n) + n) % n;
  const tones = [];
  for (let k = 0; k < n; k++) {
    const idx = (inv + k) % n;
    let t = root + ivs[idx];
    // tones that wrapped past the bass go up an octave
    if (idx < inv) t += 12;
    tones.push(t);
  }
  return tones.sort((a, b) => a - b);
}

/** 'symbol' → "m7♭5"; 'name' → "half-diminished"; 'symbolAndName' → "m7♭5 · half-diminished". */
export function qualityLabel(id, mode = 'symbolAndName') {
  const q = quality(id);
  if (mode === 'symbol') return q.symbol;
  if (mode === 'name') return q.name;
  return `${q.symbol} · ${q.name}`;
}

import { describe, it, expect } from 'vitest';
import { blockVoicings, voiceLedVoicings, arpeggiate } from '../../../src/theory/voicing.js';
import { numeralToChord } from '../../../src/theory/progressions.js';

describe('voicing', () => {
  const chords = ['I', 'V', 'vi', 'IV'].map((n) => numeralToChord(n, 60));
  it('block voicings keep every chord inside the register', () => {
    for (const c of blockVoicings(chords, 55, 79)) for (const t of c.tones) { expect(t).toBeGreaterThanOrEqual(55); expect(t).toBeLessThanOrEqual(79); }
  });
  it('voice-led voicings move less than block voicings', () => {
    const move = (vs) => vs.slice(1).reduce((s, c, i) => s + c.tones.reduce((ss, t, k) => ss + Math.abs(t - vs[i].tones[Math.min(k, vs[i].tones.length - 1)]), 0), 0);
    expect(move(voiceLedVoicings(chords))).toBeLessThanOrEqual(move(blockVoicings(chords)));
  });
  it('arpeggiate spaces tones by the tempo', () => {
    const ev = arpeggiate([60, 64, 67], 1, 120);
    expect(ev.map((e) => e.at)).toEqual([1, 1.25, 1.5]);
  });
});

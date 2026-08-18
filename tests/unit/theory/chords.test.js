import { describe, it, expect } from 'vitest';
import { chordTones, qualityLabel, chordSize, isQuality } from '../../../src/theory/chords.js';

describe('chords', () => {
  it('root position close voicing', () => { expect(chordTones(60, 'maj', 0)).toEqual([60, 64, 67]); expect(chordTones(60, 'dom7', 0)).toEqual([60, 64, 67, 70]); });
  it('inversions put the inversion tone in the bass', () => {
    expect(chordTones(60, 'maj', 1)).toEqual([64, 67, 72]);
    expect(chordTones(60, 'maj', 2)).toEqual([67, 72, 76]);
    expect(chordTones(60, 'dom7', 3)).toEqual([70, 72, 76, 79]);
  });
  it('labels', () => { expect(qualityLabel('m7b5')).toBe('m7♭5 · half-diminished'); expect(qualityLabel('maj', 'symbol')).toBe('maj'); expect(qualityLabel('sus4', 'name')).toBe('suspended 4th'); });
  it('eleven qualities', () => { for (const q of ['maj', 'min', 'dim', 'aug', 'dom7', 'maj7', 'm7', 'm7b5', 'dim7', 'sus2', 'sus4']) expect(isQuality(q)).toBe(true); expect(isQuality('x')).toBe(false); expect(chordSize('sus2')).toBe(3); });
});

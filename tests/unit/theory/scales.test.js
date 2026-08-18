import { describe, it, expect } from 'vitest';
import { degreeToMidi, degreeLabel, scaleStep, MAJOR_DEGREES, MINOR_DEGREES, CHROMATIC_DEGREES, degreeSemitones } from '../../../src/theory/scales.js';

describe('scales', () => {
  it('degree to midi in major and minor syllables', () => { expect(degreeToMidi(60, 'Sol')).toBe(67); expect(degreeToMidi(60, 'Me')).toBe(63); expect(degreeToMidi(60, 'Te')).toBe(70); expect(degreeSemitones('Fi')).toBe(6); });
  it('labels', () => { expect(degreeLabel('Do')).toBe('Do · 1'); expect(degreeLabel('Ti', 'number')).toBe('7'); expect(degreeLabel('La', 'syllable')).toBe('La'); expect(degreeLabel('Fi', 'both')).toBe('Fi · ♯4'); });
  it('scale steps', () => { expect(scaleStep(8)).toBe(12); expect(scaleStep(3, 'minor')).toBe(3); expect(MAJOR_DEGREES.length).toBe(7); expect(MINOR_DEGREES).toContain('Le'); expect(CHROMATIC_DEGREES.length).toBe(5); });
});

import { describe, it, expect } from 'vitest';
import { parseNumeral, numeralToChord, rotations, bassDegree, numeralLabel, isNumeral } from '../../../src/theory/progressions.js';

describe('roman numerals', () => {
  it('parses case, accidentals, sevenths and figures', () => {
    expect(parseNumeral('I')).toMatchObject({ degree: 1, quality: 'maj', inversion: 0 });
    expect(parseNumeral('vi')).toMatchObject({ degree: 6, quality: 'min' });
    expect(parseNumeral('bVII7')).toMatchObject({ degree: 7, accidental: -1, quality: 'dom7' });
    expect(parseNumeral('ii7')).toMatchObject({ quality: 'm7' });
    expect(parseNumeral('Imaj7')).toMatchObject({ quality: 'maj7' });
    expect(parseNumeral('V6')).toMatchObject({ inversion: 1 });
    expect(parseNumeral('I64')).toMatchObject({ inversion: 2 });
    expect(isNumeral('IX')).toBe(false);
  });
  it('resolves to chords in a key', () => {
    expect(numeralToChord('V', 60).tones).toEqual([67, 71, 74]);
    expect(numeralToChord('bVII', 60).root).toBe(70);
    expect(numeralToChord('i', 60, 'minor').tones).toEqual([60, 63, 67]);
    expect(numeralToChord('V', 60, 'minor').tones).toEqual([67, 71, 74]);
    expect(numeralToChord('VI', 60, 'minor').root).toBe(68);
  });
  it('rotations and bass degrees', () => {
    expect(rotations(['I', 'V', 'vi', 'IV'])).toEqual([['I', 'V', 'vi', 'IV'], ['V', 'vi', 'IV', 'I'], ['vi', 'IV', 'I', 'V'], ['IV', 'I', 'V', 'vi']]);
    expect(bassDegree('I')).toEqual({ number: 1, accidental: 0 });
    expect(bassDegree('V6')).toEqual({ number: 7, accidental: 0 });
    expect(bassDegree('I64')).toEqual({ number: 5, accidental: 0 });
    expect(bassDegree('bVII')).toEqual({ number: 7, accidental: -1 });
    expect(numeralLabel('bVII')).toBe('♭VII'); expect(numeralLabel('V6')).toBe('V⁶');
  });
});

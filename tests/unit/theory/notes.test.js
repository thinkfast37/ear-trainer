import { describe, it, expect } from 'vitest';
import { midiToName, nameToMidi, clampToRegister, midiToFrequency, pitchClass } from '../../../src/theory/notes.js';

describe('notes', () => {
  it('round-trips names', () => { expect(midiToName(60)).toBe('C4'); expect(nameToMidi('C4')).toBe(60); expect(nameToMidi('E♭3')).toBe(51); expect(nameToMidi('F#2')).toBe(42); });
  it('clamps by octave into a register', () => { expect(clampToRegister(30, 48, 72)).toBe(54); expect(clampToRegister(90, 48, 72)).toBe(66); });
  it('A4 is 440 Hz', () => { expect(midiToFrequency(69)).toBeCloseTo(440); expect(pitchClass(61)).toBe(1); });
});

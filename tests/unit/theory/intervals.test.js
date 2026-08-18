import { describe, it, expect } from 'vitest';
import { INTERVALS, SIMPLE_IDS, COMPOUND_IDS, semitonesOf, isCompound, simpleOf, intervalLabel } from '../../../src/theory/intervals.js';

describe('intervals', () => {
  it('has 12 simple and 8 compound', () => { expect(SIMPLE_IDS.length).toBe(12); expect(COMPOUND_IDS.length).toBe(8); expect(INTERVALS.length).toBe(20); });
  it('semitones and compound decomposition', () => { expect(semitonesOf('P5')).toBe(7); expect(semitonesOf('M9')).toBe(14); expect(isCompound('m10')).toBe(true); expect(simpleOf('m10')).toBe('m3'); expect(simpleOf('P4')).toBe('P4'); });
  it('labels', () => { expect(intervalLabel('m3')).toBe('m3'); expect(intervalLabel('m3', 'full')).toBe('minor 3rd'); });
});

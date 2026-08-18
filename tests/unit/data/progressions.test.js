import { describe, it, expect } from 'vitest';
import cat from '../../../src/data/progressions.json';
import { validateProgressions } from '../../../tools/validate-data.mjs';

describe('progressions.json', () => {
  it('has the 52 Appendix A entries', () => { expect(cat.length).toBe(52); expect(validateProgressions(cat)).toEqual([]); });
  it('marks Axis and 50s as rotation families', () => {
    expect(cat.find((e) => e.id === 8).rotations).toBe(true);
    expect(cat.find((e) => e.id === 10).rotations).toBe(true);
  });
  it('assigns levels 1–7 with at least 4 entries each', () => {
    for (let l = 1; l <= 7; l++) expect(cat.filter((e) => e.level === l).length).toBeGreaterThanOrEqual(4);
  });
});

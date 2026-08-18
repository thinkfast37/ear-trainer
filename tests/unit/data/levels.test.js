import { describe, it, expect } from 'vitest';
import levels from '../../../src/data/levels.json';
import { validateLevels } from '../../../tools/validate-data.mjs';

describe('levels.json', () => {
  it('has six tracks in build order', () => {
    expect(levels.tracks.map((t) => t.id)).toEqual(['intervals', 'scaleDegrees', 'chordQualities', 'inversions', 'melodic', 'progressions']);
  });
  it('validates against the contract', () => { expect(validateLevels(levels)).toEqual([]); });
  it('level counts match the spec (12, 5, 10, 4, 6, 7)', () => {
    expect(levels.tracks.map((t) => t.levels.length)).toEqual([12, 5, 10, 4, 6, 7]);
  });
});

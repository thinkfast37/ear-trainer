import { describe, it, expect } from 'vitest';
import { validateLevels, validateProgressions, validateAnchors, validateCredits, validateAll } from '../../../tools/validate-data.mjs';

describe('validate-data', () => {
  it('passes on the shipped data', () => { expect(validateAll()).toEqual([]); });
  it('rejects a prerequisite naming a missing level', () => {
    const bad = { tracks: [{ id: 'a', prerequisites: [{ track: 'b', level: 9 }], subStages: [], levels: [] }, { id: 'b', prerequisites: [], subStages: [], levels: [{ no: 1, pool: [], confusables: [], replayLimit: null }] }] };
    expect(validateLevels(bad).some((e) => /level 9/.test(e))).toBe(true);
  });
  it('rejects a bad numeral and a rotation family with two chords', () => {
    const errs = validateProgressions([{ id: 1, numerals: ['I', 'IX'], level: 1, name: 'x', rotations: true }]);
    expect(errs.some((e) => /bad numeral/.test(e))).toBe(true);
    expect(errs.some((e) => /rotations/.test(e))).toBe(true);
  });
  it('rejects anchors without a simple equivalent for a compound', () => {
    expect(validateAnchors({}).length).toBeGreaterThan(0);
  });
  it('rejects credits missing a licence', () => {
    expect(validateCredits([{ asset: 'x', author: 'y', source: 'z' }])).toEqual(['credits: x missing licence']);
  });
});

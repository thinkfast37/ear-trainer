import { describe, it, expect } from 'vitest';
import { validateLevels, validateProgressions, validateAnchors, validateCredits, validateAll } from '../../../tools/validate-data.mjs';

describe('validate-data', () => {
  it('passes on the shipped data', () => { expect(validateAll()).toEqual([]); });
  it('rejects a prerequisite naming a missing level', () => {
    const bad = { tracks: [{ id: 'a', prerequisites: [{ track: 'b', level: 9 }], levels: [] }, { id: 'b', prerequisites: [], levels: [{ no: 1, pool: [], confusables: [], replayLimit: null }] }] };
    expect(validateLevels(bad).some((e) => /level 9/.test(e))).toBe(true);
  });
  it('rejects a track with subStages, a level without presentations, an unknown or duplicate presentation, and a progression level without a catalogTier (D-013)', () => {
    const lvl = (extra) => ({ no: 1, pool: ['P5'], confusables: [], replayLimit: null, ...extra });
    const withTrack = (t) => validateLevels({ tracks: [t] });
    expect(withTrack({ id: 'intervals', prerequisites: [], subStages: ['asc'], levels: [lvl({ presentations: ['asc'] })] }).some((e) => /subStages/.test(e))).toBe(true);
    expect(withTrack({ id: 'intervals', prerequisites: [], levels: [lvl({})] }).some((e) => /presentations must be a non-empty array/.test(e))).toBe(true);
    expect(withTrack({ id: 'intervals', prerequisites: [], levels: [lvl({ presentations: [] })] }).some((e) => /presentations must be a non-empty array/.test(e))).toBe(true);
    expect(withTrack({ id: 'intervals', prerequisites: [], levels: [lvl({ presentations: ['block'] })] }).some((e) => /unknown presentation block/.test(e))).toBe(true);
    expect(withTrack({ id: 'intervals', prerequisites: [], levels: [lvl({ presentations: ['asc', 'asc'] })] }).some((e) => /duplicate presentation/.test(e))).toBe(true);
    expect(withTrack({ id: 'intervals', prerequisites: [], levels: [lvl({ presentations: ['asc', 'desc'] })] })).toEqual([]);
    expect(withTrack({ id: 'scaleDegrees', prerequisites: [], levels: [{ no: 1, pool: ['Do'], mode: 'major', scaleReference: 'auto', confusables: [], replayLimit: null, presentations: ['asc'] }] }).some((e) => /has presentations but/.test(e))).toBe(true);
    const prog = { id: 'progressions', prerequisites: [], levels: [{ no: 1, presentations: ['block'], vocabulary: ['I'], confusables: [], replayLimit: 3 }] };
    expect(withTrack(prog).some((e) => /catalogTier must be an integer 1–7/.test(e))).toBe(true);
    expect(withTrack({ ...prog, levels: [{ ...prog.levels[0], catalogTier: 8 }] }).some((e) => /catalogTier/.test(e))).toBe(true);
    expect(withTrack({ ...prog, levels: [{ ...prog.levels[0], catalogTier: 3 }] })).toEqual([]);
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

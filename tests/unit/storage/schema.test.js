import { describe, it, expect } from 'vitest';
import { emptyProgress, validateProgress, normaliseProgress, SCHEMA_VERSION } from '../../../src/storage/schema.js';

describe('schema', () => {
  it('empty progress validates', () => { expect(validateProgress(emptyProgress())).toEqual([]); expect(emptyProgress().schemaVersion).toBe(SCHEMA_VERSION); });
  it('rejects newer schema and bad boxes', () => {
    expect(validateProgress({ ...emptyProgress(), schemaVersion: 99 })[0]).toMatch(/newer/);
    expect(validateProgress({ ...emptyProgress(), items: { a: { box: 9 } } })).toContain('item a bad box');
  });
  it('normalise fills missing settings', () => { const n = normaliseProgress({ schemaVersion: 1, items: {}, levels: {}, days: {}, xp: 0, streak: {}, sessions: [], settings: { replayLimit: 5 } }); expect(n.settings.replayLimit).toBe(5); expect(n.settings.labels.degrees).toBe('both'); });

  it('normalises a level written before D-014 to zero active seconds', () => {
    const doc = { ...emptyProgress(), levels: {
      'intervals:1': { mastered: true, masteredAt: 5, history: [] },
      'intervals:2': { mastered: false, masteredAt: null, activeSeconds: 412, history: [] },
      'intervals:3': { mastered: false, masteredAt: null, activeSeconds: -1, history: [] },
    } };
    const out = normaliseProgress(doc);
    expect(out.levels['intervals:1'].activeSeconds).toBe(0);
    expect(out.levels['intervals:1'].mastered).toBe(true); // and the rest of the entry survives
    expect(out.levels['intervals:2'].activeSeconds).toBe(412);
    expect(out.levels['intervals:3'].activeSeconds).toBe(0); // a nonsense value is not trusted
  });
});
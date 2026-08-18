import { describe, it, expect } from 'vitest';
import { emptyProgress, validateProgress, normaliseProgress, SCHEMA_VERSION } from '../../../src/storage/schema.js';

describe('schema', () => {
  it('empty progress validates', () => { expect(validateProgress(emptyProgress())).toEqual([]); expect(emptyProgress().schemaVersion).toBe(SCHEMA_VERSION); });
  it('rejects newer schema and bad boxes', () => {
    expect(validateProgress({ ...emptyProgress(), schemaVersion: 99 })[0]).toMatch(/newer/);
    expect(validateProgress({ ...emptyProgress(), items: { a: { box: 9 } } })).toContain('item a bad box');
  });
  it('normalise fills missing settings', () => { const n = normaliseProgress({ schemaVersion: 1, items: {}, levels: {}, days: {}, xp: 0, streak: {}, sessions: [], settings: { replayLimit: 5 } }); expect(n.settings.replayLimit).toBe(5); expect(n.settings.labels.degrees).toBe('both'); });
});

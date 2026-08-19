import { describe, it, expect } from 'vitest';
import { createStorage, memoryAdapter, localStorageAdapter, preferencesAdapter, serialiseProgress } from '../../../src/storage/storage.js';
import { emptyProgress, STORAGE_KEY, SCHEMA_VERSION } from '../../../src/storage/schema.js';

function fakeLocalStorage() { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), map: m }; }
function fakePreferences() { const m = new Map(); return { async get({ key }) { return { value: m.get(key) ?? null }; }, async set({ key, value }) { m.set(key, value); }, async remove({ key }) { m.delete(key); }, map: m }; }

describe('storage', () => {
  it('round-trips through the memory adapter and returns empty progress when nothing stored', async () => {
    const s = createStorage(memoryAdapter());
    expect((await s.load()).xp).toBe(0);
    const doc = emptyProgress(); doc.xp = 42; await s.save(doc);
    expect((await s.load()).xp).toBe(42);
  });
  it('localStorage and Preferences adapters store the identical serialised document under the same key', async () => {
    const ls = fakeLocalStorage(); const pr = fakePreferences();
    const doc = emptyProgress(); doc.xp = 7; doc.items['interval:P5:asc'] = { box: 3, attempts: 4, correct: 3, lastSeen: 1, confusions: {} };
    await createStorage(localStorageAdapter(ls)).save(doc);
    await createStorage(preferencesAdapter(pr)).save(doc);
    expect(ls.map.get(STORAGE_KEY)).toBe(pr.map.get(STORAGE_KEY));
    expect(ls.map.get(STORAGE_KEY)).toBe(serialiseProgress(doc));
  });
  it('AC-10.3.4/1 — Stored progress from before the restructure is discarded on load and settings are retained', async () => {
    // A schema-1 document with learning state, sub-stage state and non-default settings.
    const v1 = { ...emptyProgress(), schemaVersion: 1, xp: 500 };
    v1.items['interval:P5:asc'] = { box: 5, attempts: 40, correct: 39, lastSeen: 1, confusions: {} };
    v1.levels['intervals:1'] = { mastered: true, masteredAt: 1, subStage: 'harm', subStages: { asc: { mastered: true, history: [] } }, history: [{ item: 'interval:P5:asc', correct: true, at: 1 }] };
    v1.streak = { current: 9, best: 9, lastCompletedDay: '2026-08-17' };
    v1.days['2026-08-17'] = { questions: 30, seconds: 600, complete: true };
    v1.sessions.push({ id: 's1', trackId: 'intervals', levelNo: 1, mixed: false, startedAt: 1, endedAt: 2, questions: 30, correct: 29, replays: 0 });
    v1.guidance = { scaleDegrees: true };
    v1.settings.replayLimit = 7; v1.settings.arpeggioTempo = 90; v1.settings.labels.intervals = 'full';
    const ls = fakeLocalStorage(); ls.setItem(STORAGE_KEY, JSON.stringify(v1));
    const storage = createStorage(localStorageAdapter(ls));
    const doc = await storage.load();
    // learning state discarded
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    expect(doc.items).toEqual({}); expect(doc.levels).toEqual({}); expect(doc.xp).toBe(0);
    expect(doc.streak).toEqual({ current: 0, best: 0, lastCompletedDay: null }); expect(doc.days).toEqual({}); expect(doc.sessions).toEqual([]); expect(doc.guidance).toEqual({});
    // settings retained
    expect(doc.settings.replayLimit).toBe(7); expect(doc.settings.arpeggioTempo).toBe(90); expect(doc.settings.labels.intervals).toBe('full');
    // and the fresh document was written back, so the reset happens once
    const stored = JSON.parse(ls.getItem(STORAGE_KEY));
    expect(stored.schemaVersion).toBe(SCHEMA_VERSION); expect(stored.items).toEqual({}); expect(stored.settings.replayLimit).toBe(7);
    // a current-schema document is loaded untouched
    const cur = emptyProgress(); cur.xp = 3; cur.items['interval:P5:asc'] = { box: 2, attempts: 1, correct: 1, lastSeen: 1, confusions: {} };
    ls.setItem(STORAGE_KEY, JSON.stringify(cur));
    const doc2 = await storage.load(); expect(doc2.xp).toBe(3); expect(doc2.items['interval:P5:asc'].box).toBe(2);
  });
  it('a corrupt document loads as empty progress rather than throwing', async () => {
    const ls = fakeLocalStorage(); ls.setItem(STORAGE_KEY, '{nope');
    expect((await createStorage(localStorageAdapter(ls)).load()).xp).toBe(0);
  });
});

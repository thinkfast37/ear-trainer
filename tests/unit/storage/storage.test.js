import { describe, it, expect } from 'vitest';
import { createStorage, memoryAdapter, localStorageAdapter, preferencesAdapter, serialiseProgress } from '../../../src/storage/storage.js';
import { emptyProgress, STORAGE_KEY } from '../../../src/storage/schema.js';

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
  it('a corrupt document loads as empty progress rather than throwing', async () => {
    const ls = fakeLocalStorage(); ls.setItem(STORAGE_KEY, '{nope');
    expect((await createStorage(localStorageAdapter(ls)).load()).xp).toBe(0);
  });
});

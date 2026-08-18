import { describe, it, expect } from 'vitest';
import { createStorage, localStorageAdapter, preferencesAdapter } from '../../../src/storage/storage.js';
import { STORAGE_KEY, SCHEMA_VERSION } from '../../../src/storage/schema.js';
import { harness, answerMany } from '../helpers/harness.js';

function fakeLocalStorage() { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), map: m }; }
function fakePreferences() { const m = new Map(); return { async get({ key }) { return { value: m.get(key) ?? null }; }, async set({ key, value }) { m.set(key, value); }, async remove({ key }) { m.delete(key); }, map: m }; }

describe('US-10.2 — persistence parity', () => {
  it('AC-10.2.4 — Native persistence uses the same schema as web storage', async () => {
    const h = harness({ trackId: 'chordQualities', levelNo: 1, seed: 4 });
    await answerMany(h.session, 8);
    const doc = h.store.getState();
    const ls = fakeLocalStorage(); const prefs = fakePreferences();
    await createStorage(localStorageAdapter(ls)).save(doc);
    await createStorage(preferencesAdapter(prefs)).save(doc);
    const webText = ls.map.get(STORAGE_KEY); const nativeText = prefs.map.get(STORAGE_KEY);
    expect(nativeText).toBe(webText);
    const web = JSON.parse(webText); const native = JSON.parse(nativeText);
    expect(native.schemaVersion).toBe(SCHEMA_VERSION); expect(Object.keys(native).sort()).toEqual(Object.keys(web).sort());
    // and a document written natively loads on the web unchanged
    const back = await createStorage(localStorageAdapter({ getItem: () => nativeText })).load();
    expect(back).toEqual(await createStorage(preferencesAdapter(prefs)).load());
  });
});

/**
 * One JSON document, one key, two adapters (D-007): localStorage on the web, Capacitor
 * Preferences on device. Both store the identical serialised document (AC-10.2.4).
 */
import { STORAGE_KEY, emptyProgress, normaliseProgress, validateProgress, needsReset, resetProgress } from './schema.js';

export function localStorageAdapter(ls = globalThis.localStorage) {
  return {
    name: 'localStorage',
    async get() { return ls.getItem(STORAGE_KEY); },
    async set(text) { ls.setItem(STORAGE_KEY, text); },
    async remove() { ls.removeItem(STORAGE_KEY); },
  };
}

/** `prefs` is the Capacitor Preferences plugin (or a stand-in with get/set/remove). */
export function preferencesAdapter(prefs) {
  return {
    name: 'preferences',
    async get() { const r = await prefs.get({ key: STORAGE_KEY }); return r?.value ?? null; },
    async set(text) { await prefs.set({ key: STORAGE_KEY, value: text }); },
    async remove() { await prefs.remove({ key: STORAGE_KEY }); },
  };
}

export function memoryAdapter() {
  let v = null;
  return { name: 'memory', async get() { return v; }, async set(t) { v = t; }, async remove() { v = null; } };
}

export function serialiseProgress(doc) { return JSON.stringify(doc); }

export function parseProgress(text) {
  if (!text) return null;
  let doc;
  try { doc = JSON.parse(text); } catch { return null; }
  if (validateProgress(doc).length) return null;
  return normaliseProgress(doc);
}

/**
 * A stored document from before the level restructure (schemaVersion < 2) is discarded and
 * replaced by a fresh document keeping only its settings (AC-10.3.4/1, D-007). Returns the
 * fresh document, or null when the text is not such a document.
 */
export function resetIfStale(text) {
  if (!text) return null;
  let doc;
  try { doc = JSON.parse(text); } catch { return null; }
  return needsReset(doc) ? resetProgress(doc) : null;
}

export function createStorage(adapter) {
  return {
    adapter,
    async load() {
      const text = await adapter.get();
      const reset = resetIfStale(text);
      if (reset) { await adapter.set(serialiseProgress(reset)); return reset; }
      return parseProgress(text) ?? emptyProgress();
    },
    async save(doc) { await adapter.set(serialiseProgress(doc)); },
    async clear() { await adapter.remove(); },
  };
}

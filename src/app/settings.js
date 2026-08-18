/** Settings access and mutation (US-10.4). */
import { DEFAULT_SETTINGS } from '../storage/schema.js';

export function getSettings(state) { return { ...DEFAULT_SETTINGS, ...state.settings }; }

/** Path like 'labels.degrees' or 'replayLimit'. */
export function setSetting(store, path, value) {
  return store.update((d) => {
    const parts = path.split('.');
    let o = d.settings;
    for (const p of parts.slice(0, -1)) o = o[p] ?? (o[p] = {});
    o[parts[parts.length - 1]] = value;
  });
}

/**
 * The single state container. `update(fn)` mutates a draft (structuredClone) and commits;
 * subscribers re-render; persistence is debounced and flushed on visibility change.
 */
export function createStore(initial, { storage = null, debounceMs = 50, now = () => Date.now() } = {}) {
  let state = initial;
  const subs = new Set();
  let timer = null;
  let dirty = false;

  async function flush() {
    if (!storage || !dirty) return;
    dirty = false;
    await storage.save(state);
  }
  function schedulePersist() {
    dirty = true;
    if (!storage) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; flush(); }, debounceMs);
  }
  function commit(next) {
    state = next;
    schedulePersist();
    for (const s of subs) s(state);
  }
  return {
    getState: () => state,
    update(fn) { const draft = structuredClone(state); const r = fn(draft); commit(r === undefined ? draft : r); return state; },
    replace(doc) { commit(structuredClone(doc)); },
    patch(partial) { commit({ ...structuredClone(state), ...structuredClone(partial) }); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    flush,
    now,
  };
}

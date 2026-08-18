import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../../../src/app/store.js';
import { emptyProgress } from '../../../src/storage/schema.js';

describe('store', () => {
  it('update commits a draft and notifies subscribers', () => {
    const s = createStore(emptyProgress());
    const seen = []; s.subscribe((st) => seen.push(st.xp));
    s.update((d) => { d.xp = 5; });
    expect(s.getState().xp).toBe(5); expect(seen).toEqual([5]);
  });
  it('persists (debounced) through storage', async () => {
    vi.useFakeTimers();
    const saved = []; const storage = { save: async (d) => saved.push(d.xp) };
    const s = createStore(emptyProgress(), { storage, debounceMs: 10 });
    s.update((d) => { d.xp = 1; }); s.update((d) => { d.xp = 2; });
    await vi.advanceTimersByTimeAsync(20);
    expect(saved).toEqual([2]);
    vi.useRealTimers();
  });
});

import { describe, it, expect } from 'vitest';
import { createStorage, memoryAdapter } from '../../../src/storage/storage.js';
import { createStore } from '../../../src/app/store.js';
import { harness, answerMany } from '../helpers/harness.js';

async function practiseAndReopen() {
  const h = harness({ trackId: 'intervals', levelNo: 2, seed: 5 });
  await answerMany(h.session, 12, (q, i) => (i % 3 === 0 ? q.options.find((o) => o !== q.answer) : q.answer));
  const before = structuredClone(h.store.getState().items);
  const storage = createStorage(memoryAdapter());
  await storage.save(h.store.getState());
  // "close the app": a fresh store loaded from storage
  const reopened = createStore(await storage.load());
  return { before, after: reopened.getState().items };
}

describe('US-2.1 — persistence', () => {
  it("AC-2.1.4/1 — Every item's box is unchanged after reopening", async () => {
    const { before, after } = await practiseAndReopen();
    expect(Object.keys(before).length).toBeGreaterThan(0);
    for (const id of Object.keys(before)) expect(after[id].box).toBe(before[id].box);
  });
  it("AC-2.1.4/2 — Every item's attempts and correct count are unchanged after reopening", async () => {
    const { before, after } = await practiseAndReopen();
    for (const id of Object.keys(before)) { expect(after[id].attempts).toBe(before[id].attempts); expect(after[id].correct).toBe(before[id].correct); }
  });
  it("AC-2.1.4/3 — Every item's last-seen timestamp is unchanged after reopening", async () => {
    const { before, after } = await practiseAndReopen();
    for (const id of Object.keys(before)) { expect(after[id].lastSeen).toBe(before[id].lastSeen); expect(after[id].lastSeen).toBeGreaterThan(0); }
  });
});

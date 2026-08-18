import { describe, it, expect } from 'vitest';
import { exportProgress, parseImport, mergeProgress, exportFileName } from '../../../src/storage/exportImport.js';
import { emptyProgress, SCHEMA_VERSION } from '../../../src/storage/schema.js';
import { createStore } from '../../../src/app/store.js';
import { createStorage, memoryAdapter } from '../../../src/storage/storage.js';
import { harness, answerMany } from '../helpers/harness.js';

describe('US-10.3 Progress persistence and export', () => {
  it('AC-10.3.1 — Progress changes are persisted under a versioned schema', async () => {
    const storage = createStorage(memoryAdapter());
    const store = createStore(emptyProgress(), { storage, debounceMs: 1 });
    store.update((d) => { d.xp = 12; d.items['interval:P5:asc'] = { box: 2, attempts: 1, correct: 1, lastSeen: 5, confusions: {} }; });
    await new Promise((r) => setTimeout(r, 10));
    const raw = JSON.parse(await storage.adapter.get());
    expect(raw.schemaVersion).toBe(SCHEMA_VERSION); expect(raw.xp).toBe(12); expect(raw.items['interval:P5:asc'].box).toBe(2);
    // every kind of change: settings, streak, sessions
    store.update((d) => { d.settings.replayLimit = 7; d.streak.current = 3; d.sessions.push({ id: 'x', startedAt: 1, endedAt: 2, questions: 1, correct: 1, replays: 0 }); });
    await new Promise((r) => setTimeout(r, 10));
    const raw2 = JSON.parse(await storage.adapter.get());
    expect(raw2.settings.replayLimit).toBe(7); expect(raw2.streak.current).toBe(3); expect(raw2.sessions.length).toBe(1); expect(raw2.schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('AC-10.3.3/1 — Import validates the schema version', () => {
    const good = emptyProgress();
    expect(parseImport(JSON.stringify(good)).ok).toBe(true);
    const newer = { ...good, schemaVersion: SCHEMA_VERSION + 1 };
    const r = parseImport(JSON.stringify(newer));
    expect(r.ok).toBe(false); expect(r.error).toMatch(/newer version/); expect(r.error).toContain(String(SCHEMA_VERSION + 1));
    const missing = { ...good }; delete missing.schemaVersion;
    expect(parseImport(JSON.stringify(missing)).ok).toBe(false);
  });
  it('AC-10.3.3/2 — Conflicting items merge by most-recent-per-item on import', () => {
    const local = emptyProgress(); const other = emptyProgress();
    local.items.a = { box: 2, attempts: 3, correct: 1, lastSeen: 100, confusions: {} };
    other.items.a = { box: 4, attempts: 9, correct: 8, lastSeen: 200, confusions: { x: 1 } };   // newer on the other device
    local.items.b = { box: 5, attempts: 9, correct: 9, lastSeen: 300, confusions: {} };
    other.items.b = { box: 1, attempts: 1, correct: 0, lastSeen: 50, confusions: {} };          // older on the other device
    other.items.c = { box: 3, attempts: 2, correct: 2, lastSeen: 10, confusions: {} };          // only remote
    local.xp = 10; other.xp = 40; local.streak.best = 5; other.streak.best = 2;
    local.days['2026-08-01'] = { questions: 10, seconds: 100, complete: false }; other.days['2026-08-01'] = { questions: 30, seconds: 50, complete: true }; other.days['2026-08-02'] = { questions: 3, seconds: 9, complete: false };
    local.levels['intervals:1'] = { mastered: false, masteredAt: null, subStage: null, subStages: {}, history: [{ item: 'a', correct: true, at: 1 }] };
    other.levels['intervals:1'] = { mastered: true, masteredAt: 9, subStage: null, subStages: {}, history: [{ item: 'a', correct: false, at: 2 }] };
    local.settings.replayLimit = 2; other.settings.replayLimit = 9;
    const m = mergeProgress(local, other);
    expect(m.items.a.box).toBe(4); expect(m.items.a.lastSeen).toBe(200);
    expect(m.items.b.box).toBe(5); expect(m.items.b.lastSeen).toBe(300);
    expect(m.items.c.box).toBe(3);
    expect(m.xp).toBe(40); expect(m.streak.best).toBe(5);
    expect(m.days['2026-08-01']).toEqual({ questions: 30, seconds: 100, complete: true }); expect(m.days['2026-08-02'].questions).toBe(3);
    expect(m.levels['intervals:1'].mastered).toBe(true); expect(m.levels['intervals:1'].history.length).toBe(2);
    expect(m.settings.replayLimit).toBe(2); // local settings win
    // importing a file identical to local changes nothing
    expect(mergeProgress(m, m)).toEqual(m);
  });
  it('AC-10.3.3/3 — An invalid import file is rejected with a clear error', () => {
    expect(parseImport('not json at all')).toEqual({ ok: false, error: 'That file is not valid JSON.' });
    const r = parseImport(JSON.stringify({ hello: 'world' }));
    expect(r.ok).toBe(false); expect(r.error).toMatch(/not an Ear Trainer export/);
    const bad = emptyProgress(); bad.items.z = { box: 42 };
    expect(parseImport(JSON.stringify(bad)).ok).toBe(false);
  });
  it('export is the full document and round-trips', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, seed: 1 });
    await answerMany(h.session, 3);
    const text = exportProgress(h.store.getState());
    const back = parseImport(text);
    expect(back.ok).toBe(true); expect(back.doc).toEqual(h.store.getState());
    expect(exportFileName(new Date(2026, 7, 18).getTime())).toBe('ear-trainer-progress-2026-08-18.json');
  });
});

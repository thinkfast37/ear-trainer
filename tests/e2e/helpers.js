/**
 * Shared Playwright helpers. The app exposes `window.__test` in test-mode builds
 * (contracts/data-files.md): audioLog, store, seed(), clock.
 */
export async function open(page, hash = '#/') {
  await page.goto(`/${hash}`);
  await page.waitForFunction(() => window.__test && window.__test.ready === true);
}

/** First gesture anywhere unlocks audio (AC-1.2.1). */
export async function tapToUnlock(page) {
  await page.locator('body').tap();
}

export async function seed(page, n = 1) {
  await page.evaluate((s) => window.__test.seed(s), n);
}

export async function audioLog(page) {
  return page.evaluate(() => window.__test.audioLog.slice());
}

export async function clearAudioLog(page) {
  await page.evaluate(() => { window.__test.audioLog.length = 0; });
}

export async function getState(page) {
  return page.evaluate(() => window.__test.store.getState());
}

/** Replace the whole progress document and re-render. */
export async function setState(page, doc) {
  await page.evaluate((d) => window.__test.store.replace(d), doc);
}

/** Apply a JSON-safe patch to the document. */
export async function patchState(page, patch) {
  await page.evaluate((p) => window.__test.store.patch(p), patch);
}

/** Answer the current question with `answer` via the exposed session (no UI hunting). */
export async function answer(page, value) {
  return page.evaluate((v) => window.__test.session.submit(v), value);
}

/**
 * Build a progress document (from the live store) with the given levels mastered — every item
 * of the level in `box`, history at the level's minimum answer count (D-006/D-013: levels have
 * no sub-stages) — plus optional in-progress levels. Entries may carry `itemBox`.
 */
export async function masteredDoc(page, entries, { box = 5, inProgress = [] } = {}) {
  return page.evaluate(({ entries, box, inProgress }) => {
    const t = window.__test;
    const doc = JSON.parse(JSON.stringify(t.store.getState()));
    for (const { trackId, levelNo, itemBox } of entries) {
      const track = t.tracks.byId[trackId];
      const key = `${trackId}:${levelNo}`;
      const ids = track.itemsFor(levelNo);
      for (const id of ids) doc.items[id] = { box: itemBox ?? box, attempts: 10, correct: 9, lastSeen: 1, confusions: {} };
      const n = Math.max(20, 3 * ids.length);
      const hist = Array.from({ length: n }, (_, i) => ({ item: ids[i % ids.length], correct: true, at: 1000 + i, replays: 0, score: 1 }));
      doc.levels[key] = { mastered: true, masteredAt: 1, history: hist };
    }
    for (const { trackId, levelNo } of inProgress) doc.levels[`${trackId}:${levelNo}`] = { mastered: false, masteredAt: null, history: [{ item: 'x', correct: true, at: 1, replays: 0, score: 1 }] };
    return doc;
  }, { entries, box, inProgress });
}


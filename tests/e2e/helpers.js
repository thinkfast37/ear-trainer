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

import { test, expect } from '@playwright/test';
import { open, setState, tapToUnlock, masteredDoc } from './helpers.js';

const withMastered = (page, entries, inProgress = []) => masteredDoc(page, entries, { inProgress });

test.describe('US-9.1 Unlock map', () => {
  test('AC-9.1.1 — Every level node displays one of four states', async ({ page }) => {
    await open(page, '#/home');
    await setState(page, await withMastered(page, [{ trackId: 'intervals', levelNo: 1 }], [{ trackId: 'intervals', levelNo: 2 }]));
    const states = await page.locator('[data-role="map"] .node').evaluateAll((els) => els.map((e) => e.dataset.state));
    expect(states.length).toBe(16 + 5 + 15 + 6 + 6 + 13);
    for (const s of states) expect(['locked', 'available', 'in-progress', 'mastered']).toContain(s);
    await expect(page.locator('[data-track="intervals"] [data-level="1"]')).toHaveAttribute('data-state', 'mastered');
    await expect(page.locator('[data-track="intervals"] [data-level="2"]')).toHaveAttribute('data-state', 'in-progress');
    await expect(page.locator('[data-track="intervals"] [data-level="3"]')).toHaveAttribute('data-state', 'locked');
    await expect(page.locator('[data-track="scaleDegrees"] [data-level="1"]')).toHaveAttribute('data-state', 'available');
  });
  test('AC-9.1.2/1 — A connection is drawn from Chord Qualities L1 to Inversions', async ({ page }) => {
    await open(page, '#/home');
    const line = page.locator('[data-role="dependency-lines"] line[data-from="chordQualities:1"][data-to="inversions"]');
    await expect(line).toHaveCount(1);
    const attrs = await line.evaluate((l) => ({ x1: +l.getAttribute('x1'), y1: +l.getAttribute('y1'), x2: +l.getAttribute('x2'), y2: +l.getAttribute('y2') }));
    expect(Number.isFinite(attrs.x1) && Number.isFinite(attrs.y2)).toBe(true);
    expect(attrs.x1 !== attrs.x2 || attrs.y1 !== attrs.y2).toBe(true);
  });
  test('AC-9.1.2/2 — Connections are drawn from Chord Qualities L6 and Inversions L1 to Progressions', async ({ page }) => {
    await open(page, '#/home');
    await expect(page.locator('[data-role="dependency-lines"] line[data-from="chordQualities:6"][data-to="progressions"]')).toHaveCount(1);
    await expect(page.locator('[data-role="dependency-lines"] line[data-from="inversions:1"][data-to="progressions"]')).toHaveCount(1);
    await expect(page.locator('[data-role="dependency-lines"] line')).toHaveCount(3);
  });
  test('AC-9.1.3/1 — Tapping a locked node shows its unlock condition', async ({ page }) => {
    await open(page, '#/home');
    await page.locator('[data-track="intervals"] [data-level="3"]').tap();
    await expect(page.locator('[data-track="intervals"] [data-role="unlock-condition"]')).toHaveText('Master Intervals Level 2 to unlock');
    await page.locator('[data-track="progressions"] [data-level="1"]').tap();
    await expect(page.locator('[data-track="progressions"] [data-role="unlock-condition"]')).toHaveText('Master Chord Qualities Level 6 and Inversions Level 1 to unlock');
    // no session was started
    expect(await page.evaluate(() => Boolean(window.__test.session))).toBe(false);
  });
  test('AC-9.1.3/2 — Tapping an available node starts a session', async ({ page }) => {
    await open(page, '#/home');
    await tapToUnlock(page);
    await page.locator('[data-track="scaleDegrees"] [data-level="1"]').tap();
    // the level screen offers Start; a session is running once tapped
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session && window.__test.session.state.phase === 'question');
    expect(await page.evaluate(() => window.__test.session.state.trackId)).toBe('scaleDegrees');
    await expect(page.locator('[data-role="session"]')).toBeVisible();
  });
});

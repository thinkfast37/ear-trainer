import { test, expect } from '@playwright/test';
import { open, patchState } from './helpers.js';

test.describe('US-10.3 — export', () => {
  test('AC-10.3.2 — Export produces a JSON file with all progress', async ({ page }) => {
    await open(page, '#/home');
    await patchState(page, { xp: 77, items: { 'interval:P5:asc': { box: 3, attempts: 4, correct: 3, lastSeen: 9, confusions: { P4: 1 } } }, streak: { current: 2, best: 4, lastCompletedDay: '2026-08-17' } });
    await page.locator('[data-nav="settings"]').tap();
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="export"]').tap()]);
    expect(download.suggestedFilename()).toMatch(/^ear-trainer-progress-\d{4}-\d{2}-\d{2}\.json$/);
    const path = await download.path();
    const { readFileSync } = await import('node:fs');
    const doc = JSON.parse(readFileSync(path, 'utf8'));
    expect(doc.schemaVersion).toBe(2); // schema 2 since the presentation-tier restructure (D-007)
    expect(doc.xp).toBe(77);
    expect(doc.items['interval:P5:asc'].box).toBe(3);        // Leitner state
    expect(doc.streak).toEqual({ current: 2, best: 4, lastCompletedDay: '2026-08-17' }); // streaks
    for (const k of ['levels', 'days', 'sessions', 'settings']) expect(doc).toHaveProperty(k);   // mastery, stats
    await expect(page.locator('[data-role="import-status"]')).toContainText('Exported');
  });
});

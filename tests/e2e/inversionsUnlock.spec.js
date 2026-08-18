import { test, expect } from '@playwright/test';
import { open, setState } from './helpers.js';

async function withMastered(page, entries) {
  return page.evaluate((entries) => {
    const t = window.__test; const doc = JSON.parse(JSON.stringify(t.store.getState()));
    for (const { trackId, levelNo } of entries) {
      const track = t.tracks.byId[trackId]; const subs = track.def.subStages.length ? track.def.subStages : [null];
      const key = `${trackId}:${levelNo}`; doc.levels[key] = { mastered: true, masteredAt: 1, subStage: subs[subs.length - 1], subStages: {}, history: [] };
      for (const s of subs) { const ids = track.itemsFor(levelNo, s ?? undefined); for (const id of ids) doc.items[id] = { box: 5, attempts: 10, correct: 9, lastSeen: 1, confusions: {} }; const hist = Array.from({ length: 20 }, (_, i) => ({ item: ids[i % ids.length], correct: true, at: 1000 + i, replays: 0, score: 1 })); if (s) doc.levels[key].subStages[s] = { mastered: true, history: hist }; else doc.levels[key].history = hist; }
    }
    return doc;
  }, entries);
}

test.describe('US-6.1 Inversion track unlock', () => {
  test('AC-6.1.1 — The Inversions track is locked until Chord Qualities level 1 is mastered', async ({ page }) => {
    await open(page, '#/home');
    const inv = page.locator('[data-track="inversions"]');
    await expect(inv).toHaveAttribute('data-unlocked', 'false');
    await expect(inv.locator('[data-role="lock-message"]')).toHaveText('Master Chord Qualities Level 1 to unlock');
    await expect(inv.locator('[data-level="1"]')).toHaveAttribute('data-state', 'locked');
    // tapping the locked node shows its unlock condition
    await inv.locator('[data-level="1"]').tap();
    await expect(inv.locator('[data-role="unlock-condition"]')).toHaveText('Master Chord Qualities Level 1 to unlock');
  });
  test('AC-6.1.2 — Mastering Chord Qualities level 1 unlocks the Inversions track', async ({ page }) => {
    await open(page, '#/home');
    await setState(page, await withMastered(page, [{ trackId: 'chordQualities', levelNo: 1 }]));
    const inv = page.locator('[data-track="inversions"]');
    await expect(inv).toHaveAttribute('data-unlocked', 'true');
    await expect(inv.locator('[data-role="lock-message"]')).toHaveCount(0);
    await expect(inv.locator('[data-level="1"]')).toHaveAttribute('data-state', 'available');
    await inv.locator('[data-level="1"]').tap();
    await expect(page.locator('.level-screen[data-track="inversions"][data-level="1"]')).toBeVisible();
  });
});

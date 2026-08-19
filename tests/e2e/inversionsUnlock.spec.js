import { test, expect } from '@playwright/test';
import { open, setState, masteredDoc } from './helpers.js';

const withMastered = (page, entries) => masteredDoc(page, entries);

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

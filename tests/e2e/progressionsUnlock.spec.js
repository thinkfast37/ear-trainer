import { test, expect } from '@playwright/test';
import { open, setState, masteredDoc } from './helpers.js';

const withMastered = (page, entries) => masteredDoc(page, entries);

test.describe('US-8.1 Progression track unlock', () => {
  test('AC-8.1.1 — The Progressions track is locked showing both prerequisites and their status', async ({ page }) => {
    await open(page, '#/home');
    // Chord Qualities L6 mastered (and L1 to make Inversions available), Inversions L1 not
    await setState(page, await withMastered(page, [{ trackId: 'chordQualities', levelNo: 1 }, { trackId: 'chordQualities', levelNo: 6 }]));
    const prog = page.locator('[data-track="progressions"]');
    await expect(prog).toHaveAttribute('data-unlocked', 'false');
    await expect(prog.locator('[data-role="lock-message"]')).toHaveText('Master Chord Qualities Level 6 and Inversions Level 1 to unlock');
    const prereqs = prog.locator('[data-role="prerequisites"] li');
    await expect(prereqs).toHaveCount(2);
    await expect(prereqs.filter({ hasText: 'Chord Qualities Level 6' })).toHaveAttribute('data-met', 'true');
    await expect(prereqs.filter({ hasText: 'Chord Qualities Level 6' })).toContainText('mastered');
    await expect(prereqs.filter({ hasText: 'Inversions Level 1' })).toHaveAttribute('data-met', 'false');
    await expect(prereqs.filter({ hasText: 'Inversions Level 1' })).toContainText('not yet');
  });
  test('AC-8.1.2 — Mastering both prerequisites unlocks the Progressions track', async ({ page }) => {
    await open(page, '#/home');
    await setState(page, await withMastered(page, [{ trackId: 'chordQualities', levelNo: 1 }, { trackId: 'chordQualities', levelNo: 6 }, { trackId: 'inversions', levelNo: 1 }]));
    const prog = page.locator('[data-track="progressions"]');
    await expect(prog).toHaveAttribute('data-unlocked', 'true');
    await expect(prog.locator('[data-role="lock-message"]')).toHaveCount(0);
    await expect(prog.locator('[data-level="1"]')).toHaveAttribute('data-state', 'available');
  });
});

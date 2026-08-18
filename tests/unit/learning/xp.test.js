import { describe, it, expect } from 'vitest';
import { awardXp, streakMultiplier, BASE_XP } from '../../../src/learning/xp.js';
import { readFileSync } from 'node:fs';
import { levelNodeState, trackUnlocked } from '../../../src/learning/unlocks.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress } from '../../../src/storage/schema.js';
import { harness, answerMany, masteredProgress } from '../helpers/harness.js';

describe('US-9.3 XP and level-up feedback', () => {
  it('AC-9.3.1/1 — An in-session answer streak multiplies XP', async () => {
    expect(awardXp({ score: 1, streak: 5 })).toBeGreaterThan(awardXp({ score: 1, streak: 0 }));
    expect(streakMultiplier(3)).toBeCloseTo(1.3); expect(streakMultiplier(50)).toBeCloseTo(2);
    const h = harness({ trackId: 'intervals', levelNo: 1, seed: 1 });
    const results = await answerMany(h.session, 6);
    expect(results.every((r) => r.correct)).toBe(true);
    expect(results[5].xp).toBeGreaterThan(results[0].xp);
    expect(results[0].xp).toBe(BASE_XP);
  });
  it('AC-9.3.1/2 — Fewer replays used multiplies XP', () => {
    expect(awardXp({ score: 1, replays: 0 })).toBeGreaterThan(awardXp({ score: 1, replays: 2 }));
    expect(awardXp({ score: 1, replays: 2 })).toBeGreaterThan(awardXp({ score: 1, replays: 5 }));
  });
  it('AC-9.3.1/3 — A mixed-review question multiplies XP', async () => {
    expect(awardXp({ score: 1, mixed: true })).toBe(Math.round(BASE_XP * 1.5));
    const tracks = buildTracks();
    const p = masteredProgress(tracks, [{ trackId: 'intervals', levelNo: 1 }, { trackId: 'scaleDegrees', levelNo: 1 }]);
    const h = harness({ mixed: true, progress: p, seed: 2 });
    const [r] = await answerMany(h.session, 1);
    expect(r.xp).toBe(Math.round(BASE_XP * 1.5));
    const h2 = harness({ trackId: 'intervals', levelNo: 1, seed: 2 });
    const [r2] = await answerMany(h2.session, 1);
    expect(r2.xp).toBe(BASE_XP);
  });
  it('AC-9.3.3 — XP never gates content', () => {
    const tracks = buildTracks(); const defs = tracks.defs;
    // a huge XP total unlocks nothing
    const rich = emptyProgress(); rich.xp = 1_000_000;
    expect(levelNodeState(rich, defs.intervals, 2, defs)).toBe('locked');
    expect(trackUnlocked(defs.inversions, rich, defs)).toBe(false);
    // zero XP with mastery unlocks
    const poor = masteredProgress(tracks, [{ trackId: 'intervals', levelNo: 1 }, { trackId: 'chordQualities', levelNo: 1 }]); poor.xp = 0;
    expect(levelNodeState(poor, defs.intervals, 2, defs)).toBe('available');
    expect(trackUnlocked(defs.inversions, poor, defs)).toBe(true);
    // and the unlock module never reads xp
    const src = readFileSync('src/learning/unlocks.js', 'utf8'); expect(src).not.toMatch(/\bxp\b/);
    expect(readFileSync('src/learning/mastery.js', 'utf8')).not.toMatch(/\bxp\b/);
  });
});

import { describe, it, expect } from 'vitest';
import { harness, answerMany, masteredProgress } from '../helpers/harness.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { mixedReviewAvailable } from '../../../src/learning/mixedReview.js';
import { dayKey } from '../../../src/learning/streak.js';

describe('US-2.3 Interleaved review mode', () => {
  it('AC-2.3.3 — Mixed Review questions count toward the daily goal and streak', async () => {
    const tracks = buildTracks();
    const p = masteredProgress(tracks, [{ trackId: 'intervals', levelNo: 1 }, { trackId: 'scaleDegrees', levelNo: 1 }]);
    p.settings.sessionGoal = { minutes: 10, questions: 5 };
    expect(mixedReviewAvailable(p)).toBe(true);
    const h = harness({ mixed: true, progress: p, seed: 2 });
    const today = dayKey(h.clock());
    expect(h.store.getState().days[today]).toBeUndefined();
    const results = await answerMany(h.session, 5);
    const day = h.store.getState().days[dayKey(h.clock())];
    expect(day.questions).toBe(5); expect(day.complete).toBe(true);
    expect(h.store.getState().streak.current).toBe(1);
    expect(results.some((r) => r.dayCompleted)).toBe(true);
  });
  it('mixed review draws only from mastered levels', async () => {
    const tracks = buildTracks();
    const p = masteredProgress(tracks, [{ trackId: 'intervals', levelNo: 1 }, { trackId: 'chordQualities', levelNo: 1 }]);
    const h = harness({ mixed: true, progress: p, seed: 4 });
    await h.session.start();
    for (let i = 0; i < 20; i++) { const q = h.session.state.question; expect([`intervals`, `chordQualities`]).toContain(q.trackId); expect(q.levelNo).toBe(1); h.session.submit(q.answer); await h.session.next(); }
  });
});

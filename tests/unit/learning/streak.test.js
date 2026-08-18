import { describe, it, expect } from 'vitest';
import { recordActivity, dayKey, goalMet, currentStreak } from '../../../src/learning/streak.js';
import { emptyProgress } from '../../../src/storage/schema.js';
import { harness, answerMany } from '../helpers/harness.js';

const goal = { minutes: 10, questions: 30 };
const T0 = new Date(2026, 7, 18, 9, 0, 0).getTime();

describe('US-9.2 Daily streak and session goal', () => {
  it('AC-9.2.1/1 — Reaching 30 questions marks today complete and increments the streak', async () => {
    const d = emptyProgress(); d.streak = { current: 2, best: 4, lastCompletedDay: dayKey(T0 - 86400000) };
    for (let i = 0; i < 29; i++) recordActivity(d, { questions: 1, seconds: 2 }, T0 + i, goal);
    expect(d.days[dayKey(T0)].complete).toBe(false); expect(d.streak.current).toBe(2);
    const r = recordActivity(d, { questions: 1, seconds: 2 }, T0 + 30, goal);
    expect(r.justCompleted).toBe(true); expect(d.days[dayKey(T0)].complete).toBe(true); expect(d.streak.current).toBe(3); expect(d.streak.lastCompletedDay).toBe(dayKey(T0));
    // through a real session
    const h = harness({ trackId: 'intervals', levelNo: 1, seed: 1 });
    await answerMany(h.session, 30);
    const p = h.store.getState(); const today = Object.keys(p.days)[0];
    expect(p.days[today].questions).toBe(30); expect(p.days[today].complete).toBe(true); expect(p.streak.current).toBe(1);
  });
  it('AC-9.2.1/2 — Reaching 10 minutes marks today complete and increments the streak', () => {
    const d = emptyProgress();
    for (let i = 0; i < 9; i++) recordActivity(d, { questions: 1, seconds: 60 }, T0 + i, goal);
    expect(goalMet(d.days[dayKey(T0)], goal)).toBe(false);
    const r = recordActivity(d, { questions: 1, seconds: 60 }, T0 + 9, goal);
    expect(r.justCompleted).toBe(true); expect(d.days[dayKey(T0)].seconds).toBe(600); expect(d.streak.current).toBe(1);
    // a gap breaks the streak; consecutive days extend it
    recordActivity(d, { questions: 30 }, T0 + 86400000, goal); expect(d.streak.current).toBe(2);
    recordActivity(d, { questions: 30 }, T0 + 3 * 86400000, goal); expect(d.streak.current).toBe(1); expect(d.streak.best).toBe(2);
    expect(currentStreak(d, T0 + 3 * 86400000)).toBe(1); expect(currentStreak(d, T0 + 10 * 86400000)).toBe(0);
  });
});

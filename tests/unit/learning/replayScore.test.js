import { describe, it, expect } from 'vitest';
import { harness } from '../helpers/harness.js';
import { awardXp } from '../../../src/learning/xp.js';

describe('US-7.3 Limited replays with replay scoring', () => {
  it('AC-7.3.2 — Fewer replays earn a higher score', async () => {
    // Two identical questions (same seed → same phrase), both answered fully correctly, one after 1 replay and one after 3
    const a = harness({ trackId: 'melodic', levelNo: 2, seed: 4 }); const b = harness({ trackId: 'melodic', levelNo: 2, seed: 4 });
    await a.session.start(); await b.session.start();
    expect(a.session.state.question.answer).toEqual(b.session.state.question.answer);
    await a.session.replay();
    await b.session.replay(); await b.session.replay(); await b.session.replay();
    const ra = a.session.submit(a.session.state.question.answer); const rb = b.session.submit(b.session.state.question.answer);
    expect(ra.correct && rb.correct).toBe(true);
    expect(ra.replaysUsed).toBe(1); expect(rb.replaysUsed).toBe(3);
    expect(ra.score).toBeGreaterThan(rb.score);
    expect(ra.xp).toBeGreaterThan(rb.xp);
    expect(awardXp({ score: 1, replays: 1 })).toBeGreaterThan(awardXp({ score: 1, replays: 3 }));
  });
});

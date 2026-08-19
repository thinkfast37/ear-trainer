// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { harness, answerMany, answerUntilMastered } from '../helpers/harness.js';
import { mount } from './dom.js';

function screen(h) {
  const root = mount(() => {});
  renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} });
  return root;
}

const realNow = () => Date.now();

describe('US-2.6 — in-session progress visibility', () => {
  it("AC-2.6.1/1 — The answers counted toward the level's minimum answer count are shown and update on each answer", async () => {
    // intervals L1 has 2 items → minimum max(10, 3×2) = 10 (AC-2.2.4)
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    expect(root.querySelector('[data-role="mastery-meter"]').textContent).toContain('0/10');
    await answerMany(h.session, 3);
    expect(root.querySelector('[data-role="mastery-meter"]').textContent).toContain('3/10');
    // a 12-item level counts toward 36
    const h6 = harness({ trackId: 'intervals', levelNo: 6, now: realNow });
    const root6 = screen(h6);
    await h6.session.start();
    expect(root6.querySelector('[data-role="mastery-meter"]').textContent).toContain('0/36');
  });

  it('AC-2.6.1/2 — The rolling accuracy is shown against the 90% threshold and updates on each answer', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    // 3 correct, then 1 wrong → 75% over 4
    await answerMany(h.session, 3);
    await h.session.next();
    const q = h.session.state.question;
    const wrong = q.options.find((o) => o !== q.answer);
    h.session.submit(wrong);
    const meter = root.querySelector('[data-role="mastery-meter"]').textContent;
    expect(meter).toContain('75%');
    expect(meter).toContain('90%');
  });

  it('AC-2.6.1/3 — The number of items still below box 3 is shown', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    // fresh level: both items are in box 1, below box 3
    expect(root.querySelector('[data-role="mastery-meter"]').textContent).toContain('2 below box 3');
  });

  it("AC-2.6.1/4 — The level's presentation is named for tracks whose levels carry one", async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    expect(root.querySelector('[data-role="mastery-meter"]').textContent).toContain('Ascending');
    const h7 = harness({ trackId: 'intervals', levelNo: 7, now: realNow });
    const root7 = screen(h7);
    await h7.session.start();
    expect(root7.querySelector('[data-role="mastery-meter"]').textContent).toContain('Descending');
    const h10 = harness({ trackId: 'intervals', levelNo: 10, now: realNow });
    const root10 = screen(h10);
    await h10.session.start();
    expect(root10.querySelector('[data-role="mastery-meter"]').textContent).toContain('Ascending + descending');
    // a track whose levels carry no presentation shows none
    const h2 = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root2 = screen(h2);
    await h2.session.start();
    expect(root2.querySelector('[data-role="mastery-meter"]').dataset.presentation).toBe('');
    expect(root2.querySelector('[data-role="mastery-meter"]').textContent).not.toContain('Ascending');
  });

  it('AC-2.6.2/1 — The celebration names the next level with its number and presentation', async () => {
    // Master level 6 (ascending, last of the tier) — the celebration names "Level 7 — Descending".
    const h = harness({ trackId: 'intervals', levelNo: 6, now: realNow });
    const root = screen(h);
    await answerUntilMastered(h.session);
    expect(h.session.state.result.levelMastered).toBe(true);
    const cel = root.querySelector('[data-role="celebration"]');
    expect(cel).not.toBeNull();
    const next = cel.querySelector('[data-role="next-level"]');
    expect(next.textContent).toContain('Level 7');
    expect(next.textContent).toContain('Descending');
    expect(next.dataset.last).toBe('false');
    expect(root.querySelector('[data-role="substage-transition"]')).toBeNull();
  });

  it('AC-2.6.2/2 — Mastering the last level of a track says the track is complete', async () => {
    // Inversions level 6 is the last level of its track.
    const h = harness({ trackId: 'inversions', levelNo: 6, now: realNow });
    const root = screen(h);
    await answerUntilMastered(h.session);
    expect(h.session.state.result.levelMastered).toBe(true);
    const next = root.querySelector('[data-role="celebration"] [data-role="next-level"]');
    expect(next.dataset.last).toBe('true');
    expect(next.textContent).toMatch(/complete/i);
    expect(next.textContent).not.toContain('Level 7');
  });
});

describe('US-9.2 — daily-goal progress visibility', () => {
  it("AC-9.2.4/1 — Questions answered today are shown against the daily goal's question target during a session", async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    expect(root.querySelector('[data-role="goal-progress"]').textContent).toContain('0/30');
    await answerMany(h.session, 3);
    expect(root.querySelector('[data-role="goal-progress"]').textContent).toContain('3/30');
  });

  it('AC-9.2.4/2 — The stopping-point message names the daily goal as the reason', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    h.store.update((d) => { d.settings.sessionGoal = { minutes: 10, questions: 3 }; });
    const root = screen(h);
    const results = await answerMany(h.session, 3);
    expect(results[2].dayCompleted).toBe(true);
    const toast = root.querySelector('[data-role="stopping-point"]');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Daily goal');
  });
});

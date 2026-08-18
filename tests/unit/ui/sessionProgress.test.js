// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { harness, answerMany } from '../helpers/harness.js';
import { mount } from './dom.js';

function screen(h) {
  const root = mount(() => {});
  renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} });
  return root;
}

const realNow = () => Date.now();

describe('US-2.6 — in-session progress visibility', () => {
  it('AC-2.6.1/1 — The answers counted toward the 20-answer window are shown and update on each answer', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    expect(root.querySelector('[data-role="mastery-meter"]').textContent).toContain('0/20');
    await answerMany(h.session, 3);
    expect(root.querySelector('[data-role="mastery-meter"]').textContent).toContain('3/20');
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

  it('AC-2.6.1/4 — The current sub-stage name is shown for tracks with sub-stages', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    expect(root.querySelector('[data-role="mastery-meter"]').textContent).toContain('Ascending');
    // a track without sub-stages shows no sub-stage name
    const h2 = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root2 = screen(h2);
    await h2.session.start();
    expect(root2.querySelector('[data-role="mastery-meter"]').textContent).not.toContain('Ascending');
  });

  it("AC-2.6.2/1 — The mastering answer's feedback announces the sub-stage is mastered", async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await answerMany(h.session, 20);
    expect(h.session.state.result.subMastered).toBe(true);
    const t = root.querySelector('[data-role="substage-transition"]').textContent;
    expect(t).toContain('Ascending');
    expect(t).toContain('mastered');
  });

  it('AC-2.6.2/2 — The next sub-stage is named with its position in the order', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await answerMany(h.session, 20);
    const t = root.querySelector('[data-role="substage-transition"]').textContent;
    expect(t).toContain('Descending');
    expect(t).toContain('2 of 3');
  });

  it('AC-2.6.2/3 — Mastering the last sub-stage shows the level celebration, not a transition announcement', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    // put the level in the harmonic (last) sub-stage with the earlier ones mastered
    h.store.update((d) => {
      d.levels['intervals:1'] = {
        mastered: false, masteredAt: null, subStage: 'harm',
        subStages: { asc: { mastered: true, history: [] }, desc: { mastered: true, history: [] } },
        history: [],
      };
    });
    const root = screen(h);
    await answerMany(h.session, 20);
    expect(h.session.state.result.levelMastered).toBe(true);
    expect(root.querySelector('[data-role="celebration"]')).not.toBeNull();
    expect(root.querySelector('[data-role="substage-transition"]')).toBeNull();
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

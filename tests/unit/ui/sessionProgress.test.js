// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { harness, answerMany, answerUntilMastered } from '../helpers/harness.js';
import { mount } from './dom.js';

function screen(h, nav = () => {}) {
  const root = mount(() => {});
  renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: nav });
  return root;
}

function endTap(root) { root.querySelector('[data-action="end-session"]').dispatchEvent(new window.Event('click')); }

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

  it("AC-2.6.1/3 — Items at box 3 or above are shown against the level's item count", async () => {
    // Renamed and re-asserted with the 2026-09-07 AC-2.6.1 revision: the old assertion, "2 below
    // box 3", was a bare count of stragglers with no denominator, so it could not say how much of
    // the condition was done. The AC now asks for the count against the level's item count.
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    const meter = root.querySelector('[data-role="mastery-meter"]');
    // fresh level: both items are in box 1, so none has reached box 3
    expect(meter.querySelector('[data-condition="boxes"]').textContent).toContain('0/2');
    expect(meter.dataset.weak).toBe('2');
    // two correct answers on an item lift it from box 1 to box 3 (D-006)
    await answerMany(h.session, 12);
    const after = root.querySelector('[data-role="mastery-meter"] [data-condition="boxes"]');
    expect(after.textContent).toContain('2/2');
  });

  it('AC-2.6.1/5 — Every mastery condition is labelled and stays shown once it is met', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    const ids = () => [...root.querySelectorAll('[data-role="mastery-meter"] [data-condition]')].map((e) => e.dataset.condition);
    expect(ids()).toEqual(['answers', 'accuracy', 'boxes']);
    for (const e of root.querySelectorAll('[data-role="mastery-meter"] [data-condition]')) {
      expect(e.textContent.replace(/[\d/%✓ ]/g, '')).not.toBe(''); // each carries a label, not just numbers
    }
    // 10 correct answers on a 2-item level meet every condition; all three stay on screen
    await answerMany(h.session, 10);
    const met = [...root.querySelectorAll('[data-role="mastery-meter"] [data-condition]')];
    expect(met.map((e) => e.dataset.condition)).toEqual(['answers', 'accuracy', 'boxes']);
    expect(met.every((e) => e.dataset.met === 'true')).toBe(true);
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

describe('US-2.6 — ending a session', () => {
  it("AC-2.6.3/1 — The summary shows the session's questions answered and correct count", async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await answerMany(h.session, 4);
    // one wrong answer so questions and correct differ and a stale total cannot pass by accident
    await h.session.next();
    const q = h.session.state.question;
    h.session.submit(q.options.find((o) => o !== q.answer));
    endTap(root);
    const tally = root.querySelector('[data-role="session-summary"] [data-role="session-tally"]');
    expect(tally.textContent).toContain('5 questions');
    expect(tally.textContent).toContain('4 correct');
  });

  it("AC-2.6.3/2 — The summary shows the level's three mastery conditions with current values", async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await answerMany(h.session, 4);
    endTap(root);
    const panel = root.querySelector('[data-role="session-summary"] [data-role="mastery-progress"]');
    expect(panel).not.toBeNull();
    const conditions = [...panel.querySelectorAll('[data-condition]')];
    expect(conditions.map((e) => e.dataset.condition)).toEqual(['answers', 'accuracy', 'boxes']);
    expect(panel.querySelector('[data-condition="answers"]').textContent).toContain('4/10');
    expect(panel.querySelector('[data-condition="accuracy"]').textContent).toContain('100%');
    expect(panel.querySelector('[data-condition="boxes"]').textContent).toContain('/2');
  });

  it('AC-2.6.3/3 — The summary states that progress is saved', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await answerMany(h.session, 2);
    endTap(root);
    expect(root.querySelector('[data-role="session-summary"] [data-role="saved-note"]').textContent).toMatch(/saved/i);
    // and the answers really are in the store, which is what the note claims
    expect(h.store.getState().levels['intervals:1'].history.length).toBe(2);
  });

  it('AC-2.6.3/4 — Dismissing the summary returns to the menu', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const routes = [];
    const root = screen(h, (r) => routes.push(r));
    await answerMany(h.session, 2);
    endTap(root);
    expect(routes).toEqual([]); // ending shows the summary rather than leaving straight away
    root.querySelector('[data-action="summary-close"]').dispatchEvent(new window.Event('click'));
    expect(routes).toEqual(['/home']);
  });

  it('AC-2.6.3/5 — A session that mastered the level shows the mastery dialog instead', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    const root = screen(h);
    await answerMany(h.session, 2);
    // a mastery reached in this session but never announced (AC-9.3.4) takes precedence
    h.store.update((d) => { d.levels['intervals:1'].mastered = true; d.levels['intervals:1'].masteredAt = Date.now(); });
    endTap(root);
    expect(root.querySelector('[data-role="mastery-dialog"]')).not.toBeNull();
    expect(root.querySelector('[data-role="session-summary"]')).toBeNull();
  });
});

describe('US-9.2 — the stopping point within reach of mastery', () => {
  it('AC-9.2.2/3 — Within five answers of mastering the level, the message says how many remain instead of suggesting a stop', async () => {
    // intervals L1: 2 items, minimum 10 answers. Six correct answers put both items at box 3+ and
    // accuracy at 100%, so answering is the only condition left — four short.
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    h.store.update((d) => { d.settings.sessionGoal = { minutes: 10, questions: 6 }; });
    const root = screen(h);
    const results = await answerMany(h.session, 6);
    expect(results[5].dayCompleted).toBe(true);
    const toast = root.querySelector('[data-role="stopping-point"]');
    expect(toast.dataset.nearMastery).toBe('true');
    expect(toast.textContent).toContain('4 answers');
    expect(toast.textContent).not.toContain('good stopping point');
    expect(toast.textContent).toContain('Daily goal'); // AC-9.2.4/2 still holds
  });

  it('AC-9.2.2/4 — With a mastery condition other than answering still unmet, the message suggests a stopping point as usual', async () => {
    // Three answers on a two-item level leaves one item at box 2, so the level is not within reach
    // however few answers remain.
    const h = harness({ trackId: 'intervals', levelNo: 1, now: realNow });
    h.store.update((d) => { d.settings.sessionGoal = { minutes: 10, questions: 3 }; });
    const root = screen(h);
    await answerMany(h.session, 3);
    const toast = root.querySelector('[data-role="stopping-point"]');
    expect(toast.dataset.nearMastery).toBe('false');
    expect(toast.textContent).toContain('good stopping point');
  });
});

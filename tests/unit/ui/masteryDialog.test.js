// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { harness, answerUntilMastered } from '../helpers/harness.js';
import { mount, tap } from './dom.js';

function screen(h, { go = () => {}, onEnd = null } = {}) {
  const root = mount(() => {});
  renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go, onEnd });
  return root;
}

describe('US-9.3 — mastery dialog', () => {
  it('AC-9.3.2/1 — The dialog interrupts at the mastery moment and shows accuracy, time and weakest item', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    const root = screen(h);
    await answerUntilMastered(h.session);
    const dialog = root.querySelector('[data-role="mastery-dialog"]');
    expect(dialog).not.toBeNull();
    const card = dialog.querySelector('[data-role="celebration"]');
    expect(card.getAttribute('role')).toBe('dialog');
    expect(card.textContent).toContain('Level 1 mastered');
    expect(card.querySelector('[data-stat="accuracy"]').textContent).toContain('Accuracy');
    expect(card.querySelector('[data-stat="time"]').textContent).toContain('Time');
    expect(card.querySelector('[data-stat="weakest"]').textContent).toContain('Weakest item conquered');
  });

  it('AC-9.3.2/2 — Choosing to return to the main menu ends the session and shows the main menu', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    const gone = [];
    const root = screen(h, { go: (p) => gone.push(p) });
    await answerUntilMastered(h.session);
    tap(root.querySelector('[data-action="to-menu"]'));
    expect(h.session.state.ended).toBe(true);
    expect(gone).toEqual(['/home']);
  });

  it('AC-9.3.2/3 — Choosing to keep practising closes the dialog and the session continues on the same level', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    const root = screen(h);
    await answerUntilMastered(h.session);
    tap(root.querySelector('[data-action="keep-practising"]'));
    expect(root.querySelector('[data-role="mastery-dialog"]')).toBeNull();
    expect(h.session.state.ended).toBe(false);
    await h.session.next();
    expect(h.session.state.question.levelNo).toBe(1);
    h.session.submit(h.session.state.question.answer);
    // the dialog does not reappear on later answers of the already-mastered level
    expect(root.querySelector('[data-role="mastery-dialog"]')).toBeNull();
  });

  it('AC-9.3.4 — Ending a session whose mastery dialog was never shown presents it before leaving', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    // mastery happens with no screen attached (the moment was missed), and play moves on
    await answerUntilMastered(h.session);
    await h.session.next();
    const gone = [];
    const root = screen(h, { go: (p) => gone.push(p) });
    tap(root.querySelector('[data-action="end-session"]'));
    expect(root.querySelector('[data-role="mastery-dialog"]')).not.toBeNull();
    expect(gone).toEqual([]);
    expect(h.session.state.ended).toBe(false);
    tap(root.querySelector('[data-action="to-menu"]'));
    expect(h.session.state.ended).toBe(true);
    expect(gone).toEqual(['/home']);
  });

  it('AC-9.3.2/4 — The time shown is active practice time on the level, excluding background time and gaps over the idle cap: a gap over the idle cap', async () => {
    // The regression the maintainer reported: a level started, abandoned for two hours and then
    // finished said "152m". Time is now accumulated per answer and capped per gap (D-014).
    let t = 1_700_000_000_000;
    const h = harness({ trackId: 'intervals', levelNo: 1, now: () => t });
    const root = screen(h);
    await h.session.start();
    for (let i = 0; i < 8; i++) { // eight brisk answers, three seconds each
      t += 3000;
      h.session.submit(h.session.state.question.answer);
      await h.session.next();
    }
    t += 2 * 60 * 60 * 1000; // the level is abandoned for two hours
    h.session.submit(h.session.state.question.answer);
    await h.session.next();
    t += 3000;
    expect(h.session.submit(h.session.state.question.answer).levelMastered).toBe(true);
    // 8×3s + the capped 60s + 3s = 87s of practice, against a 2h05m wall clock
    expect(root.querySelector('[data-stat="time"]').textContent).toBe('Time 1m 27s');
    expect(h.store.getState().levels['intervals:1'].activeSeconds).toBe(87);
  });

  it('AC-9.3.2/4 — The time shown is active practice time on the level, excluding background time and gaps over the idle cap: time in the background', async () => {
    let t = 1_700_000_000_000;
    const visibility = (value) => {
      Object.defineProperty(document, 'visibilityState', { value, configurable: true });
      document.dispatchEvent(new window.Event('visibilitychange'));
    };
    const h = harness({ trackId: 'intervals', levelNo: 1, now: () => t });
    const root = screen(h);
    await h.session.start();
    for (let i = 0; i < 9; i++) {
      t += 2000;
      h.session.submit(h.session.state.question.answer);
      await h.session.next();
    }
    // the app is suspended mid-question for four minutes — under the idle cap per gap only because
    // the clock is stopped, not because the cap saved it
    t += 1000;
    visibility('hidden');
    t += 4 * 60 * 1000;
    visibility('visible');
    t += 1000;
    expect(h.session.submit(h.session.state.question.answer).levelMastered).toBe(true);
    visibility('visible');
    // 9×2s + 1s before + 1s after = 20s; the four minutes away count for nothing
    expect(h.store.getState().levels['intervals:1'].activeSeconds).toBe(20);
    expect(root.querySelector('[data-stat="time"]').textContent).toBe('Time 0m 20s');
  });
});
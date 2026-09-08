// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { renderLevelScreen } from '../../../src/ui/levelScreen.js';
import { renderHomeMap } from '../../../src/ui/homeMap.js';
import { renderGuidance } from '../../../src/ui/guidance.js';
import { installFocusNav } from '../../../src/ui/focusNav.js';
import { harness, answerUntilMastered, masteredProgress } from '../helpers/harness.js';
import { buildTracks } from '../../../src/tracks/index.js';

/**
 * The real screens inside a real frame, with the navigator installed — the same wiring
 * `main.js` does. `data-autofocus` is only worth anything if the renderers actually carry it.
 */
let nav = null;
afterEach(() => { nav?.stop(); nav = null; });

function app(render) {
  document.body.innerHTML = '<div class="frame"><header class="topbar"><nav class="nav"><button data-nav="home">Home</button></nav></header><main class="content"></main></div>';
  const frame = document.querySelector('.frame');
  const content = frame.querySelector('.content');
  const out = render(content);
  nav = installFocusNav({ frame, content, onBack: () => nav.dismissTop() });
  return { frame, content, out };
}
const settle = () => new Promise((r) => setTimeout(r, 0));
const press = (key) => {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  document.dispatchEvent(ev);
  return ev;
};

describe('US-11.1 — Focus lands on the next action, in the session flow', () => {
  it('AC-11.1.2/1 — A single-choice question focuses its first answer button', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    const { content } = app((root) => renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} }));
    await h.session.start();
    await settle();
    const first = content.querySelector('.answer-grid button');
    expect(first.hasAttribute('data-autofocus')).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('AC-11.1.1 — A shown result focuses its primary next action', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    const { content } = app((root) => renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} }));
    await h.session.start();
    await settle();
    h.session.submit(h.session.state.question.answer);
    await settle();
    const next = content.querySelector('[data-action="next"]');
    expect(next).not.toBeNull();
    expect(document.activeElement).toBe(next);
  });

  it('AC-11.1.2/1 — A single-choice question focuses its first answer button: and it does so again on the question after the result', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    const { content } = app((root) => renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} }));
    await h.session.start();
    h.session.submit(h.session.state.question.answer);
    await h.session.next();
    await settle();
    expect(document.activeElement).toBe(content.querySelector('.answer-grid button'));
  });

  it('AC-11.1.2/2 — A sequence question focuses its first option button', async () => {
    const h = harness({ trackId: 'melodic', levelNo: 1 });
    const { content } = app((root) => renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} }));
    await h.session.start();
    await settle();
    const first = content.querySelector('[data-role="options"] button');
    expect(first.hasAttribute('data-autofocus')).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('AC-11.1.2/3 — A combined quality-and-inversion question focuses its first quality button', async () => {
    const tracks = buildTracks();
    const progress = masteredProgress(tracks, [{ trackId: 'chordQualities', levelNo: 1 }]);
    const h = harness({ trackId: 'inversions', levelNo: 3, progress });
    const { content } = app((root) => renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} }));
    await h.session.start();
    await settle();
    const first = content.querySelector('[data-part="quality"] button');
    expect(first.hasAttribute('data-autofocus')).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it("AC-11.1.3/3 — Navigating to another screen moves focus to that screen's primary control: the level screen starts on Start, the home map on the first level it can open", async () => {
    const tracks = buildTracks();
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    const level = app((root) => renderLevelScreen(root, { store: h.store, tracks, trackId: 'intervals', levelNo: 1, go: () => {} }));
    expect(document.activeElement).toBe(level.content.querySelector('[data-action="start-session"]'));
    nav.stop();
    app((root) => renderHomeMap(root, { store: h.store, tracks, go: () => {} }));
    const focused = document.activeElement;
    expect(focused.classList.contains('node')).toBe(true);
    expect(focused.dataset.state).not.toBe('locked');
  });

  it('AC-11.1.4/1 — An opened dialog focuses its primary action: the mastery dialog raised mid-session', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    const { content } = app((root) => renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} }));
    await answerUntilMastered(h.session);
    await settle();
    const dialog = content.querySelector('[data-role="mastery-dialog"]');
    expect(dialog).not.toBeNull();
    expect(document.activeElement).toBe(dialog.querySelector('[data-action="to-menu"]'));
  });
});

describe('US-11.3 — Escape closes what is open', () => {
  it('AC-11.3.4/1 — Escape closes the mastery dialog and the session continues', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    const { content } = app((root) => renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} }));
    await answerUntilMastered(h.session);
    await settle();
    expect(content.querySelector('[data-role="mastery-dialog"]')).not.toBeNull();
    expect(press('Escape').defaultPrevented).toBe(true);
    expect(content.querySelector('[data-role="mastery-dialog"]')).toBeNull();
    // The session is still live: the feedback panel beneath is intact and Next still advances it.
    expect(content.querySelector('[data-action="next"]')).not.toBeNull();
    expect(h.session.state.phase).toBe('feedback');
  });

  it('AC-11.3.4/2 — Escape closes the session summary and returns to the menu', async () => {
    const h = harness({ trackId: 'intervals', levelNo: 1 });
    let home = 0;
    const { content } = app((root) => renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {}, onEnd: () => { home += 1; } }));
    await h.session.start();
    h.session.submit(h.session.state.question.answer);
    await settle();
    content.querySelector('[data-action="end-session"]').click();
    await settle();
    expect(content.querySelector('[data-role="session-summary-dialog"]')).not.toBeNull();
    press('Escape');
    expect(home).toBe(1);
  });

  it('AC-11.3.4/3 — Escape closes the guidance panel', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1 });
    const { content } = app((root) => {
      const area = document.createElement('div');
      root.append(area);
      renderGuidance(area, { store: h.store, trackId: 'scaleDegrees' });
    });
    await settle();
    expect(content.querySelector('[data-role="guidance"]')).not.toBeNull();
    press('Escape');
    expect(content.querySelector('[data-role="guidance"]')).toBeNull();
    expect(h.store.getState().guidance.scaleDegrees).toBe(true);
  });
});

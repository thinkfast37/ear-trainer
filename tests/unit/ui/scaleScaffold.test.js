// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { renderLevelScreen } from '../../../src/ui/levelScreen.js';
import { createStore } from '../../../src/app/store.js';
import { emptyProgress, normaliseProgress } from '../../../src/storage/schema.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { harness, answerMany } from '../helpers/harness.js';
import { mount, tap } from './dom.js';

const realNow = () => Date.now();

function screen(h) {
  const root = mount(() => {});
  renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} });
  return root;
}
const midis = (h) => h.sampler.notes.filter((n) => n.midi).map((n) => n.midi);
const SCALE_LEN = 15;
const CADENCE_LEN = 12;

describe('US-4.4 — reference controls on the session screen', () => {
  it('AC-4.4.3/1 — Hear scale, re-hear cadence and replay note are three distinct controls', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    const scale = root.querySelector('[data-action="hear-scale"]');
    const cadence = root.querySelector('[data-action="rehear-cadence"]');
    const replay = root.querySelector('[data-action="replay"]');
    expect(scale).toBeTruthy(); expect(cadence).toBeTruthy(); expect(replay).toBeTruthy();
    expect(new Set([scale, cadence, replay]).size).toBe(3);
    expect(scale.disabled).toBe(false);
    expect(scale.textContent).toMatch(/hear scale/i);
    expect(cadence.textContent).toMatch(/cadence/i);
    expect(replay.textContent).toMatch(/replay/i);
  });

  it('AC-4.4.3/2 — Hear scale plays only the scale of the question key', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    const q = h.session.state.question;
    h.sampler.notes.length = 0;
    tap(root.querySelector('[data-action="hear-scale"]'));
    await new Promise((r) => setTimeout(r, 0));
    const played = midis(h);
    expect(played).toEqual(q.exercise.prelude.parts.scale.events.map((e) => e.midi));
    expect(played.length).toBe(SCALE_LEN);
    expect(played[0]).toBe(q.meta.tonic);
  });

  it('AC-4.4.3/3 — Re-hear cadence plays only the cadence', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    const q = h.session.state.question;
    h.sampler.notes.length = 0;
    tap(root.querySelector('[data-action="rehear-cadence"]'));
    await new Promise((r) => setTimeout(r, 0));
    const played = midis(h);
    expect(played).toEqual(q.exercise.prelude.parts.cadence.events.map((e) => e.midi));
    expect(played.length).toBe(CADENCE_LEN); // no scale, no target
  });

  it('AC-4.4.3/4 — Replay note plays only the target note', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    const q = h.session.state.question;
    h.sampler.notes.length = 0;
    tap(root.querySelector('[data-action="replay"]'));
    await new Promise((r) => setTimeout(r, 0));
    expect(midis(h)).toEqual([q.exercise.events[0].midi]);
  });

  it('AC-4.4.4/1 — Tapping hear scale leaves the replay count and score unaffected', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    for (let i = 0; i < 3; i++) tap(root.querySelector('[data-action="hear-scale"]'));
    await new Promise((r) => setTimeout(r, 0));
    expect(h.session.state.replaysUsed).toBe(0);
    expect(root.querySelector('[data-action="replay"]').textContent).toBe('Replay');
    const r = h.session.submit(h.session.state.question.answer);
    expect(r.replaysUsed).toBe(0);
    expect(r.score).toBe(1);
  });

  it('AC-4.4.4/2 — Replay note still counts as a replay', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    tap(root.querySelector('[data-action="hear-scale"]'));
    tap(root.querySelector('[data-action="rehear-cadence"]'));
    await new Promise((r) => setTimeout(r, 0));
    expect(h.session.state.replaysUsed).toBe(0);
    tap(root.querySelector('[data-action="replay"]'));
    await new Promise((r) => setTimeout(r, 0));
    expect(h.session.state.replaysUsed).toBe(1);
    const r = h.session.submit(h.session.state.question.answer);
    expect(r.replaysUsed).toBe(1);
  });

  it('AC-4.4.5/1 — The hear-scale control is present but disabled from level 3', async () => {
    for (const levelNo of [3, 4, 5]) {
      const h = harness({ trackId: 'scaleDegrees', levelNo, now: realNow });
      const root = screen(h);
      await h.session.start();
      const scale = root.querySelector('[data-action="hear-scale"]');
      expect(scale).toBeTruthy();
      expect(scale.disabled).toBe(true);
      expect(scale.getAttribute('aria-disabled')).toBe('true');
    }
    // and enabled at levels 1 and 2
    for (const levelNo of [1, 2]) {
      const h = harness({ trackId: 'scaleDegrees', levelNo, now: realNow });
      const root = screen(h);
      await h.session.start();
      expect(root.querySelector('[data-action="hear-scale"]').disabled).toBe(false);
    }
  });

  it('AC-4.4.5/2 — A hint says the scale reference is a level 1–2 aid', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 3, now: realNow });
    const root = screen(h);
    await h.session.start();
    expect(root.querySelector('[data-role="scale-hint"]').textContent).toBe('Scale reference is a level 1–2 aid');
    const h1 = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root1 = screen(h1);
    await h1.session.start();
    expect(root1.querySelector('[data-role="scale-hint"]')).toBeNull();
  });

  it('AC-4.4.5/3 — Tapping the disabled control plays nothing', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 3, now: realNow });
    const root = screen(h);
    await h.session.start();
    h.sampler.notes.length = 0;
    tap(root.querySelector('[data-action="hear-scale"]'));
    await new Promise((r) => setTimeout(r, 0));
    expect(midis(h)).toEqual([]);
  });

  it('AC-4.4.6/2 — Hear scale and re-hear cadence remain available on demand regardless of the setting', async () => {
    for (const cadenceFrequency of ['never', 'firstOnly']) {
      const p = emptyProgress(); p.settings.cadenceFrequency = cadenceFrequency;
      const h = harness({ trackId: 'scaleDegrees', levelNo: 1, progress: p, now: realNow });
      const root = screen(h);
      await h.session.start();
      // second question: neither the scale nor the cadence auto-plays under either setting
      h.session.submit(h.session.state.question.answer);
      await h.session.next();
      h.sampler.notes.length = 0;
      const scale = root.querySelector('[data-action="hear-scale"]');
      const cadence = root.querySelector('[data-action="rehear-cadence"]');
      expect(scale.disabled).toBe(false);
      expect(cadence).toBeTruthy();
      tap(scale);
      await new Promise((r) => setTimeout(r, 0));
      expect(midis(h).length).toBe(SCALE_LEN);
      h.sampler.notes.length = 0;
      tap(cadence);
      await new Promise((r) => setTimeout(r, 0));
      expect(midis(h).length).toBe(CADENCE_LEN);
    }
  });
});

describe('US-4.5 — scale-degree onboarding guidance', () => {
  const levelScreen = (store) => mount(renderLevelScreen, { store, tracks: buildTracks(), trackId: 'scaleDegrees', levelNo: 1, go: () => {} });

  it('AC-4.5.1/1 — The guidance appears the first time the Scale Degrees track is opened', () => {
    const root = levelScreen(createStore(emptyProgress()));
    expect(root.querySelector('[data-role="guidance"][data-track="scaleDegrees"]')).toBeTruthy();
    // and not on a track without guidance
    const other = mount(renderLevelScreen, { store: createStore(emptyProgress()), tracks: buildTracks(), trackId: 'intervals', levelNo: 1, go: () => {} });
    expect(other.querySelector('[data-role="guidance"]')).toBeNull();
  });

  it('AC-4.5.1/2 — The guidance says the chords set the key and the last chord is home (Do)', () => {
    const root = levelScreen(createStore(emptyProgress()));
    const t = root.querySelector('[data-role="guidance"]').textContent;
    expect(t).toMatch(/chords .*set the key/i);
    expect(t).toMatch(/last chord is home/i);
    expect(t).toMatch(/\bDo\b/);
  });

  it('AC-4.5.1/3 — The guidance says the scale plays every degree from Do and the question is which degree the final note is', () => {
    const root = levelScreen(createStore(emptyProgress()));
    const t = root.querySelector('[data-role="guidance"]').textContent;
    expect(t).toMatch(/every degree up from Do/i);
    expect(t).toMatch(/which degree .* final note/i);
  });

  it('AC-4.5.2/1 — Dismissed guidance does not reappear after a restart', () => {
    const store = createStore(emptyProgress());
    const root = levelScreen(store);
    tap(root.querySelector('[data-action="dismiss-guidance"]'));
    expect(root.querySelector('[data-role="guidance"]')).toBeNull();
    expect(store.getState().guidance.scaleDegrees).toBe(true);
    // "restart": a fresh store loaded from the persisted document, re-rendered
    const reloaded = createStore(normaliseProgress(structuredClone(store.getState())));
    const again = levelScreen(reloaded);
    expect(again.querySelector('[data-role="guidance"]')).toBeNull();
    // and the session screen does not show it either
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, progress: reloaded.getState(), now: realNow });
    const s = screen(h);
    return h.session.start().then(() => expect(s.querySelector('[data-role="guidance"]')).toBeNull());
  });

  it('AC-4.5.2/2 — A help affordance reopens the guidance on demand', async () => {
    const p = emptyProgress(); p.guidance = { scaleDegrees: true };
    const store = createStore(p);
    const root = levelScreen(store);
    expect(root.querySelector('[data-role="guidance"]')).toBeNull();
    tap(root.querySelector('[data-action="open-guidance"]'));
    expect(root.querySelector('[data-role="guidance"][data-track="scaleDegrees"]')).toBeTruthy();
    // also from the session screen
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, progress: p, now: realNow });
    const s = screen(h);
    await h.session.start();
    expect(s.querySelector('[data-role="guidance"]')).toBeNull();
    tap(s.querySelector('[data-action="open-guidance"]'));
    expect(s.querySelector('[data-role="guidance"]')).toBeTruthy();
  });

  it('AC-4.5.3/1 — The first four level-1 questions show the "scale → cadence → note" hint', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root = screen(h);
    await h.session.start();
    for (let i = 0; i < 4; i++) {
      const hint = root.querySelector('[data-role="order-hint"]');
      expect(hint, `question ${i + 1}`).toBeTruthy();
      expect(hint.textContent).toContain('scale → cadence → note');
      h.session.submit(h.session.state.question.answer);
      await h.session.next();
    }
  });

  it('AC-4.5.3/2 — The hint is not shown once 5 questions have been answered on the track', async () => {
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, now: realNow });
    const root = screen(h);
    await answerMany(h.session, 5);
    await h.session.next();
    expect(root.querySelector('[data-role="order-hint"]')).toBeNull();
    // answers on another level of the same track count too
    const p = emptyProgress();
    p.levels['scaleDegrees:2'] = { mastered: false, masteredAt: null, history: Array.from({ length: 5 }, (_, i) => ({ item: 'degree:Re:major', correct: true, at: i, replays: 0, score: 1 })) };
    const h2 = harness({ trackId: 'scaleDegrees', levelNo: 1, progress: p, now: realNow });
    const root2 = screen(h2);
    await h2.session.start();
    expect(root2.querySelector('[data-role="order-hint"]')).toBeNull();
  });
});

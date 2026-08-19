// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderAnchors, anchorsFor } from '../../../src/ui/anchors.js';
import { renderFeedback } from '../../../src/ui/feedback.js';
import { harness } from '../helpers/harness.js';
import anchors from '../../../src/data/anchors.json';
import { mount } from './dom.js';

/** Feedback for `intervalIdWanted` in `presentation`; the level is chosen so that item exists (levels are presentation tiers, D-013). */
async function feedbackFor(intervalIdWanted, presentation = 'asc', levelNo = presentation === 'desc' ? 8 : 5) {
  const h = harness({ trackId: 'intervals', levelNo, seed: 12 });
  const s = h.newSession({});
  const wanted = `interval:${intervalIdWanted}:${presentation}`;
  await s.start(); let guard = 0;
  while (s.state.question.itemId !== wanted && guard++ < 800) await s.next();
  expect(s.state.question.itemId).toBe(wanted);
  s.submit(s.state.question.answer);
  const root = mount(() => {});
  renderFeedback(root, { session: s, track: h.tracks.byId.intervals, settings: h.store.getState().settings, onNext: () => {} });
  return root;
}

describe('US-3.4 Anchor-song reference', () => {
  it('AC-3.4.1/1 — Up to five anchor songs for the correct interval are shown', async () => {
    const root = await feedbackFor('M6');
    const list = root.querySelectorAll('[data-role="anchor-list"] li');
    expect(list.length).toBe(5);
    expect(root.querySelector('[data-role="anchors"]').dataset.interval).toBe('M6');
    expect([...list].map((li) => li.querySelector('strong').textContent)).toEqual(anchors.M6.map((a) => a.title));
    // and for a wrong answer, still the correct interval's anchors
    const h = harness({ trackId: 'intervals', levelNo: 1, seed: 1 });
    await h.session.start();
    const q = h.session.state.question; h.session.submit(q.options.find((o) => o !== q.answer));
    const r2 = mount(() => {}); renderFeedback(r2, { session: h.session, track: h.tracks.byId.intervals, settings: h.store.getState().settings, onNext: () => {} });
    expect(r2.querySelector('[data-role="anchors"]').dataset.interval).toBe(q.answer);
  });
  it('AC-3.4.1/2 — Each anchor entry shows the song title and its lyric or motif cue', async () => {
    const root = await feedbackFor('P4');
    const items = [...root.querySelectorAll('[data-role="anchor-list"] li')];
    expect(items.length).toBeGreaterThan(0);
    for (const li of items) { expect(li.querySelector('strong').textContent.length).toBeGreaterThan(0); expect(li.querySelector('.cue').textContent.length).toBeGreaterThan(0); }
    expect(items.map((li) => li.querySelector('.cue').textContent)).toEqual(expect.arrayContaining(['"Here comes…"', '"A-maz-…"']));
  });
  it('AC-3.4.2 — Descending anchors are listed first for descending questions', async () => {
    const root = await feedbackFor('m3', 'desc');
    const dirs = [...root.querySelectorAll('[data-role="anchor-list"] li')].map((li) => li.dataset.direction);
    expect(dirs[0]).toBe('desc');
    const firstAsc = dirs.indexOf('asc'); const lastDesc = dirs.lastIndexOf('desc');
    expect(lastDesc).toBeLessThan(firstAsc === -1 ? Infinity : firstAsc);
    expect(root.querySelector('[data-role="anchor-list"] li .direction').textContent).toContain('descending');
    expect(anchorsFor('m3', 'asc').simple[0].direction).toBe('asc');
  });
  it('AC-3.4.4/1 — Compound feedback shows the octave plus simple interval decomposition with the simple anchors', async () => {
    const root = await feedbackFor('M9', 'asc', 14);
    expect(root.querySelector('[data-role="anchors-title"]').textContent).toBe('major 9th = octave + major 2nd');
    expect(root.querySelector('[data-role="decomposition"]').textContent).toMatch(/octave plus a major 2nd/);
    const titles = [...root.querySelectorAll('[data-role="anchor-list"] li strong')].map((s) => s.textContent);
    expect([...titles].sort()).toEqual(anchors.M2.map((a) => a.title).sort());
  });
  it('AC-3.4.4/2 — Compound feedback shows any known compound-specific examples', async () => {
    const root = await feedbackFor('M9', 'asc', 14);
    const ex = [...root.querySelectorAll('[data-role="compound-examples"] li strong')].map((s) => s.textContent);
    expect(ex).toEqual(anchors.M9.examples.map((a) => a.title));
    expect(ex.length).toBeGreaterThan(0);
  });
  it('renderAnchors handles a simple interval directly', () => {
    const root = mount(() => {}); renderAnchors(root, { intervalId: 'TT', direction: 'asc' });
    expect(root.querySelectorAll('li').length).toBe(5);
  });
});

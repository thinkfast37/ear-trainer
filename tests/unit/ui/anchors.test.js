// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderAnchors, anchorsFor } from '../../../src/ui/anchors.js';
import { renderFeedback } from '../../../src/ui/feedback.js';
import { harness } from '../helpers/harness.js';
import anchors from '../../../src/data/anchors.json';
import { mount } from './dom.js';

/**
 * Feedback for `intervalIdWanted` in `presentation`; the level is chosen so that item exists
 * (levels are presentation tiers, D-013). `answer: 'wrong'` picks a different option.
 */
async function feedbackFor(intervalIdWanted, presentation = 'asc', levelNo = presentation === 'desc' ? 8 : 5, answer = 'right') {
  const h = harness({ trackId: 'intervals', levelNo, seed: 12 });
  const s = h.newSession({});
  const wanted = `interval:${intervalIdWanted}:${presentation}`;
  await s.start(); let guard = 0;
  while (s.state.question.itemId !== wanted && guard++ < 800) await s.next();
  expect(s.state.question.itemId).toBe(wanted);
  const q = s.state.question;
  s.submit(answer === 'right' ? q.answer : q.options.find((o) => o !== q.answer));
  const root = mount(() => {});
  renderFeedback(root, { session: s, track: h.tracks.byId.intervals, settings: h.store.getState().settings, onNext: () => {} });
  return root;
}

const titlesIn = (panel) => [...panel.querySelectorAll('[data-role="anchor-list"] li strong')].map((s) => s.textContent);

describe('US-3.4 Anchor-song reference', () => {
  it('AC-3.4.1/1 — Up to five anchor songs for the correct interval are shown', async () => {
    const root = await feedbackFor('M6');
    const list = root.querySelectorAll('[data-role="anchor-list"] li');
    expect(list.length).toBeGreaterThan(0);
    expect(list.length).toBeLessThanOrEqual(5);
    expect(root.querySelector('[data-role="anchors"]').dataset.interval).toBe('M6');
    expect(titlesIn(root)).toEqual(anchors.M6.asc.map((a) => a.title));
    // and for a wrong answer, still the correct interval's anchors
    const h = harness({ trackId: 'intervals', levelNo: 1, seed: 1 });
    await h.session.start();
    const q = h.session.state.question; h.session.submit(q.options.find((o) => o !== q.answer));
    const r2 = mount(() => {}); renderFeedback(r2, { session: h.session, track: h.tracks.byId.intervals, settings: h.store.getState().settings, onNext: () => {} });
    expect(r2.querySelector('[data-anchor-role="correct"]').dataset.interval).toBe(q.answer);
  });
  it('AC-3.4.1/2 — Each anchor entry shows the song title and its lyric or motif cue', async () => {
    const root = await feedbackFor('P4');
    const items = [...root.querySelectorAll('[data-role="anchor-list"] li')];
    expect(items.length).toBeGreaterThan(0);
    for (const li of items) { expect(li.querySelector('strong').textContent.length).toBeGreaterThan(0); expect(li.querySelector('.cue').textContent.length).toBeGreaterThan(0); }
    expect(items.map((li) => li.querySelector('.cue').textContent)).toEqual(expect.arrayContaining(['"Here" → "comes"', 'the first two notes']));
  });
  it('AC-3.4.1/3 — The anchor list appears above the Next control', async () => {
    const root = await feedbackFor('P4');
    const panel = root.querySelector('[data-role="feedback"]');
    const kids = [...panel.children];
    const anchorsAt = kids.indexOf(root.querySelector('[data-role="anchors"]'));
    const nextAt = kids.indexOf(root.querySelector('[data-action="next"]'));
    expect(anchorsAt).toBeGreaterThan(-1);
    expect(nextAt).toBeGreaterThan(-1);
    expect(anchorsAt).toBeLessThan(nextAt);
  });
  it('AC-3.4.2/1 — An ascending question shows only ascending anchors', async () => {
    const root = await feedbackFor('m3', 'asc');
    expect(root.querySelector('[data-role="anchors"]').dataset.direction).toBe('asc');
    expect(titlesIn(root)).toEqual(anchors.m3.asc.map((a) => a.title));
    // the descending-only anchor never appears on an ascending question
    const cues = [...root.querySelectorAll('.cue')].map((c) => c.textContent);
    expect(cues).toContain('"don\'t" → "make"');
    expect(cues).not.toContain('"Hey" → "Jude"');
    expect([...root.querySelectorAll('[data-role="anchor-list"] li')].map((li) => li.dataset.direction)).toEqual(anchors.m3.asc.map(() => 'asc'));
  });
  it('AC-3.4.2/2 — A descending question shows only descending anchors', async () => {
    const root = await feedbackFor('m3', 'desc');
    expect(root.querySelector('[data-role="anchors"]').dataset.direction).toBe('desc');
    expect(titlesIn(root)).toEqual(anchors.m3.desc.map((a) => a.title));
    const cues = [...root.querySelectorAll('.cue')].map((c) => c.textContent);
    expect(cues).toContain('"Hey" → "Jude"');
    expect(cues).not.toContain('"don\'t" → "make"');
    expect(anchorsFor('m3', 'desc').simple.every((a) => anchors.m3.desc.includes(a))).toBe(true);
  });
  it('AC-3.4.2/3 — Each anchor entry states its direction in words', async () => {
    const asc = await feedbackFor('m3', 'asc');
    for (const li of asc.querySelectorAll('[data-role="anchor-list"] li')) expect(li.querySelector('.direction').textContent).toContain('ascending');
    const desc = await feedbackFor('m3', 'desc');
    for (const li of desc.querySelectorAll('[data-role="anchor-list"] li')) expect(li.querySelector('.direction').textContent).toContain('descending');
  });
  it('AC-3.4.4/1 — Compound feedback shows the octave plus simple interval decomposition with the simple anchors', async () => {
    const root = await feedbackFor('M9', 'asc', 14);
    expect(root.querySelector('[data-role="anchors-title"]').textContent).toBe('major 9th = octave + major 2nd');
    expect(root.querySelector('[data-role="decomposition"]').textContent).toMatch(/octave plus a major 2nd/);
    expect(titlesIn(root).sort()).toEqual(anchors.M2.asc.map((a) => a.title).sort());
  });
  it('AC-3.4.4/2 — Compound feedback shows any known compound-specific examples', async () => {
    const root = await feedbackFor('M9', 'asc', 14);
    const ex = [...root.querySelectorAll('[data-role="compound-examples"] li strong')].map((s) => s.textContent);
    expect(ex).toEqual(anchors.M9.examples.map((a) => a.title));
    expect(ex.length).toBeGreaterThan(0);
  });
  it("AC-3.4.6/1 — A wrong answer shows both the correct and the chosen interval's anchors", async () => {
    const root = await feedbackFor('m3', 'asc', 5, 'wrong');
    const panels = root.querySelectorAll('[data-role="anchors"]');
    expect(panels.length).toBe(2);
    expect(panels[0].dataset.anchorRole).toBe('correct');
    expect(panels[0].dataset.interval).toBe('m3');
    expect(panels[1].dataset.anchorRole).toBe('chosen');
    expect(panels[1].dataset.interval).not.toBe('m3');
    // the chosen panel carries that interval's own songs, in the same direction
    expect(panels[1].dataset.direction).toBe('asc');
    expect(titlesIn(panels[1])).toEqual(anchors[panels[1].dataset.interval].asc.map((a) => a.title));
  });
  it('AC-3.4.6/2 — Each of the two anchor sets is labelled with its interval', async () => {
    const root = await feedbackFor('m3', 'asc', 5, 'wrong');
    const [correct, chosen] = root.querySelectorAll('[data-role="anchors"] [data-role="anchors-title"]');
    expect(correct.textContent).toContain('minor 3rd');
    expect(correct.textContent).toContain('ascending');
    expect(chosen.textContent).toMatch(/^You chose — /);
    expect(chosen.textContent).toContain('ascending');
  });
  it("AC-3.4.6/3 — A correct answer shows only the correct interval's anchors", async () => {
    const root = await feedbackFor('m3', 'asc');
    expect(root.querySelectorAll('[data-role="anchors"]').length).toBe(1);
    expect(root.querySelector('[data-anchor-role="chosen"]')).toBeNull();
  });
  it('renderAnchors handles a simple interval directly', () => {
    const root = mount(() => {}); renderAnchors(root, { intervalId: 'TT', direction: 'asc' });
    expect(root.querySelectorAll('li').length).toBe(anchors.TT.asc.length);
  });
});

// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { harness } from '../helpers/harness.js';
import { mount } from './dom.js';

async function submitThreeOfFour() {
  const h = harness({ trackId: 'progressions', levelNo: 2, seed: 2 });
  const root = mount(() => {});
  renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} });
  await h.session.start(); let guard = 0;
  while (h.session.state.question.answer.length !== 4 && guard++ < 200) await h.session.next();
  const target = h.session.state.question.answer; expect(target.length).toBe(4);
  const given = target.map((n, i) => (i === 3 ? (n === 'I' ? 'IV' : 'I') : n));
  h.session.submit(given);
  return { h, root };
}

describe('US-8.3 — comparison', () => {
  it('AC-8.3.3/1 — Each chord position is marked correct or incorrect', async () => {
    const { root } = await submitThreeOfFour();
    const toks = [...root.querySelectorAll('[data-role="comparison"] .tok')];
    expect(toks.length).toBe(4);
    expect(toks.map((t) => t.dataset.correct)).toEqual(['true', 'true', 'true', 'false']);
  });
  it('AC-8.3.3/2 — A 4-chord answer with 3 correct positions scores 3/4', async () => {
    const { h, root } = await submitThreeOfFour();
    expect(root.querySelector('[data-role="partial-score"]').textContent).toBe('Score 3/4');
    expect(h.session.state.result.baseScore).toBe(0.75);
  });
});

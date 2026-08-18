// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { harness } from '../helpers/harness.js';
import { mount } from './dom.js';

async function submitSixOfEight() {
  const h = harness({ trackId: 'melodic', levelNo: 3, seed: 3 });
  const root = mount(() => {});
  renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} });
  await h.session.start();
  const target = h.session.state.question.answer; expect(target.length).toBe(8);
  const given = target.map((d, i) => (i === 2 || i === 6 ? (d === '1' ? '2' : '1') : d));
  h.session.submit(given);
  return { h, root, target, given };
}

describe('US-7.2 — comparison', () => {
  it('AC-7.2.3/1 — The comparison view marks each sequence position correct or incorrect', async () => {
    const { root } = await submitSixOfEight();
    const toks = [...root.querySelectorAll('[data-role="comparison"] .tok')];
    expect(toks.length).toBe(8);
    expect(toks.map((t) => t.dataset.correct)).toEqual(['true', 'true', 'false', 'true', 'true', 'true', 'false', 'true']);
    expect(toks[2].classList.contains('bad')).toBe(true); expect(toks[0].classList.contains('ok')).toBe(true);
  });
  it('AC-7.2.3/2 — A sequence with 6 of 8 matching positions scores 6/8', async () => {
    const { h, root } = await submitSixOfEight();
    expect(root.querySelector('[data-role="partial-score"]').textContent).toBe('Score 6/8');
    expect(h.session.state.result.baseScore).toBe(0.75);
    expect(h.session.state.result.correct).toBe(false);
  });
});

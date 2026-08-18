// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderSequenceInput, createSequenceModel } from '../../../src/ui/sequenceInput.js';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { harness } from '../helpers/harness.js';
import { mount, tap } from './dom.js';

function inputHarness() {
  const model = createSequenceModel();
  const root = mount(() => {});
  let submitted = null;
  renderSequenceInput(root, { options: ['1', '2', '3', '4', '5', '6', '7', '8'], labelFor: (x) => `D${x}`, model, onSubmit: (v) => { submitted = v; } });
  const seq = () => [...root.querySelectorAll('[data-role="sequence"] .tok[data-index]')].map((t) => t.textContent);
  return { root, model, seq, submitted: () => submitted, opt: (x) => root.querySelector(`[data-option="${x}"]`), action: (a) => root.querySelector(`[data-action="${a}"]`) };
}

describe('US-7.2 Sequence answer input', () => {
  it('AC-7.2.1 — Tapping a degree appends to the visible answer sequence', async () => {
    const h = harness({ trackId: 'melodic', levelNo: 3, seed: 3 });
    const root = mount(() => {});
    renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} });
    await h.session.start();
    expect(h.session.state.question.answer.length).toBe(8);
    const seqEl = () => [...root.querySelectorAll('[data-role="sequence"] .tok[data-index]')].map((t) => t.textContent);
    expect(seqEl()).toEqual([]);
    tap(root.querySelector('[data-option="1"]')); tap(root.querySelector('[data-option="3"]')); tap(root.querySelector('[data-option="5"]'));
    expect(seqEl()).toEqual(['Do · 1', 'Mi · 3', 'Sol · 5']);
    tap(root.querySelector('[data-option="8"]'));
    expect(seqEl().length).toBe(4); expect(seqEl()[3]).toBe('Do′ · 8');
  });
  it('AC-7.2.2/1 — Delete-last removes the final entry of the sequence', () => {
    const t = inputHarness();
    tap(t.opt('1')); tap(t.opt('2')); tap(t.opt('3'));
    tap(t.action('delete-last'));
    expect(t.seq()).toEqual(['D1', 'D2']); expect(t.model.value).toEqual(['1', '2']);
    tap(t.action('delete-last')); tap(t.action('delete-last')); tap(t.action('delete-last'));
    expect(t.seq()).toEqual([]);
  });
  it('AC-7.2.2/2 — Clear-all empties the sequence', () => {
    const t = inputHarness();
    tap(t.opt('5')); tap(t.opt('6')); tap(t.opt('7'));
    tap(t.action('clear-all'));
    expect(t.seq()).toEqual([]); expect(t.model.value).toEqual([]);
    expect(t.action('submit').disabled).toBe(true);
  });
  it('AC-7.2.2/3 — Insert-at-cursor places a new entry at the cursor position', () => {
    const t = inputHarness();
    tap(t.opt('1')); tap(t.opt('3')); tap(t.opt('5'));
    // place the cursor before the second token, then tap a degree
    tap(t.root.querySelector('[data-role="sequence"] .tok[data-index="1"]'));
    expect(t.model.cursor).toBe(1);
    tap(t.opt('2'));
    expect(t.seq()).toEqual(['D1', 'D2', 'D3', 'D5']);
    tap(t.opt('4'));
    expect(t.seq()).toEqual(['D1', 'D2', 'D4', 'D3', 'D5']);
    // submit carries the edited sequence
    tap(t.action('submit'));
    expect(t.submitted()).toEqual(['1', '2', '4', '3', '5']);
  });
});

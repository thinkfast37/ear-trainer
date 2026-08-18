/**
 * Sequence answer input (US-7.2, US-8.3): tap appends at the cursor, delete-last, clear-all,
 * insert-at-cursor (tap a token to place the cursor before it), submit.
 */
import { h, replace } from './dom.js';

export function createSequenceModel(target = []) {
  const m = { seq: [], cursor: null }; // cursor === null → append at end
  return {
    get value() { return m.seq.slice(); },
    get cursor() { return m.cursor; },
    add(tok) { if (m.cursor === null) m.seq.push(tok); else { m.seq.splice(m.cursor, 0, tok); m.cursor++; } return this; },
    deleteLast() { m.seq.pop(); if (m.cursor !== null && m.cursor > m.seq.length) m.cursor = null; return this; },
    clear() { m.seq = []; m.cursor = null; return this; },
    setCursor(i) { m.cursor = i === null || i >= m.seq.length ? null : i; return this; },
    length() { return m.seq.length; },
    target,
  };
}

export function renderSequenceInput(container, { options, labelFor, model, onSubmit, disabled = false, prompt = null, expectedLength = null }) {
  const view = h('div', { class: 'stack sequence-input' });
  const seq = h('div', { class: 'seq', 'data-role': 'sequence', 'aria-label': 'Your answer' });
  const grid = h('div', { class: 'grid', 'data-role': 'options' });
  const controls = h('div', { class: 'row' });
  const submit = h('button', { class: 'btn primary', 'data-action': 'submit', disabled }, 'Submit');

  const draw = () => {
    const toks = model.value.map((t, i) => h('button', { class: `tok btn${model.cursor === i ? ' cursor' : ''}`, 'data-index': i, onClick: () => { model.setCursor(model.cursor === i ? null : i); draw(); } }, labelFor(t)));
    replace(seq, toks.length ? toks : h('span', { class: 'muted' }, expectedLength ? `Tap ${expectedLength} answers` : 'Tap to build your answer'));
    if (model.cursor === null) seq.append(h('span', { class: 'tok cursor', 'data-role': 'end-cursor', 'aria-hidden': 'true' }, '▏'));
    submit.disabled = disabled || model.length() === 0;
  };
  for (const id of options) grid.append(h('button', { class: 'btn', 'data-option': id, disabled, onClick: () => { model.add(id); draw(); } }, labelFor(id)));
  controls.append(
    h('button', { class: 'btn', 'data-action': 'delete-last', disabled, onClick: () => { model.deleteLast(); draw(); } }, 'Delete last'),
    h('button', { class: 'btn', 'data-action': 'clear-all', disabled, onClick: () => { model.clear(); draw(); } }, 'Clear all'),
    submit,
  );
  submit.addEventListener('click', () => onSubmit(model.value));
  if (prompt) view.append(h('div', { class: 'muted', 'data-role': 'step-prompt' }, prompt));
  view.append(seq, grid, controls);
  draw();
  container.append(view);
  return { view, redraw: draw };
}

/** Position-by-position comparison view (AC-7.2.3/1, AC-8.3.3/1). */
export function renderComparison(container, { positions, labelFor, score }) {
  const wrap = h('div', { class: 'stack comparison', 'data-role': 'comparison' });
  const row = h('div', { class: 'seq' });
  positions.forEach((p) => row.append(h('span', { class: `tok ${p.correct ? 'ok' : 'bad'}`, 'data-index': p.index, 'data-correct': String(p.correct) },
    p.given === null ? '—' : labelFor(p.given), p.correct ? '' : h('span', { class: 'muted' }, ` → ${p.expected === null ? '—' : labelFor(p.expected)}`))));
  wrap.append(row, h('div', { 'data-role': 'partial-score' }, `Score ${score.matches}/${score.total}`));
  container.append(wrap);
  return wrap;
}

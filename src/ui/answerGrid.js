/** Answer buttons scoped to the question's options, ≥ 44 px, labels per settings. */
import { h } from './dom.js';

export function renderAnswerGrid(container, { question, track, settings, onAnswer, disabled = false, selected = null, marks = null }) {
  const grid = h('div', { class: 'grid answer-grid', role: 'group', 'aria-label': 'Answer options' });
  const opts = question.kind === 'qualityInversion' ? question.options : question.options;
  for (const id of opts) {
    const cls = ['btn', 'answer'];
    if (selected === id) cls.push('selected');
    if (marks?.correct === id) cls.push('correct');
    if (marks?.incorrect === id) cls.push('incorrect');
    grid.append(h('button', { class: cls.join(' '), 'data-option': id, disabled, onClick: () => onAnswer(id) }, track.optionLabel(id, settings)));
  }
  container.append(grid);
  return grid;
}

/** Combined answer for inversion level 3: pick a quality and an inversion, then submit. */
export function renderCombinedGrid(container, { question, track, settings, onAnswer, disabled = false }) {
  let quality = null, inversion = null;
  const wrap = h('div', { class: 'stack combined' });
  const qRow = h('div', { class: 'grid', 'data-part': 'quality' });
  const iRow = h('div', { class: 'grid', 'data-part': 'inversion' });
  const submit = h('button', { class: 'btn primary', 'data-action': 'submit-combined', disabled: true }, 'Answer');
  const refresh = () => {
    for (const b of qRow.querySelectorAll('button')) b.classList.toggle('selected', b.dataset.quality === quality);
    for (const b of iRow.querySelectorAll('button')) b.classList.toggle('selected', b.dataset.inversion === inversion);
    submit.disabled = disabled || !(quality && inversion);
  };
  for (const q of question.meta.qualities) qRow.append(h('button', { class: 'btn', 'data-quality': q, disabled, onClick: () => { quality = q; refresh(); } }, track.optionLabel(`${q}:inv0`, settings).split(' · ')[0]));
  for (const i of question.meta.inversions) iRow.append(h('button', { class: 'btn', 'data-inversion': `inv${i}`, disabled, onClick: () => { inversion = `inv${i}`; refresh(); } }, track.optionLabel(`inv${i}`, settings)));
  submit.addEventListener('click', () => onAnswer(`${quality}:${inversion}`));
  wrap.append(h('div', { class: 'muted' }, 'Quality'), qRow, h('div', { class: 'muted' }, 'Inversion'), iRow, submit);
  container.append(wrap);
  return wrap;
}

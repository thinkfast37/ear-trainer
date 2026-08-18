/** Feedback panel (US-2.4): verdict, correct answer, comparison replay, stimulus replay, anchors, XP. */
import { h } from './dom.js';
import { renderComparison } from './sequenceInput.js';
import { renderAnchors } from './anchors.js';
import { parseItemId as parseIntervalItem } from '../tracks/intervals.js';

export function renderFeedback(container, { session, track, settings, onNext }) {
  const st = session.state;
  const q = st.question;
  const r = st.result;
  const labelFor = (id) => track.optionLabel(id, settings);
  const fmt = (a) => (Array.isArray(a) ? a.map(labelFor).join(' – ') : labelFor(a));
  const panel = h('section', { class: 'card stack feedback', 'data-role': 'feedback', 'data-correct': String(r.correct) });
  panel.append(h('div', { class: `verdict ${r.correct ? 'correct' : 'incorrect'}`, 'data-role': 'verdict', role: 'status' }, r.correct ? 'Correct!' : 'Not quite'));
  panel.append(h('div', { 'data-role': 'track-label-feedback', class: 'muted' }, `Track: ${r.trackLabel}`));
  panel.append(h('div', { 'data-role': 'correct-answer' }, 'Answer: ', h('strong', {}, fmt(r.correctAnswer)), r.name ? h('span', { 'data-role': 'progression-name' }, ` — ${r.name}`) : null));
  if (!r.correct && q.kind === 'single') panel.append(h('div', { 'data-role': 'chosen-answer', class: 'muted' }, `You chose: ${fmt(r.chosen)}`));
  if (r.positions) renderComparison(panel, { positions: r.positions, labelFor, score: { matches: r.positions.filter((p) => p.correct).length, total: r.positions.length } });
  if (r.steps?.length > 1) {
    panel.append(h('ul', { 'data-role': 'step-scores' }, r.steps.map((s) => h('li', { 'data-step': s.kind }, `${s.kind === 'bass' ? 'Bass degrees' : 'Roman numerals'}: ${s.matches}/${s.total}`))));
  }
  panel.append(h('div', { class: 'muted', 'data-role': 'xp-awarded' }, `+${r.xp} XP`));

  const controls = h('div', { class: 'row' });
  controls.append(h('button', { class: 'btn', 'data-action': 'replay-stimulus', onClick: () => session.replay() }, 'Replay'));
  if (!r.correct && q.kind === 'single' && track.exerciseFor) {
    const labels = h('div', { class: 'row', 'data-role': 'comparison-labels' });
    controls.append(h('button', { class: 'btn', 'data-action': 'compare', onClick: async () => {
      labels.replaceChildren(h('span', { class: 'tok ok', 'data-role': 'label-correct' }, `Correct: ${fmt(r.correctAnswer)}`), h('span', { class: 'tok bad', 'data-role': 'label-chosen' }, `Yours: ${fmt(r.chosen)}`));
      await session.playComparison();
    } }, 'Hear correct vs. yours'));
    panel.append(controls, labels);
  } else panel.append(controls);
  panel.append(h('button', { class: 'btn primary', 'data-action': 'next', onClick: onNext }, 'Next'));

  if (q.trackId === 'intervals') {
    const { intervalId, presentation } = parseIntervalItem(q.itemId);
    renderAnchors(panel, { intervalId, direction: presentation === 'desc' ? 'desc' : 'asc' });
  }
  container.append(panel);
  return panel;
}

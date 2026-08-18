/** Mastery celebration (AC-9.3.2): accuracy, time, weakest item conquered. */
import { h } from './dom.js';
import { rollingAccuracy } from '../learning/mastery.js';
import { accuracyOf } from '../learning/leitner.js';

export function celebrationStats(levelState, items, itemIds) {
  const history = [...levelState.history];
  const accuracy = rollingAccuracy(history, history.length || 1);
  const first = history[0]?.at ?? 0; const last = history[history.length - 1]?.at ?? first;
  let weakest = null;
  for (const id of itemIds) { const it = items[id]; if (!it) continue; if (!weakest || accuracyOf(it) < accuracyOf(weakest.it)) weakest = { id, it }; }
  return { accuracy, seconds: Math.round((last - first) / 1000), weakest: weakest?.id ?? null, weakestAccuracy: weakest ? accuracyOf(weakest.it) : null };
}

export function renderCelebration(container, { trackName, levelNo, stats, onContinue }) {
  const el = h('div', { class: 'card celebrate', 'data-role': 'celebration' },
    h('h2', {}, `🎉 Level ${levelNo} mastered!`),
    h('div', { class: 'muted' }, trackName),
    h('ul', { class: 'stack' },
      h('li', { 'data-stat': 'accuracy' }, `Accuracy ${Math.round(stats.accuracy * 100)}%`),
      h('li', { 'data-stat': 'time' }, `Time ${Math.floor(stats.seconds / 60)}m ${stats.seconds % 60}s`),
      h('li', { 'data-stat': 'weakest' }, stats.weakest ? `Weakest item conquered: ${stats.weakest} (${Math.round(stats.weakestAccuracy * 100)}%)` : 'Weakest item conquered: —'),
    ),
    h('button', { class: 'btn primary', 'data-action': 'continue', onClick: onContinue }, 'Continue'),
  );
  container.append(el);
  return el;
}

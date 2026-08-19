/**
 * Mastery celebration (AC-9.3.2): accuracy, time, weakest item conquered — and what comes next
 * (AC-2.6.2): the next level with its presentation, or "track complete" after the last level.
 */
import { h } from './dom.js';
import { levelTitle } from './labels.js';
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

/** Text for the "next" line: the next level's title, or that the track is complete (AC-2.6.2). */
export function nextLevelText(track, levelNo) {
  const next = track.def.levels.find((l) => l.no === levelNo + 1);
  return next ? `Next: ${levelTitle(next)} unlocked` : `${track.name} complete — every level mastered`;
}

export function renderCelebration(container, { trackName, levelNo, stats, onContinue, track = null }) {
  const el = h('div', { class: 'card celebrate', 'data-role': 'celebration' },
    h('h2', {}, `🎉 Level ${levelNo} mastered!`),
    h('div', { class: 'muted' }, trackName),
    track ? h('div', { 'data-role': 'next-level', 'data-last': String(!track.def.levels.some((l) => l.no === levelNo + 1)) }, nextLevelText(track, levelNo)) : null,
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

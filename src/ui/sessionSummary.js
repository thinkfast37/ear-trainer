/**
 * End-of-session summary (AC-2.6.3): what the session bought, where the level now stands, and
 * that none of it is lost. Ending a session used to navigate straight back to the menu, so a
 * learner who answered twenty questions and stopped had no way to tell whether stopping cost
 * them anything. It always was saved; nothing said so.
 */
import { h, replace } from './dom.js';
import { masteryProgressPanel } from './masteryProgress.js';

export function renderSessionSummary(container, { trackName, levelNo, presentation = null, questions, correct, evaluation, itemCount, onClose }) {
  const card = h('div', { class: 'card celebrate', 'data-role': 'session-summary', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Session summary' },
    h('h2', {}, 'Session saved'),
    h('div', { class: 'muted' }, `${trackName} — Level ${levelNo}${presentation ? ` — ${presentation}` : ''}`),
    h('div', { 'data-role': 'session-tally' }, `${questions} ${questions === 1 ? 'question' : 'questions'} answered, ${correct} correct`),
    h('div', { class: 'muted' }, 'Where this level stands:'),
    masteryProgressPanel({ evaluation, itemCount, presentation: null }),
    h('div', { 'data-role': 'saved-note' }, 'Your progress is saved. This level picks up exactly where you left off.'),
    h('div', { class: 'row modal-actions' },
      h('button', { class: 'btn primary', 'data-action': 'summary-close', onClick: onClose }, 'Return to menu'),
    ),
  );
  const overlay = h('div', { class: 'modal-overlay', 'data-role': 'session-summary-dialog' }, card);
  replace(container, overlay);
  return overlay;
}

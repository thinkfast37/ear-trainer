/**
 * The mastery conditions as a panel (AC-2.2.2/3, AC-2.6.1/5): all three, always, each with its
 * current value against its target and marked met or unmet. One renderer for the session header,
 * the level screen and the end-of-session summary — the same three numbers should never be
 * phrased three different ways depending on which screen is showing them.
 */
import { h } from './dom.js';
import { describeProgress } from '../learning/mastery.js';

/**
 * @param {object} opts
 * @param {object} opts.evaluation  the result of `mastery.evaluate`
 * @param {number} opts.itemCount   the level's Leitner item count
 * @param {string|null} opts.presentation  the level's presentation label, where it carries one
 * @param {boolean} opts.compact    inline (the session header) rather than a stacked list
 */
export function masteryProgressPanel({ evaluation, itemCount, presentation = null, compact = false }) {
  const conditions = describeProgress(evaluation, itemCount);
  const weak = itemCount - conditions.find((c) => c.id === 'boxes').value;
  return h('div', {
    class: compact ? 'mastery-progress compact' : 'mastery-progress',
    'data-role': compact ? 'mastery-meter' : 'mastery-progress',
    'data-weak': String(weak),
    'data-presentation': presentation ?? '',
  },
  presentation ? h('span', { class: 'muted', 'data-role': 'presentation' }, presentation) : null,
  ...conditions.map((c) => h('span', {
    class: 'condition',
    'data-condition': c.id,
    'data-met': String(c.met),
    // The tick is decoration beside the words, never the only thing that says "met" — the same
    // reason the traceability matrix never lets colour replace its text.
    'aria-label': `${c.label} ${c.text}, ${c.met ? 'met' : 'not yet met'}`,
  }, `${c.label} ${c.text}`, h('span', { class: 'mark', 'aria-hidden': 'true' }, c.met ? ' ✓' : ''))),
  );
}

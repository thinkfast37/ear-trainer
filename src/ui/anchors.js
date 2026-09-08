/** Anchor-song list for an interval (US-3.4). */
import { h } from './dom.js';
import anchors from '../data/anchors.json';
import { isCompound, simpleOf, intervalLabel } from '../theory/intervals.js';

const DIRECTION_WORD = { asc: 'ascending', desc: 'descending' };

/**
 * Anchors for one interval in one direction (AC-3.4.2). Only the asked direction is returned:
 * a mixed list let an ascending minor 3rd show *Hey Jude* cued at "Hey Jude", which is the
 * descending one (2026-09-08).
 */
export function anchorsFor(intervalId, direction = 'asc') {
  const entry = anchors[intervalId];
  if (!entry) return { simple: [], compound: null };
  if (entry.simple) {
    const simple = anchorsFor(entry.simple, direction).simple;
    return { simple, compound: { simpleId: entry.simple, examples: entry.examples } };
  }
  return { simple: (entry[direction] ?? []).slice(0, 5), compound: null };
}

/**
 * @param role 'correct' (the answer) or 'chosen' (what the learner picked, shown beside it on a
 *   wrong answer so the two references can be compared — AC-3.4.6).
 */
export function renderAnchors(container, { intervalId, direction = 'asc', role = 'correct' }) {
  const { simple, compound } = anchorsFor(intervalId, direction);
  const word = DIRECTION_WORD[direction] ?? direction;
  const wrap = h('section', {
    class: `card stack anchors anchors-${role}`,
    'data-role': 'anchors',
    'data-interval': intervalId,
    'data-direction': direction,
    'data-anchor-role': role,
  });
  const named = `${intervalLabel(intervalId, 'full')}, ${word}`;
  const title = isCompound(intervalId)
    ? `${intervalLabel(intervalId, 'full')} = octave + ${intervalLabel(simpleOf(intervalId), 'full')}`
    : role === 'chosen' ? `You chose — ${named}` : `Anchor songs — ${named}`;
  wrap.append(h('h3', { 'data-role': 'anchors-title' }, title));
  if (compound) wrap.append(h('div', { class: 'muted', 'data-role': 'decomposition' }, `Hear it as an octave plus a ${intervalLabel(compound.simpleId, 'full')}. Anchors for the ${intervalLabel(compound.simpleId)}:`));
  const list = h('ul', { class: 'anchor-list', 'data-role': 'anchor-list' });
  for (const a of simple) {
    list.append(h('li', { class: 'anchor', 'data-direction': direction },
      h('strong', {}, a.title),
      ' — ',
      h('span', { class: 'cue' }, a.cue),
      a.notes ? h('span', { class: 'muted notes' }, ` (${a.notes})`) : null,
      h('span', { class: 'muted direction' }, ` (${word})`),
    ));
  }
  wrap.append(list);
  if (compound?.examples?.length) {
    wrap.append(h('div', { class: 'muted' }, 'Compound examples:'));
    const cl = h('ul', { class: 'anchor-list', 'data-role': 'compound-examples' });
    for (const a of compound.examples) cl.append(h('li', { class: 'anchor compound-example' }, h('strong', {}, a.title), ' — ', a.cue));
    wrap.append(cl);
  }
  container.append(wrap);
  return wrap;
}

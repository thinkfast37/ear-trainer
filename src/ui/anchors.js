/** Anchor-song list for an interval (US-3.4). */
import { h } from './dom.js';
import anchors from '../data/anchors.json';
import { isCompound, simpleOf, intervalLabel } from '../theory/intervals.js';

export function anchorsFor(intervalId, direction = 'asc') {
  const entry = anchors[intervalId];
  if (!entry) return { simple: [], compound: null };
  if (Array.isArray(entry)) {
    const list = entry.slice(0, 5);
    // direction-aware ordering: matching direction first, marked
    const sorted = [...list.filter((a) => a.direction === direction), ...list.filter((a) => a.direction !== direction)];
    return { simple: sorted, compound: null };
  }
  const simple = anchorsFor(entry.simple, direction).simple;
  return { simple, compound: { simpleId: entry.simple, examples: entry.examples } };
}

export function renderAnchors(container, { intervalId, direction = 'asc' }) {
  const { simple, compound } = anchorsFor(intervalId, direction);
  const wrap = h('section', { class: 'card stack anchors', 'data-role': 'anchors', 'data-interval': intervalId });
  const title = isCompound(intervalId)
    ? `${intervalLabel(intervalId, 'full')} = octave + ${intervalLabel(simpleOf(intervalId), 'full')}`
    : `Anchor songs — ${intervalLabel(intervalId, 'full')}`;
  wrap.append(h('h3', { 'data-role': 'anchors-title' }, title));
  if (compound) wrap.append(h('div', { class: 'muted', 'data-role': 'decomposition' }, `Hear it as an octave plus a ${intervalLabel(compound.simpleId, 'full')}. Anchors for the ${intervalLabel(compound.simpleId)}:`));
  const list = h('ul', { class: 'anchor-list', 'data-role': 'anchor-list' });
  for (const a of simple) list.append(h('li', { class: 'anchor', 'data-direction': a.direction }, h('strong', {}, a.title), ' — ', h('span', { class: 'cue' }, a.cue), a.direction === 'desc' ? h('span', { class: 'muted direction' }, ' (descending)') : h('span', { class: 'muted direction' }, ' (ascending)')));
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

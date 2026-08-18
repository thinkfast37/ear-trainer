/** Credits view (AC-10.4.3, Constitution X). */
import { h, replace } from './dom.js';
import credits from '../data/credits.json';

export function renderCredits(container, { go }) {
  const wrap = h('div', { class: 'stack credits', 'data-role': 'credits' });
  wrap.append(h('div', { class: 'row' }, h('button', { class: 'btn ghost', onClick: () => go('/settings') }, '← Back'), h('h2', {}, 'Credits')));
  wrap.append(h('ul', { class: 'stack' }, credits.map((c) => h('li', { class: 'card', 'data-asset': c.asset },
    h('strong', {}, c.asset), h('div', {}, `By ${c.author}`), h('div', { class: 'muted' }, h('a', { href: c.source, target: '_blank', rel: 'noopener' }, c.source)), h('div', { 'data-role': 'licence' }, `Licence: ${c.licence}`)))));
  replace(container, wrap);
  return wrap;
}

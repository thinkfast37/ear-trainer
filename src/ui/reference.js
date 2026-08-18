/** Browsable interval reference (AC-3.4.3): every interval in the level with its anchors, no session. */
import { h, replace } from './dom.js';
import { renderAnchors } from './anchors.js';
import { intervalLabel } from '../theory/intervals.js';

export function renderReference(container, { tracks, trackId, levelNo, go }) {
  const track = tracks.byId[trackId];
  const level = track.def.levels.find((l) => l.no === Number(levelNo));
  const wrap = h('div', { class: 'stack reference', 'data-role': 'reference', 'data-level': levelNo });
  wrap.append(h('div', { class: 'row' }, h('button', { class: 'btn ghost', onClick: () => go(`/level/${trackId}/${levelNo}`) }, '← Back'), h('h2', {}, `Reference — Level ${levelNo}`)));
  for (const iv of level.pool) {
    const sec = h('section', { class: 'stack', 'data-interval': iv });
    sec.append(h('h3', {}, intervalLabel(iv, 'full')));
    renderAnchors(sec, { intervalId: iv, direction: 'asc' });
    wrap.append(sec);
  }
  replace(container, wrap);
  return wrap;
}

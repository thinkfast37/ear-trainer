/** Home map (US-9.1, US-2.3, US-6.1, US-8.1): tracks × level nodes with states, dependency lines, lock conditions. */
import { h, svg, replace } from './dom.js';
import { levelNodeState, levelUnlockCondition, trackUnlocked, prerequisiteStatus } from '../learning/unlocks.js';
import { mixedReviewAvailable, mixedReviewCondition } from '../learning/mixedReview.js';
import { currentStreak } from '../learning/streak.js';
import { TRACK_ORDER } from '../tracks/index.js';

/** Dependency lines: (fromTrack, fromLevel) → toTrack, drawn from the data's prerequisites. */
export function dependencyEdges(defs) {
  const edges = [];
  for (const t of Object.values(defs)) for (const p of t.prerequisites ?? []) edges.push({ from: p.track, fromLevel: p.level, to: t.id });
  return edges;
}

export function renderHomeMap(container, { store, tracks, go, now = () => Date.now(), onLocked }) {
  const progress = store.getState();
  const defs = tracks.defs;
  const wrap = h('div', { class: 'stack home' });
  const streak = currentStreak(progress, now());
  wrap.append(h('div', { class: 'row card', 'data-role': 'summary' },
    h('span', { 'data-role': 'streak' }, `🔥 Streak ${streak}`),
    h('span', { 'data-role': 'xp' }, `✨ XP ${progress.xp}`),
  ));

  const map = h('div', { class: 'map', 'data-role': 'map' });
  const nodeEls = {};
  for (const tid of TRACK_ORDER) {
    const track = tracks.byId[tid];
    const def = defs[tid];
    const unlocked = trackUnlocked(def, progress, defs);
    const sec = h('section', { class: 'track card', 'data-track': tid, 'data-unlocked': String(unlocked) });
    sec.append(h('h2', {}, track.name));
    if (!unlocked) {
      const prereqs = prerequisiteStatus(def, progress, defs);
      sec.append(h('div', { class: 'muted lock', 'data-role': 'lock-message' }, `Master ${prereqs.map((p) => `${p.trackName} Level ${p.level}`).join(' and ')} to unlock`));
      sec.append(h('ul', { class: 'prereqs', 'data-role': 'prerequisites' }, prereqs.map((p) => h('li', { 'data-prereq': `${p.track}:${p.level}`, 'data-met': String(p.met) }, `${p.trackName} Level ${p.level}: ${p.met ? 'mastered ✓' : 'not yet'}`))));
    }
    const nodes = h('div', { class: 'nodes' });
    for (const lvl of def.levels) {
      const state = levelNodeState(progress, def, lvl.no, defs);
      const btn = h('button', { class: 'node btn', 'data-level': lvl.no, 'data-state': state, 'aria-label': `${track.name} level ${lvl.no}: ${state}`, onClick: () => {
        if (state === 'locked') onLocked?.(levelUnlockCondition(progress, def, lvl.no, defs), sec);
        else go(`/level/${tid}/${lvl.no}`);
      } }, String(lvl.no));
      nodes.append(btn);
      nodeEls[`${tid}:${lvl.no}`] = btn;
    }
    sec.append(nodes);
    map.append(sec);
  }
  // Mixed review node
  const mixedOk = mixedReviewAvailable(progress);
  const mixed = h('section', { class: 'track card', 'data-track': 'mixed', 'data-unlocked': String(mixedOk) },
    h('h2', {}, 'Mixed Review'),
    mixedOk ? h('button', { class: 'btn primary', 'data-action': 'start-mixed', onClick: () => go('/session/mixed') }, 'Start Mixed Review')
      : h('div', { class: 'muted lock', 'data-role': 'lock-message' }, mixedReviewCondition()),
    h('div', { class: 'muted' }, mixedOk ? 'Draws from every level you have mastered.' : ''),
  );
  map.append(mixed);
  wrap.append(map);
  replace(container, wrap);

  // dependency lines drawn once layout is known
  const overlay = svg('svg', { class: 'deps', 'data-role': 'dependency-lines' });
  map.append(overlay);
  const drawLines = () => {
    while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
    const mr = map.getBoundingClientRect();
    for (const e of dependencyEdges(defs)) {
      const from = nodeEls[`${e.from}:${e.fromLevel}`];
      const toSec = map.querySelector(`[data-track="${e.to}"] h2`);
      if (!from || !toSec) continue;
      const a = from.getBoundingClientRect(); const b = toSec.getBoundingClientRect();
      overlay.append(svg('line', { 'data-from': `${e.from}:${e.fromLevel}`, 'data-to': e.to, x1: a.left - mr.left + a.width / 2, y1: a.top - mr.top + a.height / 2, x2: b.left - mr.left, y2: b.top - mr.top + b.height / 2 }));
    }
    overlay.setAttribute('width', mr.width); overlay.setAttribute('height', mr.height);
  };
  drawLines();
  return { wrap, drawLines };
}

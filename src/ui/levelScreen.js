/** Level screen (US-2.2, US-3.4, US-8.4): status, unmet mastery conditions, sub-stage, start, reference. */
import { h, replace } from './dom.js';
import { getLevelState, evaluate, describeUnmet } from '../learning/mastery.js';
import { currentSubStage, isSubStageUnlocked, subStageState, evaluateSubStage } from '../learning/subStages.js';
import { subStageLabel } from './labels.js';
import { renderGuidance, helpButton, guidanceDismissed } from './guidance.js';

export function renderLevelScreen(container, { store, tracks, trackId, levelNo, go, session: sessionOpts = {} }) {
  const progress = store.getState();
  const track = tracks.byId[trackId];
  const def = track.def;
  const level = def.levels.find((l) => l.no === Number(levelNo));
  const ls = getLevelState(progress, trackId, Number(levelNo));
  const sub = currentSubStage(ls, def.subStages);
  const itemIds = track.itemsFor(Number(levelNo), sub ?? undefined);
  const ev = sub ? evaluateSubStage(ls, sub, progress.items, itemIds) : evaluate(ls.history, progress.items, itemIds);
  const wrap = h('div', { class: 'stack level-screen', 'data-track': trackId, 'data-level': levelNo });
  wrap.append(h('h2', {}, `${track.name} — Level ${levelNo}`));
  wrap.append(h('div', { class: 'card', 'data-role': 'mastery-status', 'data-mastered': String(ls.mastered) },
    h('div', { class: 'verdict' }, ls.mastered ? 'Mastered ✓' : 'Not yet mastered'),
    ls.mastered ? h('div', { class: 'muted' }, 'You can keep reviewing this level; boxes still move.') :
      h('ul', { 'data-role': 'unmet' }, describeUnmet(ev.unmet, ev).map((t) => h('li', { class: 'unmet' }, `To master: ${t}`))),
  ));
  if (def.subStages.length) {
    const row = h('div', { class: 'row', 'data-role': 'substages' });
    for (const s of def.subStages) {
      const unlocked = isSubStageUnlocked(ls, def.subStages, s);
      const st = subStageState(ls, s);
      row.append(h('span', { class: `btn ghost${s === sub ? ' selected' : ''}`, 'data-substage': s, 'data-unlocked': String(unlocked), 'data-mastered': String(st.mastered) }, `${subStageLabel(s)}${st.mastered ? ' ✓' : unlocked ? '' : ' 🔒'}`));
    }
    wrap.append(row);
  }
  const startRow = h('div', { class: 'row' });
  let bassFirst = sessionOpts.bassFirst ?? false;
  if (trackId === 'progressions') {
    if (level.bassFirst) {
      const cb = h('input', { type: 'checkbox', id: 'bass-first', 'data-role': 'bass-first-toggle', checked: bassFirst, onChange: (e) => { bassFirst = e.target.checked; } });
      startRow.append(h('label', { class: 'row', for: 'bass-first' }, cb, ' Bass-first mode'));
    } else {
      startRow.append(h('span', { class: 'muted', 'data-role': 'bass-first-unavailable' }, 'Bass-first mode is available from Level 2'));
    }
  }
  startRow.append(h('button', { class: 'btn primary', 'data-action': 'start-session', onClick: () => go(`/session/${trackId}/${levelNo}${bassFirst ? '?bassFirst=1' : ''}`) }, 'Start'));
  if (trackId === 'intervals') startRow.append(h('button', { class: 'btn', 'data-action': 'open-reference', onClick: () => go(`/reference/${trackId}/${levelNo}`) }, 'Reference'));
  const guidanceArea = h('div', { 'data-role': 'guidance-area' });
  const help = helpButton({ store, trackId, container: guidanceArea });
  if (help) startRow.append(help);
  wrap.append(startRow, guidanceArea);
  // First open of a track with guidance shows it automatically until dismissed (AC-4.5.1, AC-4.5.2).
  if (help && !guidanceDismissed(progress, trackId)) renderGuidance(guidanceArea, { store, trackId });
  replace(container, wrap);
  return wrap;
}

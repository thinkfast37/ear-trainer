/** Stats screens (US-9.4, US-7.3): weakest items, per-track detail, item confusion detail, trend, sessions. */
import { h, replace } from './dom.js';
import { itemStats, weakestItems, confusionDetail, accuracyTrend, daysOfHistory, sessionSummary } from '../learning/stats.js';
import { TRACK_ORDER } from '../tracks/index.js';

const PREFIX = { intervals: 'interval:', scaleDegrees: 'degree:', chordQualities: 'chord:', inversions: 'inv:', melodic: 'melodic:', progressions: 'prog:' };

export function renderStats(container, { store, tracks, go, params = {} }) {
  const p = store.getState();
  const wrap = h('div', { class: 'stack stats', 'data-role': 'stats' });
  if (params.item) {
    const det = confusionDetail(p.items, params.item);
    const it = p.items[params.item];
    wrap.append(h('div', { class: 'row' }, h('button', { class: 'btn ghost', onClick: () => go(`/stats?track=${params.track ?? ''}`) }, '← Back'), h('h2', {}, params.item)));
    wrap.append(h('div', { class: 'card', 'data-role': 'item-detail' }, it ? `Accuracy ${Math.round((it.correct / (it.attempts || 1)) * 100)}% · ${it.attempts} attempts · box ${it.box}` : 'No attempts yet'));
    wrap.append(h('h3', {}, 'Most frequent wrong answers'));
    wrap.append(h('ul', { 'data-role': 'confusions' }, det.length ? det.map((d) => h('li', { 'data-answer': d.answer }, `${d.answer} × ${d.count}`)) : h('li', { class: 'muted' }, 'None')));
    replace(container, wrap);
    return wrap;
  }
  if (params.track) {
    const track = tracks.byId[params.track];
    const rows = itemStats(p.items, PREFIX[params.track]).sort((a, b) => a.accuracy - b.accuracy);
    wrap.append(h('div', { class: 'row' }, h('button', { class: 'btn ghost', onClick: () => go('/stats') }, '← Back'), h('h2', {}, `${track.name} — items`)));
    const trend = accuracyTrend(p, params.track);
    if (daysOfHistory(p) >= 7 && trend.length) {
      wrap.append(h('div', { class: 'card', 'data-role': 'trend' }, h('div', { class: 'muted' }, 'Accuracy trend'), h('div', { class: 'trend' }, trend.slice(-30).map((t) => h('div', { class: 'bar', title: `${t.day}: ${Math.round(t.accuracy * 100)}%`, 'data-day': t.day, style: { height: `${Math.max(4, t.accuracy * 100)}%` } })))));
    }
    const table = h('table', { 'data-role': 'item-table' }, h('thead', {}, h('tr', {}, h('th', {}, 'Item'), h('th', {}, 'Accuracy'), h('th', {}, 'Attempts'), h('th', {}, 'Box'))));
    const tb = h('tbody');
    for (const r of rows) tb.append(h('tr', { 'data-item': r.id, onClick: () => go(`/stats?track=${params.track}&item=${encodeURIComponent(r.id)}`) }, h('td', {}, r.id), h('td', { 'data-col': 'accuracy' }, `${Math.round(r.accuracy * 100)}%`), h('td', { 'data-col': 'attempts' }, r.attempts), h('td', { 'data-col': 'box' }, r.box)));
    table.append(tb);
    wrap.append(rows.length ? table : h('div', { class: 'muted' }, 'No items practised yet.'));
    replace(container, wrap);
    return wrap;
  }
  wrap.append(h('h2', {}, 'Stats'));
  const weakest = weakestItems(p.items);
  wrap.append(h('section', { class: 'card stack', 'data-role': 'weakest' }, h('h3', {}, 'Weakest items'),
    weakest.length ? h('ol', {}, weakest.map((w) => h('li', { 'data-item': w.id }, `${w.id} — ${Math.round(w.accuracy * 100)}% (${w.attempts})`))) : h('div', { class: 'muted' }, 'Answer at least 5 questions on an item to see it here.')));
  wrap.append(h('section', { class: 'card stack' }, h('h3', {}, 'Tracks'), h('div', { class: 'row' }, TRACK_ORDER.map((tid) => h('button', { class: 'btn', 'data-track-detail': tid, onClick: () => go(`/stats?track=${tid}`) }, tracks.byId[tid].name)))));
  const last = p.sessions.slice(-5).reverse();
  wrap.append(h('section', { class: 'card stack', 'data-role': 'sessions' }, h('h3', {}, 'Recent sessions'),
    last.length ? h('ul', {}, last.map((s) => { const sm = sessionSummary(s); return h('li', { 'data-session': s.id }, `${s.mixed ? 'Mixed Review' : `${tracks.byId[s.trackId]?.name ?? s.trackId} L${s.levelNo}`}: ${sm.questions} questions, ${Math.round(sm.accuracy * 100)}%, `, h('span', { 'data-role': 'avg-replays' }, `avg replays ${sm.avgReplays.toFixed(1)}`)); })) : h('div', { class: 'muted' }, 'No sessions yet.')));
  replace(container, wrap);
  return wrap;
}

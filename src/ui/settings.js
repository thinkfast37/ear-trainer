/** Settings screen (US-10.4, US-10.3): every core preference, export/import, credits. */
import { h, replace } from './dom.js';
import { getSettings, setSetting } from '../app/settings.js';
import { exportProgress, exportFileName, parseImport, mergeProgress } from '../storage/exportImport.js';

export function renderSettings(container, { store, go, notifications = null, isNative = false, download = null }) {
  const s = getSettings(store.getState());
  const wrap = h('div', { class: 'stack settings', 'data-role': 'settings' });
  wrap.append(h('h2', {}, 'Settings'));
  const field = (label, control) => h('label', { class: 'field card' }, h('span', {}, label), control);
  const select = (name, value, options, onChange) => h('select', { name, 'data-setting': name, value, onChange: (e) => onChange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l)));
  const number = (name, value, min, max, onChange) => h('input', { type: 'number', name, 'data-setting': name, value, min, max, onChange: (e) => onChange(Number(e.target.value)) });

  wrap.append(field('Cadence frequency', select('cadenceFrequency', s.cadenceFrequency, [['everyQuestion', 'Every question'], ['firstOnly', 'First question only'], ['never', 'Never']], (v) => setSetting(store, 'cadenceFrequency', v))));
  wrap.append(field('Replay limit (melodic & progressions)', number('replayLimit', s.replayLimit, 0, 10, (v) => setSetting(store, 'replayLimit', v))));
  wrap.append(field('Arpeggiation tempo (BPM)', number('arpeggioTempo', s.arpeggioTempo, 40, 240, (v) => setSetting(store, 'arpeggioTempo', v))));
  wrap.append(field('Register range — lowest note (MIDI)', number('register.low', s.register.low, 36, 72, (v) => setSetting(store, 'register.low', v))));
  wrap.append(field('Register range — highest note (MIDI)', number('register.high', s.register.high, 48, 84, (v) => setSetting(store, 'register.high', v))));
  wrap.append(field('Scale degree labels', select('labels.degrees', s.labels.degrees, [['syllable', 'Solfège'], ['number', 'Numbers'], ['both', 'Both']], (v) => setSetting(store, 'labels.degrees', v))));
  wrap.append(field('Chord labels', select('labels.chords', s.labels.chords, [['symbol', 'Symbol'], ['name', 'Name'], ['symbolAndName', 'Symbol · name']], (v) => setSetting(store, 'labels.chords', v))));
  wrap.append(field('Interval labels', select('labels.intervals', s.labels.intervals, [['short', 'Short (m3)'], ['full', 'Full names (minor 3rd)']], (v) => setSetting(store, 'labels.intervals', v))));
  wrap.append(field('Session goal — minutes', number('sessionGoal.minutes', s.sessionGoal.minutes, 1, 120, (v) => setSetting(store, 'sessionGoal.minutes', v))));
  wrap.append(field('Session goal — questions', number('sessionGoal.questions', s.sessionGoal.questions, 1, 500, (v) => setSetting(store, 'sessionGoal.questions', v))));
  const notif = h('div', { class: 'card stack', 'data-role': 'notifications', 'data-available': String(isNative) },
    h('label', { class: 'row' }, h('input', { type: 'checkbox', name: 'notifications.enabled', 'data-setting': 'notifications.enabled', checked: s.notifications.enabled, disabled: !isNative, onChange: async (e) => { setSetting(store, 'notifications.enabled', e.target.checked); await notifications?.sync(getSettings(store.getState()).notifications); } }), ' Daily practice reminder', isNative ? '' : h('span', { class: 'muted' }, ' (mobile app only)')),
    h('label', { class: 'field' }, h('span', {}, 'Reminder hour'), number('notifications.hour', s.notifications.hour, 0, 23, async (v) => { setSetting(store, 'notifications.hour', v); await notifications?.sync(getSettings(store.getState()).notifications); })));
  wrap.append(notif);

  const status = h('div', { 'data-role': 'import-status', role: 'status' });
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', 'data-role': 'import-file', class: 'hidden' });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0]; if (!f) return;
    const text = await f.text();
    const r = importText(store, text);
    status.textContent = r.ok ? 'Import complete — progress merged.' : r.error;
    status.className = r.ok ? 'ok' : 'error';
  });
  wrap.append(h('div', { class: 'card row', 'data-role': 'export-import' },
    h('button', { class: 'btn', 'data-action': 'export', onClick: () => {
      const doc = store.getState();
      const text = exportProgress(doc);
      (download ?? defaultDownload)(exportFileName(), text);
      status.textContent = `Exported ${exportFileName()}`;
      status.className = 'ok';
    } }, 'Export progress'),
    h('button', { class: 'btn', 'data-action': 'import', onClick: () => fileInput.click() }, 'Import progress'),
    fileInput, status,
  ));
  wrap.append(h('div', { class: 'row' }, h('button', { class: 'btn ghost', 'data-action': 'credits', onClick: () => go('/credits') }, 'Credits & licences')));
  replace(container, wrap);
  return wrap;
}

export function importText(store, text) {
  const r = parseImport(text);
  if (!r.ok) return r;
  store.replace(mergeProgress(store.getState(), r.doc));
  return { ok: true };
}

function defaultDownload(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * First-open guidance for a track (US-4.5): a short, dismissible explanation of what the sounds
 * before the target are for. Dismissal is persisted per track in `progress.guidance`; a help
 * affordance reopens it on demand.
 */
import { h, replace } from './dom.js';

export const GUIDANCE = {
  scaleDegrees: {
    title: 'How Scale Degrees works',
    lines: [
      'The chords you hear first set the key. The last chord is home — that is Do.',
      'At the first levels the scale plays before the chords: every degree up from Do and back down, so you can hear where each one sits.',
      'Then one note plays. The question is which degree of the scale that final note is.',
      'Hear scale and Re-hear cadence are free — use them as often as you like. Replay repeats the note and counts as a replay.',
    ],
  },
};

/** The one-line order hint shown on early level-1 scale-degree questions (AC-4.5.3). */
export const ORDER_HINT = 'You will hear: scale → cadence → note';
/** Questions answered on the track after which the order hint stops (AC-4.5.3). */
export const ORDER_HINT_UNTIL = 5;

export function guidanceDismissed(progress, trackId) { return Boolean(progress.guidance?.[trackId]); }

export function dismissGuidance(store, trackId) {
  store.update((d) => { d.guidance = { ...(d.guidance ?? {}), [trackId]: true }; });
}

/** Questions answered on a track across all its levels (drives the order hint). */
export function questionsAnsweredOnTrack(progress, trackId) {
  let n = 0;
  for (const [key, ls] of Object.entries(progress.levels ?? {})) {
    if (key.startsWith(`${trackId}:`)) n += (ls.history ?? []).length;
  }
  return n;
}

/**
 * Render the guidance panel for `trackId` into `container` (replacing its content). Returns the
 * panel, or null when the track has no guidance. `onDismiss` runs after the flag is persisted.
 */
export function renderGuidance(container, { store, trackId, onDismiss = null }) {
  const g = GUIDANCE[trackId];
  if (!g) { replace(container); return null; }
  const panel = h('div', { class: 'card guidance', role: 'note', 'data-role': 'guidance', 'data-track': trackId },
    h('h3', {}, g.title),
    ...g.lines.map((t) => h('p', {}, t)),
    h('button', { class: 'btn', 'data-action': 'dismiss-guidance', onClick: () => { dismissGuidance(store, trackId); replace(container); onDismiss?.(); } }, 'Got it'),
  );
  replace(container, panel);
  return panel;
}

/** A small help button that (re)opens the guidance for `trackId` into `container`. */
export function helpButton({ store, trackId, container }) {
  if (!GUIDANCE[trackId]) return null;
  return h('button', { class: 'btn ghost', 'data-action': 'open-guidance', 'aria-label': 'How this works', onClick: () => renderGuidance(container, { store, trackId }) }, '?');
}

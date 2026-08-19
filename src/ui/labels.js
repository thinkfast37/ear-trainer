/** Option labels per track and label settings (US-3.3, US-4.3, US-5.3), and presentation labels (D-013). */
export function optionLabel(track, id, settings) { return track.optionLabel(id, settings); }

const PRESENTATION_NAMES = { asc: 'Ascending', desc: 'Descending', harm: 'Harmonic', block: 'Block', arp: 'Arpeggiated', varied: 'Varied voicing', voiceLed: 'Voice-led' };

/** Human label for one presentation id. */
export function presentationName(id) { return PRESENTATION_NAMES[id] ?? id; }

/**
 * Human label for a level's presentation list (AC-2.6.1/4, AC-2.6.2/1): "Ascending",
 * "Ascending + descending", "Ascending + descending + harmonic". Null for levels without one.
 */
export function presentationLabel(level) {
  const list = level?.presentations;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((p, i) => (i === 0 ? presentationName(p) : presentationName(p).toLowerCase())).join(' + ');
}

/** "Level 7 — Descending", or "Level 4" for a level without a presentation. */
export function levelTitle(level) {
  const p = presentationLabel(level);
  return p ? `Level ${level.no} — ${p}` : `Level ${level.no}`;
}

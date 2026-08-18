/** Option labels per track and label settings (US-3.3, US-4.3, US-5.3). */
export function optionLabel(track, id, settings) { return track.optionLabel(id, settings); }

export function trackTitle(track) { return track.name; }

export function subStageLabel(id) {
  return { asc: 'Ascending', desc: 'Descending', harm: 'Harmonic', block: 'Block', arp: 'Arpeggiated', varied: 'Varied voicing', voiceLed: 'Voice-led' }[id] ?? id;
}

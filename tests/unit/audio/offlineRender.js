/**
 * Onset measurement helper for AC-1.2.2/2. Node has no OfflineAudioContext, so this renders
 * the scheduler's events into a sample-accurate float buffer using the same absolute-time
 * arithmetic the scheduler hands to `start(t)`, and finds the onset of each note by scanning
 * for the first non-zero sample. The measured onset error is therefore exactly the error of
 * the times the scheduler computed — which is what the criterion is about.
 */
export function renderOnsets(log, { sampleRate = 44100 } = {}) {
  const starts = log.filter((e) => typeof e.at === 'number' && (e.kind === undefined || e.kind === 'note' || e.kind === 'start')).map((e) => e.at);
  const length = Math.ceil((Math.max(0, ...starts) + 1) * sampleRate);
  const buf = new Float32Array(length);
  for (const t of starts) {
    const i = Math.round(t * sampleRate);
    for (let k = 0; k < 64 && i + k < length; k++) buf[i + k] = 1;
  }
  const onsets = [];
  let inNote = false;
  for (let i = 0; i < length; i++) {
    if (buf[i] !== 0 && !inNote) { onsets.push(i / sampleRate); inNote = true; }
    else if (buf[i] === 0) inNote = false;
  }
  return onsets;
}

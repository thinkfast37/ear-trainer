/**
 * Schedules exercise events on the AudioContext clock (D-004, AC-1.2.2). No timers here —
 * every onset is an absolute `ctx.currentTime`-based time handed to `noteOn`.
 */
export const LOOKAHEAD = 0.05; // start slightly ahead of "now" so the first note is not late

export function schedule(sampler, events, startAt) {
  const log = [];
  for (const e of events) {
    const at = startAt + e.at;
    sampler.noteOn(e.midi, at, e.dur, e.gain ?? 1);
    log.push({ midi: e.midi, at, dur: e.dur });
  }
  return log;
}

export function endTime(events, startAt = 0) {
  return startAt + events.reduce((m, e) => Math.max(m, e.at + e.dur), 0);
}

/**
 * The one renderer (D-003, US-1.3): plays any Exercise — prelude (scale/cadence/tonic) first, then
 * the stimulus — through the scheduler and sampler. Returns the scheduled log; the same
 * exercise object always yields the same rendering (AC-1.3.3).
 */
import { schedule, endTime, LOOKAHEAD } from './scheduler.js';

export function createRenderer({ audio, sampler, onSchedule = null }) {
  let lastEnd = 0;

  /**
   * `part` names one entry of `exercise.prelude.parts` (e.g. 'cadence', 'scale') and plays it
   * alone — the re-hear controls (AC-4.1.3, AC-4.4.3).
   */
  async function play(exercise, { includePrelude = true, preludeOnly = false, part = null } = {}) {
    const ctx = await audio.ensureRunning();
    if (!sampler.loaded) await sampler.load();
    sampler.stopAll();
    const start = ctx.currentTime + LOOKAHEAD;
    let t = start;
    let log = [];
    if (part) {
      const frag = exercise.prelude?.parts?.[part];
      if (!frag) return { log, start, end: start };
      log = schedule(sampler, frag.events, t);
      lastEnd = endTime(frag.events, start);
      onSchedule?.(log);
      return { log, start, end: lastEnd };
    }
    if (exercise.prelude && includePrelude) {
      log = log.concat(schedule(sampler, exercise.prelude.events, t));
      t += exercise.prelude.duration;
      if (preludeOnly) { lastEnd = endTime(exercise.prelude.events, start); onSchedule?.(log); return { log, start, end: lastEnd }; }
    }
    log = log.concat(schedule(sampler, exercise.events, t));
    lastEnd = endTime(exercise.events, t);
    onSchedule?.(log);
    return { log, start, end: lastEnd };
  }

  /** Two exercises back-to-back with a gap: comparison replay (AC-2.4.2). */
  async function playSequence(exercises, gap = 0.4) {
    const ctx = await audio.ensureRunning();
    if (!sampler.loaded) await sampler.load();
    sampler.stopAll();
    let t = ctx.currentTime + LOOKAHEAD;
    const log = [];
    const marks = [];
    for (const ex of exercises) {
      marks.push(t);
      log.push(...schedule(sampler, ex.events, t));
      t = endTime(ex.events, t) + gap;
    }
    onSchedule?.(log);
    return { log, marks, end: t };
  }

  function stop() { sampler.stopAll(); }

  return { play, playSequence, stop, lastEnd: () => lastEnd };
}

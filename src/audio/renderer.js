/**
 * The one renderer (D-003, US-1.3): plays any Exercise — prelude (cadence/tonic) first, then
 * the stimulus — through the scheduler and sampler. Returns the scheduled log; the same
 * exercise object always yields the same rendering (AC-1.3.3).
 */
import { schedule, endTime, LOOKAHEAD } from './scheduler.js';

export function createRenderer({ audio, sampler, onSchedule = null }) {
  let lastEnd = 0;

  async function play(exercise, { includePrelude = true, preludeOnly = false } = {}) {
    const ctx = await audio.ensureRunning();
    if (!sampler.loaded) await sampler.load();
    sampler.stopAll();
    const start = ctx.currentTime + LOOKAHEAD;
    let t = start;
    let log = [];
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

/**
 * Active practice time (D-014). A pausable accumulator with no timer: it measures the interval
 * between answers, subtracts any stretch spent with the app hidden, and caps a single gap at
 * `IDLE_CAP_SECONDS` so a level left open over lunch does not report lunch as practice.
 *
 * The clock knows nothing about `document` — the UI layer drives pause/resume from
 * `visibilitychange`, because that is the only layer allowed to know a DOM exists.
 */
export const IDLE_CAP_SECONDS = 60;

export function createActiveClock({ now = () => Date.now(), idleCap = IDLE_CAP_SECONDS } = {}) {
  let mark = now(); // start of the interval currently being counted
  let banked = 0; // ms counted since the last tick, from intervals already closed by a pause
  let paused = false;

  return {
    /** The app went away: bank what has been counted and stop. Idempotent. */
    pause() {
      if (paused) return;
      banked += Math.max(0, now() - mark);
      paused = true;
    },
    /** The app came back: start a fresh interval. Idempotent. */
    resume() {
      if (!paused) return;
      paused = false;
      mark = now();
    },
    get paused() { return paused; },
    /** Whole seconds of active time since the previous tick, capped; starts a new interval. */
    tick() {
      const ms = banked + (paused ? 0 : Math.max(0, now() - mark));
      banked = 0;
      mark = now();
      return Math.min(idleCap, Math.round(ms / 1000));
    },
  };
}

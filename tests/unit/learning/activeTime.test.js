import { describe, it, expect } from 'vitest';
import { createActiveClock, IDLE_CAP_SECONDS } from '../../../src/learning/activeTime.js';

/** A clock the test drives by hand: `advance(ms)` moves it, nothing moves on its own. */
function fakeNow(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms) => { t += ms; } };
}

describe('D-014 — active practice time', () => {
  it('accumulates the interval between ticks in whole seconds', () => {
    const c = fakeNow();
    const clock = createActiveClock({ now: c.now });
    c.advance(4200);
    expect(clock.tick()).toBe(4);
    c.advance(2000);
    expect(clock.tick()).toBe(2);
  });

  it('caps a single gap at the idle cap', () => {
    const c = fakeNow();
    const clock = createActiveClock({ now: c.now });
    c.advance(60 * 60 * 1000); // an hour with the level left open
    expect(clock.tick()).toBe(IDLE_CAP_SECONDS);
  });

  it('excludes time spent paused, and counts the intervals either side of it', () => {
    const c = fakeNow();
    const clock = createActiveClock({ now: c.now });
    c.advance(3000);
    clock.pause();
    c.advance(30 * 60 * 1000); // half an hour backgrounded
    clock.resume();
    c.advance(2000);
    expect(clock.tick()).toBe(5);
  });

  it('reports a tick taken while still paused without counting the time away', () => {
    const c = fakeNow();
    const clock = createActiveClock({ now: c.now });
    c.advance(1000);
    clock.pause();
    c.advance(90_000);
    expect(clock.paused).toBe(true);
    expect(clock.tick()).toBe(1);
  });

  it('treats repeated pause and resume calls as idempotent', () => {
    const c = fakeNow();
    const clock = createActiveClock({ now: c.now });
    c.advance(1000);
    clock.pause();
    clock.pause();
    c.advance(5000);
    clock.resume();
    clock.resume();
    c.advance(1000);
    expect(clock.tick()).toBe(2);
  });

  it('starts a fresh interval after each tick rather than re-counting', () => {
    const c = fakeNow();
    const clock = createActiveClock({ now: c.now });
    c.advance(3000);
    clock.tick();
    expect(clock.tick()).toBe(0);
  });
});

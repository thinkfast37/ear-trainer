/** Shared helpers for track modules. */
import { pickItem } from '../learning/selection.js';
import { pick } from '../learning/random.js';

export const KEY_COUNT = 12;

/** Random key index avoiding the previous one when possible (AC-4.1.2). */
export function pickKey(rng, avoid = null) {
  let k = Math.floor(rng() * KEY_COUNT);
  if (avoid != null && k === avoid) k = (k + 1 + Math.floor(rng() * (KEY_COUNT - 1))) % KEY_COUNT;
  return k;
}

/** Random tonic MIDI for key index in a comfortable octave. */
export function tonicMidi(keyIndex, { low = 48, high = 72 } = {}) {
  let m = 48 + keyIndex; // C3 .. B3
  if (m < low) m += 12;
  if (m > high - 12) m -= 12;
  return m;
}

/** Random root within [low, high − span]. */
export function pickRoot(rng, span, register) {
  const lo = register.low;
  const hi = Math.max(lo, register.high - span);
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/**
 * Pick the next item: Leitner weight × recency factor × any track-specific extra weights.
 * `ctx.recency` maps item id → questions since it was last asked in this session (absent =
 * never asked, treated as RECENCY_CAP), so under-asked items rise and a 20-item pool is
 * covered within a few dozen questions (D-006, AC-3.1.2/1).
 */
export const RECENCY_CAP = 20;
export function recencyFactor(sinceAsked) { return 1 + Math.min(sinceAsked ?? RECENCY_CAP, RECENCY_CAP) / 10; }

export function selectItem(rng, progress, itemIds, ctx = {}) {
  const extra = {};
  for (const id of itemIds) extra[id] = (ctx.extraWeights?.[id] ?? 1) * (ctx.recency ? recencyFactor(ctx.recency[id]) : 1);
  return pickItem(rng, progress.items, itemIds, { ...ctx, extraWeights: extra });
}

export { pick };

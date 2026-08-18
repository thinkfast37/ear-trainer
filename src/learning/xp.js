/** XP (US-9.3): base × score × replay factor × streak multiplier × mixed-review bonus. Never read by unlocks. */
import { replayFactor } from './scoring.js';

export const BASE_XP = 10;

export function streakMultiplier(streak) { return 1 + 0.1 * Math.min(Math.max(0, streak), 10); }

export function awardXp({ score = 1, replays = 0, streak = 0, mixed = false }) {
  if (score <= 0) return 0;
  return Math.round(BASE_XP * score * replayFactor(replays) * streakMultiplier(streak) * (mixed ? 1.5 : 1));
}

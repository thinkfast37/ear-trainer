/** Mixed Review (US-2.3): draws items across mastered levels of ≥ 2 tracks, weighted by box. */
import { masteredLevelCount } from './unlocks.js';

export const REQUIRED_MASTERED = 2;

export function mixedReviewAvailable(progress) { return masteredLevelCount(progress) >= REQUIRED_MASTERED; }

export function mixedReviewCondition() { return `Master ${REQUIRED_MASTERED} levels in any tracks to unlock`; }

/** Mastered (trackId, levelNo) pairs. */
export function masteredLevels(progress) {
  return Object.entries(progress.levels).filter(([, l]) => l.mastered).map(([k]) => {
    const [trackId, no] = k.split(':');
    return { trackId, levelNo: Number(no) };
  });
}

/**
 * Track and level availability (US-6.1, US-8.1, US-9.1, US-9.3): mastery only. XP is never
 * consulted here (Constitution VIII).
 */
import { getLevelState } from './mastery.js';

export function isLevelMastered(progress, trackId, levelNo) {
  return getLevelState(progress, trackId, levelNo).mastered === true;
}

/** Each prerequisite with its current status. */
export function prerequisiteStatus(track, progress, tracksById) {
  return (track.prerequisites ?? []).map((p) => ({
    track: p.track,
    trackName: tracksById[p.track]?.name ?? p.track,
    level: p.level,
    met: isLevelMastered(progress, p.track, p.level),
  }));
}

export function trackUnlocked(track, progress, tracksById) {
  return prerequisiteStatus(track, progress, tracksById).every((p) => p.met);
}

export function unlockMessage(track, tracksById) {
  const parts = (track.prerequisites ?? []).map((p) => `${tracksById[p.track]?.name ?? p.track} Level ${p.level}`);
  if (parts.length === 0) return '';
  return `Master ${parts.join(' and ')} to unlock`;
}

/** 'locked' | 'available' | 'in-progress' | 'mastered' */
export function levelNodeState(progress, track, levelNo, tracksById) {
  const st = getLevelState(progress, track.id, levelNo);
  if (st.mastered) return 'mastered';
  if (!trackUnlocked(track, progress, tracksById)) return 'locked';
  if (levelNo > 1 && !isLevelMastered(progress, track.id, levelNo - 1)) return 'locked';
  return st.history.length > 0 ? 'in-progress' : 'available';
}

export function levelUnlockCondition(progress, track, levelNo, tracksById) {
  if (!trackUnlocked(track, progress, tracksById)) return unlockMessage(track, tracksById);
  if (levelNo > 1 && !isLevelMastered(progress, track.id, levelNo - 1)) return `Master ${track.name} Level ${levelNo - 1} to unlock`;
  return '';
}

export function masteredLevelCount(progress) {
  return Object.values(progress.levels).filter((l) => l.mastered).length;
}

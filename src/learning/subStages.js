/**
 * Ordered sub-stages within a level (US-3.2, US-5.2, US-6.2, US-8.5). Each sub-stage has its
 * own history and its own item ids; mastering one unlocks the next; the level is mastered
 * when its last sub-stage is.
 */
import { evaluate } from './mastery.js';

export function currentSubStage(levelState, subStages) {
  if (!subStages || subStages.length === 0) return null;
  return levelState.subStage ?? subStages[0];
}

export function subStageState(levelState, id) {
  return levelState.subStages?.[id] ?? { mastered: false, history: [] };
}

export function isSubStageUnlocked(levelState, subStages, id) {
  const i = subStages.indexOf(id);
  if (i <= 0) return true;
  return subStageState(levelState, subStages[i - 1]).mastered === true;
}

/** Evaluate a sub-stage's mastery. */
export function evaluateSubStage(levelState, id, items, itemIds) {
  return evaluate(subStageState(levelState, id).history, items, itemIds);
}

/** After mastering `id`, the next sub-stage id or null when it was the last. */
export function nextSubStage(subStages, id) {
  const i = subStages.indexOf(id);
  return i >= 0 && i < subStages.length - 1 ? subStages[i + 1] : null;
}

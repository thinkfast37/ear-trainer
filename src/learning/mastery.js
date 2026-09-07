/**
 * Level mastery (D-006, US-2.2): rolling accuracy over the last 20 answers ≥ 90% AND every
 * item ≥ box 3, with at least max(10, 3 × items) answers (AC-2.2.4; D-006 amended
 * 2026-08-18). Mastered status is retained once earned. Levels have no sub-stages (D-013).
 */
import { getItem } from './leitner.js';

export const WINDOW = 20;
export const ACCURACY_THRESHOLD = 0.9;
export const BOX_FLOOR = 3;
export const HISTORY_CAP = 200;
export const MIN_ANSWERS_FLOOR = 10;
export const MIN_ANSWERS_PER_ITEM = 3;
/** Answers within which a level counts as "within reach" for the stopping-point message (AC-9.2.2/3). */
export const NEAR_MASTERY_ANSWERS = 5;

/** Minimum answers before a level with `itemCount` items can be mastered (AC-2.2.4). */
export function minAnswers(itemCount) { return Math.max(MIN_ANSWERS_FLOOR, MIN_ANSWERS_PER_ITEM * itemCount); }

export function levelKey(trackId, levelNo) { return `${trackId}:${levelNo}`; }

export function emptyLevelState() {
  return { mastered: false, masteredAt: null, activeSeconds: 0, history: [] };
}

export function getLevelState(progress, trackId, levelNo) {
  return progress.levels[levelKey(trackId, levelNo)] ?? emptyLevelState();
}

export function rollingAccuracy(history, window = WINDOW) {
  const recent = history.slice(-window);
  if (recent.length === 0) return 0;
  const correct = recent.filter((h) => h.correct).length;
  return correct / recent.length;
}

/**
 * @returns {{mastered:boolean, accuracy:number, answered:number, required:number, unmet:string[]}}
 * `unmet` lists 'accuracy' | 'answers' | 'boxes' with the offending item ids in `weakItems`;
 * `answered`/`required` count toward the level's minimum answer count (AC-2.2.4).
 */
export function evaluate(history, items, itemIds) {
  const accuracy = rollingAccuracy(history);
  const required = minAnswers(itemIds.length);
  const answered = Math.min(history.length, required);
  const weakItems = itemIds.filter((id) => getItem(items, id).box < BOX_FLOOR);
  const unmet = [];
  if (history.length < required) unmet.push('answers');
  if (accuracy < ACCURACY_THRESHOLD) unmet.push('accuracy');
  if (weakItems.length) unmet.push('boxes');
  return { mastered: unmet.length === 0, accuracy, answered, required, unmet, weakItems };
}

/**
 * The three mastery conditions as labelled progress, met ones included (AC-2.2.2/3, AC-2.6.1/5).
 * Every surface that reports how close a level is reads this, so the session header, the level
 * screen and the end-of-session summary cannot drift apart.
 * @returns {{id:string,label:string,value:number,target:number,text:string,met:boolean}[]}
 */
export function describeProgress(evaluation, itemCount) {
  const pct = Math.round(evaluation.accuracy * 100);
  const target = Math.round(ACCURACY_THRESHOLD * 100);
  const atFloor = itemCount - evaluation.weakItems.length;
  return [
    { id: 'answers', label: 'Answers', value: evaluation.answered, target: evaluation.required, text: `${evaluation.answered}/${evaluation.required}`, met: !evaluation.unmet.includes('answers') },
    { id: 'accuracy', label: `Accuracy (last ${WINDOW})`, value: pct, target, text: `${pct}% / ${target}%`, met: !evaluation.unmet.includes('accuracy') },
    { id: 'boxes', label: `Items at box ${BOX_FLOOR}+`, value: atFloor, target: itemCount, text: `${atFloor}/${itemCount}`, met: !evaluation.unmet.includes('boxes') },
  ];
}

/**
 * Answers still needed when answering more is the *only* thing between the level and mastery
 * (AC-9.2.2/3). Null when some other condition is also unmet — a learner two answers short but
 * three items below box 3 is not within reach, and must not be told they are.
 */
export function answersFromMastery(evaluation) {
  if (evaluation.mastered) return 0;
  if (evaluation.unmet.length !== 1 || evaluation.unmet[0] !== 'answers') return null;
  return evaluation.required - evaluation.answered;
}

/** Push an answer onto a history list, capped. */
export function pushHistory(history, entry) {
  history.push(entry);
  if (history.length > HISTORY_CAP) history.splice(0, history.length - HISTORY_CAP);
  return history;
}

/** Human text for an unmet condition. */
export function describeUnmet(unmet, evaluation) {
  const parts = [];
  if (unmet.includes('answers')) parts.push(`answer at least ${evaluation.required} questions (${evaluation.answered}/${evaluation.required})`);
  if (unmet.includes('accuracy')) parts.push(`reach ${Math.round(ACCURACY_THRESHOLD * 100)}% accuracy over your last ${WINDOW} (now ${Math.round(evaluation.accuracy * 100)}%)`);
  if (unmet.includes('boxes')) parts.push(`get every item to box ${BOX_FLOOR} or higher (${evaluation.weakItems.length} still below)`);
  return parts;
}

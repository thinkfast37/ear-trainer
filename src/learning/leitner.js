/** Per-item Leitner scheduling (D-006): 5 boxes, +1 on correct, →1 on incorrect. */
export const MIN_BOX = 1;
export const MAX_BOX = 5;

export function emptyItem() {
  return { box: MIN_BOX, attempts: 0, correct: 0, lastSeen: null, confusions: {} };
}

export function getItem(items, id) { return items[id] ?? emptyItem(); }

/** Returns the updated item record (pure). `chosen` is the wrong option, recorded as a confusion. */
export function applyAnswer(item, correct, now, chosen = null) {
  const next = { ...item, confusions: { ...(item.confusions ?? {}) } };
  next.attempts = (item.attempts ?? 0) + 1;
  next.lastSeen = now;
  if (correct) {
    next.correct = (item.correct ?? 0) + 1;
    next.box = Math.min(MAX_BOX, (item.box ?? MIN_BOX) + 1);
  } else {
    next.correct = item.correct ?? 0;
    next.box = MIN_BOX;
    if (chosen != null) next.confusions[String(chosen)] = (next.confusions[String(chosen)] ?? 0) + 1;
  }
  return next;
}

/** Selection weight: 6 − box, so box 1 = 5 … box 5 = 1. */
export function weightOf(box) { return MAX_BOX + 1 - box; }

export function accuracyOf(item) { return item.attempts ? item.correct / item.attempts : 0; }

/** Record an answer for `itemId` on the progress document (mutating a draft). */
export function recordAnswer(draft, itemId, correct, now, chosen = null) {
  draft.items[itemId] = applyAnswer(getItem(draft.items, itemId), correct, now, chosen);
  return draft.items[itemId];
}

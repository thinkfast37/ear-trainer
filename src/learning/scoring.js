/** Answer scoring: exact, position-wise partial credit, replay factor (US-7.2, US-7.3, US-8.3). */

/** Compare two sequences position by position. Missing/extra positions are incorrect. */
export function compareSequences(given, target) {
  const len = Math.max(given.length, target.length);
  const positions = [];
  let matches = 0;
  for (let i = 0; i < len; i++) {
    const ok = i < given.length && i < target.length && String(given[i]) === String(target[i]);
    if (ok) matches++;
    positions.push({ index: i, given: given[i] ?? null, expected: target[i] ?? null, correct: ok });
  }
  return { positions, matches, total: len, score: len ? matches / len : 0, correct: matches === len };
}

/** 1 − 0.1 × replays, floored at 0.5 (data-model.md). */
export function replayFactor(replaysUsed) {
  return Math.max(0.5, 1 - 0.1 * Math.max(0, replaysUsed));
}

/** Score for a question record. */
export function questionScore(baseScore, replaysUsed) {
  return baseScore * replayFactor(replaysUsed);
}

/**
 * Which item is asked next: Leitner-weighted, with confusion bias above the proficiency
 * threshold (D-006, US-2.1, US-2.5).
 */
import { getItem, weightOf } from './leitner.js';
import { pickWeighted } from './random.js';

export const PROFICIENCY = 0.75;
export const BIAS_FACTOR = 4;
export const BIAS_WINDOW = 5;

/** Base Leitner weight per item id. */
export function leitnerWeights(items, itemIds) {
  return itemIds.map((id) => ({ value: id, weight: weightOf(getItem(items, id).box) }));
}

/**
 * Apply confusion bias: `bias` is {ids:Set<string>, remaining:number} set after a confused
 * answer while proficient. Ids in the set are multiplied by BIAS_FACTOR.
 */
export function applyBias(weights, bias) {
  if (!bias || bias.remaining <= 0) return weights;
  return weights.map((w) => (bias.ids.has(w.value) ? { ...w, weight: w.weight * BIAS_FACTOR } : w));
}

/**
 * After an answer: if proficient and the (item, chosen) pair is a declared confusable pair,
 * return a fresh bias covering both items; else decrement the current one.
 */
export function nextBias({ bias, accuracy, correct, itemId, chosenItemId, confusablePairs }) {
  if (!correct && accuracy > PROFICIENCY && chosenItemId) {
    const pair = confusablePairs.find((p) => (p[0] === itemId && p[1] === chosenItemId) || (p[1] === itemId && p[0] === chosenItemId));
    if (pair) return { ids: new Set(pair), remaining: BIAS_WINDOW };
  }
  if (!bias) return null;
  const remaining = bias.remaining - 1;
  return remaining > 0 ? { ...bias, remaining } : null;
}

/** Choose the next item id, avoiding an immediate repeat when there is a choice. */
export function pickItem(rng, items, itemIds, { bias = null, avoid = null, extraWeights = null } = {}) {
  let weights = leitnerWeights(items, itemIds);
  if (extraWeights) weights = weights.map((w) => ({ ...w, weight: w.weight * (extraWeights[w.value] ?? 1) }));
  weights = applyBias(weights, bias);
  if (avoid && weights.length > 1) weights = weights.map((w) => (w.value === avoid ? { ...w, weight: w.weight * 0.15 } : w));
  return pickWeighted(rng, weights);
}

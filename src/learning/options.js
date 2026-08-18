/** Answer options: the level pool, always containing the confusable partner (AC-2.5.3). */
export function optionsFor(pool, answer, confusablePairs = []) {
  const set = new Set(pool);
  set.add(answer);
  for (const [a, b] of confusablePairs) {
    if (a === answer) set.add(b);
    if (b === answer) set.add(a);
  }
  return [...set];
}

/** The partner(s) declared confusable with `answer`. */
export function partnersOf(answer, confusablePairs = []) {
  const out = [];
  for (const [a, b] of confusablePairs) {
    if (a === answer) out.push(b);
    if (b === answer) out.push(a);
  }
  return out;
}

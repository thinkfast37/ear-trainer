/** Seedable PRNG (mulberry32) so question generation is reproducible in tests (D-006). */
export function createRng(seed = Date.now() >>> 0) {
  let a = seed >>> 0;
  const rng = function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.reseed = (s) => { a = s >>> 0; };
  return rng;
}

export function pick(rng, list) { return list[Math.floor(rng() * list.length)]; }

/** Weighted pick: entries [{value, weight}]. */
export function pickWeighted(rng, entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) return entries[Math.floor(rng() * entries.length)]?.value;
  let r = rng() * total;
  for (const e of entries) { r -= e.weight; if (r <= 0) return e.value; }
  return entries[entries.length - 1].value;
}

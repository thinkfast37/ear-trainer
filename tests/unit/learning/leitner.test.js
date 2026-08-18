import { describe, it, expect } from 'vitest';
import { applyAnswer, emptyItem, weightOf } from '../../../src/learning/leitner.js';
import { pickItem } from '../../../src/learning/selection.js';
import { createRng } from '../../../src/learning/random.js';

describe('US-2.1 Per-item Leitner scheduling', () => {
  it('AC-2.1.1 — A correct answer promotes the item one box', () => {
    const item = { ...emptyItem(), box: 2 };
    const next = applyAnswer(item, true, 1000);
    expect(next.box).toBe(3);
    expect(next.attempts).toBe(1); expect(next.correct).toBe(1); expect(next.lastSeen).toBe(1000);
    expect(applyAnswer({ ...emptyItem(), box: 5 }, true, 1).box).toBe(5);
  });
  it('AC-2.1.2 — An incorrect answer demotes the item to box 1', () => {
    const item = { ...emptyItem(), box: 4, correct: 6, attempts: 8 };
    const next = applyAnswer(item, false, 2000, 'dim7');
    expect(next.box).toBe(1);
    expect(next.attempts).toBe(9); expect(next.correct).toBe(6); expect(next.confusions.dim7).toBe(1);
  });
  it('AC-2.1.3 — Lower boxes are selected more often than higher boxes', () => {
    const items = {}; const ids = [];
    for (let b = 1; b <= 5; b++) { const id = `x:box${b}`; ids.push(id); items[id] = { ...emptyItem(), box: b }; }
    const rng = createRng(11); const counts = Object.fromEntries(ids.map((i) => [i, 0]));
    for (let i = 0; i < 5000; i++) counts[pickItem(rng, items, ids)]++;
    for (let b = 1; b < 5; b++) expect(counts[`x:box${b}`]).toBeGreaterThan(counts[`x:box${b + 1}`]);
    expect(weightOf(1)).toBe(5); expect(weightOf(5)).toBe(1);
    // and over the next 50 questions specifically, box 1 outnumbers box 5
    const c50 = Object.fromEntries(ids.map((i) => [i, 0]));
    for (let i = 0; i < 50; i++) c50[pickItem(rng, items, ids)]++;
    expect(c50['x:box1']).toBeGreaterThan(c50['x:box5']);
  });
});

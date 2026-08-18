import { describe, it, expect } from 'vitest';
import { harness, answerMany } from '../helpers/harness.js';
import { nextBias, applyBias, BIAS_FACTOR } from '../../../src/learning/selection.js';

describe('US-2.5 Confusion-weighted question generation', () => {
  it('AC-2.5.1 — A confused pair is re-asked within five questions once proficient', async () => {
    // Intervals L3 declares P4/P5 confusable. Get proficient (>75%), then answer a P5 as P4.
    const h = harness({ trackId: 'intervals', levelNo: 3, seed: 9 });
    await answerMany(h.session, 20);
    // find a P5 question
    let guard = 0;
    while (h.session.state.question.answer !== 'P5' && guard++ < 100) { h.session.submit(h.session.state.question.answer); await h.session.next(); }
    expect(h.session.state.question.answer).toBe('P5');
    h.session.submit('P4');
    expect(h.session.state.bias).not.toBeNull();
    const ids = [...h.session.state.bias.ids].sort(); expect(ids.map((x) => x.split(':')[1])).toEqual(['P4', 'P5']);
    let hit = false;
    for (let i = 0; i < 5; i++) { await h.session.next(); const a = h.session.state.question.answer; if (a === 'P4' || a === 'P5') { hit = true; break; } h.session.submit(a); }
    expect(hit).toBe(true);
    // the bias multiplies both members of the pair
    const w = applyBias([{ value: 'a', weight: 2 }, { value: 'b', weight: 2 }, { value: 'c', weight: 2 }], { ids: new Set(['a', 'b']), remaining: 3 });
    expect(w.map((x) => x.weight)).toEqual([2 * BIAS_FACTOR, 2 * BIAS_FACTOR, 2]);
  });
  it('AC-2.5.2 — Pair bias is inactive below the proficiency threshold', async () => {
    const pairs = [['interval:P4:asc', 'interval:P5:asc']];
    // below 75%: no bias, even on a confused pair
    expect(nextBias({ bias: null, accuracy: 0.6, correct: false, itemId: 'interval:P5:asc', chosenItemId: 'interval:P4:asc', confusablePairs: pairs })).toBeNull();
    // above: bias
    expect(nextBias({ bias: null, accuracy: 0.8, correct: false, itemId: 'interval:P5:asc', chosenItemId: 'interval:P4:asc', confusablePairs: pairs })).toMatchObject({ remaining: 5 });
    // and in a live session with low accuracy, plain Leitner weighting: no bias set after a confusion
    const h = harness({ trackId: 'intervals', levelNo: 3, seed: 9 });
    await answerMany(h.session, 10, (q) => q.options.find((o) => o !== q.answer)); // 0% accuracy
    let guard = 0;
    while (h.session.state.question.answer !== 'P5' && guard++ < 100) { h.session.submit(h.session.state.question.options.find((o) => o !== h.session.state.question.answer)); await h.session.next(); }
    h.session.submit('P4');
    expect(h.session.state.bias).toBeNull();
    // unbiased weights are the plain Leitner weights
    expect(applyBias([{ value: 'a', weight: 3 }], null)).toEqual([{ value: 'a', weight: 3 }]);
  });
});

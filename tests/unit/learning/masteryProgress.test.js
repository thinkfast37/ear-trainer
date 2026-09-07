import { describe, it, expect } from 'vitest';
import { evaluate, describeProgress, answersFromMastery, NEAR_MASTERY_ANSWERS } from '../../../src/learning/mastery.js';

const item = (box) => ({ box, attempts: 5, correct: 4, lastSeen: 1, confusions: {} });

/** A level of `ids.length` items with `n` answers, `wrong` of the most recent ones incorrect. */
function level(ids, n, { wrong = 0, boxes = {} } = {}) {
  const items = Object.fromEntries(ids.map((id) => [id, item(boxes[id] ?? 5)]));
  const history = Array.from({ length: n }, (_, i) => ({ item: ids[i % ids.length], correct: i < n - wrong, at: i, replays: 0, score: 1 }));
  return { evaluation: evaluate(history, items, ids), itemCount: ids.length };
}

describe('describeProgress — the three mastery conditions as progress', () => {
  it('reports every condition, met ones included, each against its target', () => {
    const { evaluation, itemCount } = level(['a', 'b', 'c'], 12);
    const byId = Object.fromEntries(describeProgress(evaluation, itemCount).map((c) => [c.id, c]));
    expect(Object.keys(byId)).toEqual(['answers', 'accuracy', 'boxes']);
    expect(byId.answers).toMatchObject({ value: 10, target: 10, text: '10/10', met: true });
    expect(byId.accuracy).toMatchObject({ value: 100, target: 90, text: '100% / 90%', met: true });
    expect(byId.boxes).toMatchObject({ value: 3, target: 3, text: '3/3', met: true });
  });

  it('counts items at the box floor rather than the stragglers below it', () => {
    const { evaluation, itemCount } = level(['a', 'b', 'c', 'd'], 20, { boxes: { c: 1, d: 2 } });
    const boxes = describeProgress(evaluation, itemCount).find((c) => c.id === 'boxes');
    expect(boxes).toMatchObject({ value: 2, target: 4, text: '2/4', met: false });
  });

  it('marks an unmet condition unmet while its neighbours stay met', () => {
    const { evaluation, itemCount } = level(['a', 'b'], 20, { wrong: 6 });
    const byId = Object.fromEntries(describeProgress(evaluation, itemCount).map((c) => [c.id, c]));
    expect(byId.answers.met).toBe(true);
    expect(byId.accuracy.met).toBe(false);
    expect(byId.accuracy.text).toBe('70% / 90%');
    expect(byId.boxes.met).toBe(true);
  });

  it('labels each condition in words, so the numbers are never bare', () => {
    const { evaluation, itemCount } = level(['a', 'b'], 4);
    for (const c of describeProgress(evaluation, itemCount)) expect(c.label).toMatch(/[A-Za-z]/);
    const labels = describeProgress(evaluation, itemCount).map((c) => c.label);
    expect(labels[1]).toContain('20'); // the accuracy window, so "last 20" is not a mystery
    expect(labels[2]).toContain('3'); // the box floor
  });
});

describe('answersFromMastery — how far off, when answering is all that is left', () => {
  it('counts the answers remaining when nothing else is unmet', () => {
    const { evaluation } = level(['a', 'b'], 6);
    expect(evaluation.unmet).toEqual(['answers']);
    expect(answersFromMastery(evaluation)).toBe(4);
    expect(answersFromMastery(evaluation)).toBeLessThanOrEqual(NEAR_MASTERY_ANSWERS);
  });

  it('is null when a box or accuracy condition is also unmet, however few answers remain', () => {
    // one answer short, but two items still below the box floor: not within reach
    const boxShort = level(['a', 'b', 'c', 'd'], 11, { boxes: { c: 1, d: 1 } });
    expect(answersFromMastery(boxShort.evaluation)).toBeNull();
    const accuracyShort = level(['a', 'b'], 9, { wrong: 4 });
    expect(answersFromMastery(accuracyShort.evaluation)).toBeNull();
  });

  it('is zero once the level is mastered', () => {
    const { evaluation } = level(['a', 'b'], 12);
    expect(evaluation.mastered).toBe(true);
    expect(answersFromMastery(evaluation)).toBe(0);
  });
});

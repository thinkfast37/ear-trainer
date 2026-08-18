import { describe, it, expect } from 'vitest';
import { compareSequences, replayFactor, questionScore } from '../../../src/learning/scoring.js';

describe('scoring', () => {
  it('position-wise comparison with partial credit', () => {
    const r = compareSequences(['1', '2', '3', '4', '5', '6', '7', '8'], ['1', '2', '3', '4', '5', '6', '1', '1']);
    expect(r.matches).toBe(6); expect(r.total).toBe(8); expect(r.score).toBe(0.75); expect(r.correct).toBe(false);
    expect(compareSequences(['1', '2'], ['1', '2', '3']).total).toBe(3);
  });
  it('replay factor floors at 0.5', () => { expect(replayFactor(0)).toBe(1); expect(replayFactor(3)).toBeCloseTo(0.7); expect(replayFactor(9)).toBe(0.5); expect(questionScore(1, 1)).toBeCloseTo(0.9); });
});

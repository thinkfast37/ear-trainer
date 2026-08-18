import { describe, it, expect } from 'vitest';
import { generatePhrase, maxLeap } from '../../../src/theory/melody.js';
import { createRng } from '../../../src/learning/random.js';

describe('melody', () => {
  it('respects note count, start and stepwise motion', () => {
    const rng = createRng(3);
    for (let i = 0; i < 100; i++) {
      const p = generatePhrase({ notes: [3, 3], motion: 'step', startOnDo: true, rhythm: 'even8' }, rng);
      expect(p.degrees.length).toBe(3); expect(p.degrees[0]).toBe(1); expect(maxLeap(p.degrees)).toBeLessThanOrEqual(2);
      expect(p.rhythm.every((r) => r === 0.5)).toBe(true);
    }
  });
});

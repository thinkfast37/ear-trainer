import { describe, it, expect } from 'vitest';
import { compareSequences } from '../../../src/learning/scoring.js';
import { buildTracks } from '../../../src/tracks/index.js';

describe('US-8.3 — chord-wise scoring helpers', () => {
  it('a 4-chord answer with 3 correct positions is 3/4 in the scoring helper', () => {
    const track = buildTracks().byId.progressions;
    const r = compareSequences(['I', 'V', 'vi', 'IV'], ['I', 'V', 'vi', 'ii']);
    expect(r.matches).toBe(3); expect(r.total).toBe(4); expect(r.score).toBe(0.75);
    expect(track.evaluate({ answer: ['I', 'V', 'vi', 'IV'] }, ['I', 'V', 'vi', 'ii']).score).toBe(0.75);
  });
});

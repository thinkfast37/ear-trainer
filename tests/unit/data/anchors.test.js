import { describe, it, expect } from 'vitest';
import anchors from '../../../src/data/anchors.json';
import { validateAnchors } from '../../../tools/validate-data.mjs';

describe('anchors.json', () => {
  it('validates: every simple interval has 1–5 anchors and every compound has a simple equivalent', () => {
    expect(validateAnchors(anchors)).toEqual([]);
  });
  it('m2 lists Jaws first and Für Elise descending', () => {
    expect(anchors.m2[0].title).toMatch(/Jaws/);
    expect(anchors.m2[1].direction).toBe('desc');
  });
});

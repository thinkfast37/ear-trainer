import { describe, it, expect } from 'vitest';
import anchors from '../../../src/data/anchors.json';
import { validateAnchors, cueIsSpecific } from '../../../tools/validate-data.mjs';

const SIMPLE = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];

describe('anchors.json', () => {
  it('validates: every simple interval has 1–5 anchors per direction and every compound has a simple equivalent', () => {
    expect(validateAnchors(anchors)).toEqual([]);
  });
  it('m2 lists Jaws ascending and Für Elise descending', () => {
    expect(anchors.m2.asc[0].title).toMatch(/Jaws/);
    expect(anchors.m2.desc[0].title).toMatch(/Für Elise/);
  });
  it('every simple interval carries anchors in both directions', () => {
    for (const id of SIMPLE) {
      expect(anchors[id].asc.length, `${id}.asc`).toBeGreaterThan(0);
      expect(anchors[id].desc.length, `${id}.desc`).toBeGreaterThan(0);
    }
  });
  it('AC-3.4.7 — Every anchor cue names the notes or the words where the interval occurs', () => {
    for (const id of SIMPLE) {
      for (const dir of ['asc', 'desc']) {
        for (const e of anchors[id][dir]) expect(cueIsSpecific(e.cue), `${id}.${dir}: ${e.title} — "${e.cue}"`).toBe(true);
      }
    }
    // and the rejections the gate exists for
    expect(cueIsSpecific('opening')).toBe(false);
    expect(cueIsSpecific('heard harmonically')).toBe(false);
    expect(cueIsSpecific('not a melodic leap')).toBe(false);
    expect(cueIsSpecific('"Hey" → "Jude"')).toBe(true);
    expect(cueIsSpecific('the first two notes of the riff')).toBe(true);
  });
  it('Hey Jude anchors both directions, cued on the right words', () => {
    // The bug this data shape exists for: the ascending m3 is "don't"→"make", not "Hey"→"Jude".
    expect(anchors.m3.asc.find((a) => /Hey Jude/.test(a.title)).cue).toMatch(/don't/);
    expect(anchors.m3.desc.find((a) => /Hey Jude/.test(a.title)).cue).toMatch(/Hey/);
  });
});

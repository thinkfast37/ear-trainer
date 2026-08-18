// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderAnswerGrid } from '../../../src/ui/answerGrid.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { mount } from './dom.js';

describe('US-5.1 — inversion does not change the options', () => {
  it('AC-5.1.2/2 — The inversion varies the sound without changing the answer options', () => {
    const track = buildTracks().byId.chordQualities; const rng = createRng(2);
    const byInv = {};
    for (let i = 0; i < 200; i++) {
      const q = track.generate({ levelNo: 5, subStage: 'block', progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS });
      const root = mount(() => {}); renderAnswerGrid(root, { question: q, track, settings: DEFAULT_SETTINGS, onAnswer: () => {} });
      const opts = [...root.querySelectorAll('[data-option]')].map((b) => b.dataset.option).sort().join(',');
      (byInv[q.meta.inversion] ??= new Set()).add(opts);
      // no inversion button anywhere in the quality grid
      expect(opts).not.toMatch(/inv/);
    }
    expect(Object.keys(byInv).length).toBe(3);
    const all = new Set(Object.values(byInv).flatMap((s) => [...s]));
    // options are the quality pool (+partners); the same set of option lists appears regardless of inversion
    for (const inv of Object.keys(byInv)) expect([...byInv[inv]].every((o) => all.has(o))).toBe(true);
    for (const opts of all) expect(opts.split(',')).toEqual(expect.arrayContaining(['maj', 'min', 'dim', 'aug']));
    // and the sound differs: different bass tone for different inversions of the same chord
    const q0 = track.generate({ levelNo: 5, subStage: 'block', progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS });
    const ex1 = track.exerciseFor({ ...q0, meta: { ...q0.meta, inversion: 1 } }, q0.answer);
    const ex0 = track.exerciseFor({ ...q0, meta: { ...q0.meta, inversion: 0 } }, q0.answer);
    expect(ex1.events[0].midi).not.toBe(ex0.events[0].midi);
  });
});

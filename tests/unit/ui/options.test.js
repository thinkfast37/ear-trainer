// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderAnswerGrid } from '../../../src/ui/answerGrid.js';
import { optionsFor } from '../../../src/learning/options.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { mount } from './dom.js';

describe('US-2.5 — answer options', () => {
  it('AC-2.5.3 — The confusable partner is always among the answer options', () => {
    const tracks = buildTracks();
    const rng = createRng(1);
    // Every track/level: for 30 generated questions, every declared partner of the answer is an option and a rendered button
    for (const track of tracks.list) {
      if (track.kind !== 'single') continue;
      for (const level of track.def.levels) {
        for (let i = 0; i < 30; i++) {
          const q = track.generate({ levelNo: level.no, subStage: track.def.subStages[0], progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS });
          for (const [a, b] of level.confusables) {
            if (a === q.answer) expect(q.options).toContain(b);
            if (b === q.answer) expect(q.options).toContain(a);
          }
          const root = mount(() => {});
          renderAnswerGrid(root, { question: q, track, settings: DEFAULT_SETTINGS, onAnswer: () => {} });
          const rendered = [...root.querySelectorAll('[data-option]')].map((b) => b.dataset.option);
          expect(rendered).toEqual(q.options);
        }
      }
    }
    expect(optionsFor(['P8'], 'P5', [['P4', 'P5']])).toEqual(expect.arrayContaining(['P8', 'P5', 'P4']));
  });
});

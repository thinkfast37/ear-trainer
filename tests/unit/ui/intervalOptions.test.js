// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderAnswerGrid } from '../../../src/ui/answerGrid.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { isCompound, simpleOf } from '../../../src/theory/intervals.js';
import { mount } from './dom.js';

describe('US-3.1 — compound distractors', () => {
  it('AC-3.1.3 — Compound interval questions offer the simple equivalent as a distractor', () => {
    const track = buildTracks().byId.intervals; const rng = createRng(5);
    let compoundSeen = 0;
    for (const lvl of [8, 9, 10, 11, 12]) {
      for (let i = 0; i < 60; i++) {
        const q = track.generate({ levelNo: lvl, subStage: 'asc', progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS });
        if (!isCompound(q.answer)) continue;
        compoundSeen++;
        const root = mount(() => {});
        renderAnswerGrid(root, { question: q, track, settings: DEFAULT_SETTINGS, onAnswer: () => {} });
        const buttons = [...root.querySelectorAll('[data-option]')].map((b) => b.dataset.option);
        expect(buttons).toContain(simpleOf(q.answer));
        if (q.answer === 'M9') expect(buttons).toContain('M2');
      }
    }
    expect(compoundSeen).toBeGreaterThan(20);
  });
});

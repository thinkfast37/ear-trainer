// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderLevelScreen } from '../../../src/ui/levelScreen.js';
import { createStore } from '../../../src/app/store.js';
import { emptyProgress } from '../../../src/storage/schema.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { mount } from './dom.js';

function progressWithAccuracyButWeakItem() {
  const p = emptyProgress();
  p.items['degree:Do:major'] = { box: 5, attempts: 10, correct: 10, lastSeen: 1, confusions: {} };
  p.items['degree:Mi:major'] = { box: 5, attempts: 10, correct: 10, lastSeen: 1, confusions: {} };
  p.items['degree:Sol:major'] = { box: 2, attempts: 3, correct: 1, lastSeen: 1, confusions: {} };
  p.levels['scaleDegrees:1'] = { mastered: false, masteredAt: null, history: Array.from({ length: 20 }, (_, i) => ({ item: 'degree:Do:major', correct: i !== 0, at: i, replays: 0, score: 1 })) };
  return p;
}

describe('US-2.2 — level screen', () => {
  it('AC-2.2.2/1 — The level is not mastered while an item is below box 3', () => {
    const store = createStore(progressWithAccuracyButWeakItem());
    const root = mount(renderLevelScreen, { store, tracks: buildTracks(), trackId: 'scaleDegrees', levelNo: 1, go: () => {} });
    const status = root.querySelector('[data-role="mastery-status"]');
    expect(status.dataset.mastered).toBe('false');
    expect(status.textContent).toContain('Not yet mastered');
  });
  it('AC-2.2.2/2 — The level screen shows which mastery condition is unmet', () => {
    const store = createStore(progressWithAccuracyButWeakItem());
    const root = mount(renderLevelScreen, { store, tracks: buildTracks(), trackId: 'scaleDegrees', levelNo: 1, go: () => {} });
    const unmet = [...root.querySelectorAll('[data-role="unmet"] li')].map((li) => li.textContent);
    expect(unmet.length).toBe(1);
    expect(unmet[0]).toMatch(/box 3/);
    expect(unmet[0]).toMatch(/1 still below/);
    expect(unmet.some((t) => /accuracy/.test(t))).toBe(false);
  });
  it('AC-2.2.2/3 — The level screen shows every mastery condition with its progress, including those already met', () => {
    // scaleDegrees L1 has 3 items, so the minimum is max(10, 3×3) = 10 (AC-2.2.4). With 20 answers
    // at 95% and one item at box 2, answers and accuracy are met and the box floor is not. Before
    // the 2026-09-07 revision only the unmet one was rendered.
    const store = createStore(progressWithAccuracyButWeakItem());
    const root = mount(renderLevelScreen, { store, tracks: buildTracks(), trackId: 'scaleDegrees', levelNo: 1, go: () => {} });
    const panel = root.querySelector('[data-role="mastery-status"] [data-role="mastery-progress"]');
    expect(panel).not.toBeNull();
    const byId = Object.fromEntries([...panel.querySelectorAll('[data-condition]')].map((e) => [e.dataset.condition, e]));
    expect(Object.keys(byId)).toEqual(['answers', 'accuracy', 'boxes']);
    expect(byId.answers.dataset.met).toBe('true');
    expect(byId.answers.textContent).toContain("10/10");
    expect(byId.accuracy.dataset.met).toBe('true');
    expect(byId.accuracy.textContent).toContain('95%');
    expect(byId.boxes.dataset.met).toBe('false');
    expect(byId.boxes.textContent).toContain('2/3');
  });
});
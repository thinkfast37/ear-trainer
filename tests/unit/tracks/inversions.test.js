import { describe, it, expect } from 'vitest';
import { harness, answerMany } from '../helpers/harness.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { getLevelState } from '../../../src/learning/mastery.js';
import { isSubStageUnlocked } from '../../../src/learning/subStages.js';

const track = buildTracks().byId.inversions;
function sample(levelNo, n = 300, seed = 3) {
  const rng = createRng(seed); const q = new Set(); const inv = new Set(); const qs = [];
  for (let i = 0; i < n; i++) { const x = track.generate({ levelNo, subStage: 'block', progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS }); q.add(x.meta.quality); inv.add(x.meta.inversion); qs.push(x); }
  return { qualities: [...q].sort(), inversions: [...inv].sort(), questions: qs };
}

describe('US-6.2 Inversion level progression', () => {
  it('AC-6.2.1/1 — Inversion level 1 pool is the major triad in root, first and second inversion', () => { const s = sample(1); expect(s.qualities).toEqual(['maj']); expect(s.inversions).toEqual([0, 1, 2]); expect(track.itemsFor(1, 'block')).toEqual(['inv:maj:inv0:block', 'inv:maj:inv1:block', 'inv:maj:inv2:block']); });
  it('AC-6.2.1/2 — Inversion level 2 pool is the minor triad in root, first and second inversion', () => { const s = sample(2); expect(s.qualities).toEqual(['min']); expect(s.inversions).toEqual([0, 1, 2]); });
  it('AC-6.2.1/3 — Inversion level 3 pool is mixed major and minor inversions', () => { const s = sample(3); expect(s.qualities).toEqual(['maj', 'min']); expect(s.inversions).toEqual([0, 1, 2]); expect(s.questions.every((q) => q.kind === 'qualityInversion')).toBe(true); });
  it('AC-6.2.1/4 — Inversion level 4 pool is seventh chords in root through third inversion', () => { const s = sample(4, 600); expect(s.qualities).toEqual(['dom7', 'm7', 'maj7']); expect(s.inversions).toEqual([0, 1, 2, 3]); });
  it('AC-6.2.2/2 — An inversion level 3 answer is correct only if both parts are correct', () => {
    const { questions } = sample(3, 50);
    for (const q of questions) {
      expect(track.evaluate(q, `${q.meta.quality}:inv${q.meta.inversion}`).correct).toBe(true);
      const otherQ = q.meta.quality === 'maj' ? 'min' : 'maj'; const otherI = (q.meta.inversion + 1) % 3;
      expect(track.evaluate(q, `${otherQ}:inv${q.meta.inversion}`).correct).toBe(false);
      expect(track.evaluate(q, `${q.meta.quality}:inv${otherI}`).correct).toBe(false);
      expect(track.evaluate(q, `inv${q.meta.inversion}`).correct).toBe(false);
    }
  });
  it('AC-6.2.3 — Inversion sub-stages unlock in order block, arpeggiated', async () => {
    const h = harness({ trackId: 'inversions', levelNo: 1, seed: 4 });
    const subs = h.tracks.defs.inversions.subStages; expect(subs).toEqual(['block', 'arp']);
    expect(isSubStageUnlocked(getLevelState(h.store.getState(), 'inversions', 1), subs, 'arp')).toBe(false);
    await h.session.start(); expect(h.session.state.question.exercise.presentation).toBe('block');
    await answerMany(h.session, 20);
    const ls = getLevelState(h.store.getState(), 'inversions', 1);
    expect(ls.subStages.block.mastered).toBe(true); expect(ls.subStage).toBe('arp'); expect(isSubStageUnlocked(ls, subs, 'arp')).toBe(true);
    const s2 = h.newSession({}); await s2.start(); expect(s2.state.question.exercise.presentation).toBe('arp');
  });
});

import { describe, it, expect } from 'vitest';
import { harness } from '../helpers/harness.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';

const track = buildTracks().byId.inversions;
const level = (n) => track.def.levels.find((l) => l.no === n);
function sample(levelNo, n = 300, seed = 3) {
  const rng = createRng(seed); const q = new Set(); const inv = new Set(); const qs = []; const pres = new Set();
  for (let i = 0; i < n; i++) { const x = track.generate({ levelNo, progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS }); q.add(x.meta.quality); inv.add(x.meta.inversion); pres.add(x.exercise.presentation); qs.push(x); }
  return { qualities: [...q].sort(), inversions: [...inv].sort(), presentations: [...pres], questions: qs };
}

describe('US-6.2 Inversion level progression', () => {
  it('AC-6.2.1/1 — Inversion level 1 is block major triad in root, first and second inversion', () => { const s = sample(1); expect(s.qualities).toEqual(['maj']); expect(s.inversions).toEqual([0, 1, 2]); expect(s.presentations).toEqual(['block']); expect(track.itemsFor(1)).toEqual(['inv:maj:inv0:block', 'inv:maj:inv1:block', 'inv:maj:inv2:block']); });
  it('AC-6.2.1/2 — Inversion level 2 is block minor triad in root, first and second inversion', () => { const s = sample(2); expect(s.qualities).toEqual(['min']); expect(s.inversions).toEqual([0, 1, 2]); expect(s.presentations).toEqual(['block']); });
  it('AC-6.2.1/3 — Inversion level 3 is block mixed major and minor inversions', () => { const s = sample(3); expect(s.qualities).toEqual(['maj', 'min']); expect(s.inversions).toEqual([0, 1, 2]); expect(s.presentations).toEqual(['block']); expect(s.questions.every((q) => q.kind === 'qualityInversion')).toBe(true); });
  it('AC-6.2.1/4 — Inversion level 4 is block seventh chords in root through third inversion', () => { const s = sample(4, 600); expect(s.qualities).toEqual(['dom7', 'm7', 'maj7']); expect(s.inversions).toEqual([0, 1, 2, 3]); expect(s.presentations).toEqual(['block']); });
  it('AC-6.2.1/5 — Inversion level 5 is arpeggiated mixed major and minor inversions', () => { const s = sample(5); expect(s.qualities).toEqual(['maj', 'min']); expect(s.inversions).toEqual([0, 1, 2]); expect(s.presentations).toEqual(['arp']); expect(s.questions.every((q) => q.kind === 'qualityInversion')).toBe(true); });
  it('AC-6.2.1/6 — Inversion level 6 is arpeggiated seventh chords in root through third inversion', () => { const s = sample(6, 600); expect(s.qualities).toEqual(['dom7', 'm7', 'maj7']); expect(s.inversions).toEqual([0, 1, 2, 3]); expect(s.presentations).toEqual(['arp']); });
  it('AC-6.2.2/2 — An inversion level 3 or 5 answer is correct only if both parts are correct', () => {
    for (const lvl of [3, 5]) {
      const { questions } = sample(lvl, 50);
      for (const q of questions) {
        expect(track.evaluate(q, `${q.meta.quality}:inv${q.meta.inversion}`).correct).toBe(true);
        const otherQ = q.meta.quality === 'maj' ? 'min' : 'maj'; const otherI = (q.meta.inversion + 1) % 3;
        expect(track.evaluate(q, `${otherQ}:inv${q.meta.inversion}`).correct).toBe(false);
        expect(track.evaluate(q, `${q.meta.quality}:inv${otherI}`).correct).toBe(false);
        expect(track.evaluate(q, `inv${q.meta.inversion}`).correct).toBe(false);
      }
    }
  });
  it('AC-6.2.3/1 — Levels 1 to 4 present block chords', async () => {
    for (let l = 1; l <= 4; l++) expect(level(l).presentations).toEqual(['block']);
    expect(track.def.subStages).toBeUndefined();
    const h = harness({ trackId: 'inversions', levelNo: 1, seed: 4 });
    await h.session.start(); expect(h.session.state.question.exercise.presentation).toBe('block');
  });
  it('AC-6.2.3/2 — Levels 5 to 6 present arpeggiated chords', async () => {
    for (let l = 5; l <= 6; l++) expect(level(l).presentations).toEqual(['arp']);
    const h = harness({ trackId: 'inversions', levelNo: 5, seed: 4 });
    await h.session.start(); expect(h.session.state.question.exercise.presentation).toBe('arp');
  });
});

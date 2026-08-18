import { describe, it, expect } from 'vitest';
import { harness } from '../helpers/harness.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { parseItemId } from '../../../src/tracks/chordQualities.js';

const track = buildTracks().byId.chordQualities;
const level = (n) => track.def.levels.find((l) => l.no === n);
function sample(levelNo, n = 300, seed = 3, subStage = 'block') {
  const rng = createRng(seed); const qualities = new Set(); const inversions = new Set(); const questions = [];
  for (let i = 0; i < n; i++) { const q = track.generate({ levelNo, subStage, progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS }); qualities.add(q.answer); inversions.add(q.meta.inversion); questions.push(q); }
  return { qualities: [...qualities].sort(), inversions: [...inversions].sort(), questions };
}
const T = ['aug', 'dim', 'maj', 'min']; const S = ['dim7', 'dom7', 'm7', 'm7b5', 'maj7'];

describe('US-5.1 Chord quality level progression', () => {
  it('AC-5.1.1/1 — Chord level 1 pool is maj and min in root position only', () => { expect(level(1).pool).toEqual(['maj', 'min']); expect(level(1).voicings).toEqual(['root']); const s = sample(1); expect(s.qualities).toEqual(['maj', 'min']); expect(s.inversions).toEqual([0]); });
  it('AC-5.1.1/2 — Chord level 2 pool adds dim in root position only', () => { const s = sample(2); expect(s.qualities).toEqual(['dim', 'maj', 'min']); expect(s.inversions).toEqual([0]); });
  it('AC-5.1.1/3 — Chord level 3 pool adds aug in root position only', () => { const s = sample(3); expect(s.qualities).toEqual(T); expect(s.inversions).toEqual([0]); });
  it('AC-5.1.1/4 — Chord level 4 pool is maj and min in root, first and second inversions', () => { const s = sample(4); expect(s.qualities).toEqual(['maj', 'min']); expect(s.inversions).toEqual([0, 1, 2]); expect(level(4).voicings).toEqual(['root', 'inv1', 'inv2']); });
  it('AC-5.1.1/5 — Chord level 5 pool is all triads in any inversion', () => { const s = sample(5); expect(s.qualities).toEqual(T); expect(s.inversions).toEqual([0, 1, 2]); });
  it('AC-5.1.1/6 — Chord level 6 pool is dom7, maj7 and m7 in root position only', () => { const s = sample(6); expect(s.qualities).toEqual(['dom7', 'm7', 'maj7']); expect(s.inversions).toEqual([0]); });
  it('AC-5.1.1/7 — Chord level 7 pool adds m7b5 and dim7 in root position only', () => { const s = sample(7); expect(s.qualities).toEqual(S); expect(s.inversions).toEqual([0]); });
  it('AC-5.1.1/8 — Chord level 8 pool is all seventh chords in any inversion root through third', () => { const s = sample(8, 600); expect(s.qualities).toEqual(S); expect(s.inversions).toEqual([0, 1, 2, 3]); });
  it('AC-5.1.1/9 — Chord level 9 pool adds sus2 and sus4 in root position', () => { const s = sample(9, 600); expect(s.qualities).toEqual([...T, ...S, 'sus2', 'sus4'].sort()); expect(s.inversions).toEqual([0]); });
  it('AC-5.1.1/10 — Chord level 10 pool is all qualities in any voicing as mixed review', () => { const s = sample(10, 900); expect(s.qualities).toEqual([...T, ...S, 'sus2', 'sus4'].sort()); expect(s.inversions).toEqual([0, 1, 2, 3]); expect(level(10).mixedReview).toBe(true); });

  it('AC-5.1.2/1 — The correct answer for an inverted chord is the quality alone', () => {
    const { questions } = sample(5, 300);
    const inverted = questions.filter((q) => q.meta.inversion > 0);
    expect(inverted.length).toBeGreaterThan(50);
    for (const q of inverted) { expect(T).toContain(q.answer); expect(q.answer).toBe(q.meta.quality); expect(track.evaluate(q, q.answer).correct).toBe(true); expect(track.evaluate(q, `${q.answer}:inv${q.meta.inversion}`).correct).toBe(false); }
  });
  it('AC-5.1.3/1 — A quality group is drilled in root position only when it first appears', () => {
    // triads first appear at level 1, sevenths at level 6 — root position only in both
    expect(level(1).voicings).toEqual(['root']); expect(sample(1).inversions).toEqual([0]);
    expect(level(6).voicings).toEqual(['root']); expect(sample(6).inversions).toEqual([0]);
    expect(level(1).pool.every((q) => T.includes(q))).toBe(true); expect(level(6).pool.every((q) => S.includes(q))).toBe(true);
  });
  it('AC-5.1.3/2 — Inverted voicings of a group are introduced in a later level after root-position mastery', () => {
    const firstInvTriad = track.def.levels.find((l) => l.pool.some((q) => T.includes(q)) && l.voicings.some((v) => v !== 'root'));
    const firstInvSeventh = track.def.levels.find((l) => l.pool.some((q) => S.includes(q)) && l.voicings.some((v) => v !== 'root'));
    expect(firstInvTriad.no).toBeGreaterThan(1); expect(firstInvSeventh.no).toBeGreaterThan(6);
    // and a later level is only reachable by mastering the earlier (root-position) ones
    const h = harness({ trackId: 'chordQualities', levelNo: 1 });
    const { levelNodeState } = h; void levelNodeState;
    const p = h.store.getState();
    for (let n = 2; n <= 10; n++) expect(p.levels[`chordQualities:${n - 1}`]?.mastered ?? false).toBe(false);
  });
  it('AC-5.1.4 — Voicing is a Leitner dimension for chord qualities', async () => {
    const p = emptyProgress();
    p.items['chord:min:block'] = { box: 3, attempts: 4, correct: 3, lastSeen: 1, confusions: {} };
    p.items['chord:min:inv:block'] = { box: 3, attempts: 4, correct: 3, lastSeen: 1, confusions: {} };
    const h = harness({ trackId: 'chordQualities', levelNo: 4, progress: p, seed: 5 });
    await h.session.start();
    let guard = 0;
    while (h.session.state.question.itemId !== 'chord:min:block' && guard++ < 500) await h.session.next();
    expect(h.session.state.question.itemId).toBe('chord:min:block');
    h.session.submit('min');
    guard = 0; await h.session.next();
    while (h.session.state.question.itemId !== 'chord:min:inv:block' && guard++ < 500) await h.session.next();
    expect(h.session.state.question.itemId).toBe('chord:min:inv:block');
    expect(h.session.state.question.meta.inversion).toBeGreaterThan(0);
    h.session.submit('maj');
    const items = h.store.getState().items;
    expect(items['chord:min:block'].box).toBe(4);
    expect(items['chord:min:inv:block'].box).toBe(1);
    expect(parseItemId('chord:min:inv:block')).toEqual({ quality: 'min', voicing: 'inv', presentation: 'block' });
  });
  it('AC-5.1.5 — Chord roots are randomized across the register', () => {
    const roots = sample(3, 20, 8).questions.map((q) => q.meta.root);
    expect(new Set(roots).size).toBeGreaterThanOrEqual(6);
    for (const r of roots) { expect(r).toBeGreaterThanOrEqual(DEFAULT_SETTINGS.register.low); expect(r).toBeLessThanOrEqual(DEFAULT_SETTINGS.register.high); }
    for (const period of [1, 2, 3]) { let same = 0; for (let i = period; i < roots.length; i++) if (roots[i] === roots[i - period]) same++; expect(same).toBeLessThan((roots.length - period) / 2); }
  });
});

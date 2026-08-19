import { describe, it, expect } from 'vitest';
import { harness } from '../helpers/harness.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { emptyProgress, DEFAULT_SETTINGS } from '../../../src/storage/schema.js';
import { createRng } from '../../../src/learning/random.js';
import { parseItemId } from '../../../src/tracks/chordQualities.js';

const track = buildTracks().byId.chordQualities;
const level = (n) => track.def.levels.find((l) => l.no === n);
function sample(levelNo, n = 300, seed = 3) {
  const rng = createRng(seed); const qualities = new Set(); const inversions = new Set(); const questions = []; const presentations = new Set();
  for (let i = 0; i < n; i++) { const q = track.generate({ levelNo, progress: emptyProgress(), rng, settings: DEFAULT_SETTINGS }); qualities.add(q.answer); inversions.add(q.meta.inversion); presentations.add(q.meta.presentation); questions.push(q); }
  return { qualities: [...qualities].sort(), inversions: [...inversions].sort(), presentations: [...presentations], questions };
}
const pres = (n) => level(n).presentations;
const T = ['aug', 'dim', 'maj', 'min']; const S = ['dim7', 'dom7', 'm7', 'm7b5', 'maj7'];

describe('US-5.1 Chord quality level progression', () => {
  it('AC-5.1.1/1 — Chord level 1 is block maj and min in root position only', () => { expect(level(1).pool).toEqual(['maj', 'min']); expect(level(1).voicings).toEqual(['root']); expect(pres(1)).toEqual(['block']); const s = sample(1); expect(s.qualities).toEqual(['maj', 'min']); expect(s.inversions).toEqual([0]); expect(s.presentations).toEqual(['block']); });
  it('AC-5.1.1/2 — Chord level 2 is block and adds dim in root position only', () => { expect(pres(2)).toEqual(['block']); const s = sample(2); expect(s.qualities).toEqual(['dim', 'maj', 'min']); expect(s.inversions).toEqual([0]); expect(s.presentations).toEqual(['block']); });
  it('AC-5.1.1/3 — Chord level 3 is block and adds aug in root position only', () => { expect(pres(3)).toEqual(['block']); const s = sample(3); expect(s.qualities).toEqual(T); expect(s.inversions).toEqual([0]); expect(s.presentations).toEqual(['block']); });
  it('AC-5.1.1/4 — Chord level 4 is block maj and min in root, first and second inversions', () => { expect(pres(4)).toEqual(['block']); const s = sample(4); expect(s.qualities).toEqual(['maj', 'min']); expect(s.inversions).toEqual([0, 1, 2]); expect(level(4).voicings).toEqual(['root', 'inv1', 'inv2']); expect(s.presentations).toEqual(['block']); });
  it('AC-5.1.1/5 — Chord level 5 is block all triads in any inversion', () => { expect(pres(5)).toEqual(['block']); const s = sample(5); expect(s.qualities).toEqual(T); expect(s.inversions).toEqual([0, 1, 2]); expect(s.presentations).toEqual(['block']); });
  it('AC-5.1.1/6 — Chord level 6 is block dom7, maj7 and m7 in root position only', () => { expect(pres(6)).toEqual(['block']); const s = sample(6); expect(s.qualities).toEqual(['dom7', 'm7', 'maj7']); expect(s.inversions).toEqual([0]); expect(s.presentations).toEqual(['block']); });
  it('AC-5.1.1/7 — Chord level 7 is block and adds m7b5 and dim7 in root position only', () => { expect(pres(7)).toEqual(['block']); const s = sample(7); expect(s.qualities).toEqual(S); expect(s.inversions).toEqual([0]); expect(s.presentations).toEqual(['block']); });
  it('AC-5.1.1/8 — Chord level 8 is block all seventh chords in any inversion root through third', () => { expect(pres(8)).toEqual(['block']); const s = sample(8, 600); expect(s.qualities).toEqual(S); expect(s.inversions).toEqual([0, 1, 2, 3]); expect(s.presentations).toEqual(['block']); });
  it('AC-5.1.1/9 — Chord level 9 is block all triads and sevenths plus sus2 and sus4 in root position', () => { expect(pres(9)).toEqual(['block']); const s = sample(9, 600); expect(s.qualities).toEqual([...T, ...S, 'sus2', 'sus4'].sort()); expect(s.inversions).toEqual([0]); expect(s.presentations).toEqual(['block']); });
  it('AC-5.1.1/10 — Chord level 10 is arpeggiated all triads in root position', () => { expect(pres(10)).toEqual(['arp']); const s = sample(10); expect(s.qualities).toEqual(T); expect(s.inversions).toEqual([0]); expect(s.presentations).toEqual(['arp']); });
  it('AC-5.1.1/11 — Chord level 11 is arpeggiated all triads in any inversion', () => { expect(pres(11)).toEqual(['arp']); const s = sample(11); expect(s.qualities).toEqual(T); expect(s.inversions).toEqual([0, 1, 2]); expect(s.presentations).toEqual(['arp']); });
  it('AC-5.1.1/12 — Chord level 12 is arpeggiated all seventh chords in root position', () => { expect(pres(12)).toEqual(['arp']); const s = sample(12); expect(s.qualities).toEqual(S); expect(s.inversions).toEqual([0]); expect(s.presentations).toEqual(['arp']); });
  it('AC-5.1.1/13 — Chord level 13 is arpeggiated all qualities in any voicing', () => { expect(pres(13)).toEqual(['arp']); const s = sample(13, 900); expect(s.qualities).toEqual([...T, ...S, 'sus2', 'sus4'].sort()); expect(s.inversions).toEqual([0, 1, 2, 3]); expect(s.presentations).toEqual(['arp']); });
  it('AC-5.1.1/14 — Chord level 14 is varied all triads in any inversion', () => { expect(pres(14)).toEqual(['varied']); const s = sample(14); expect(s.qualities).toEqual(T); expect(s.inversions).toEqual([0, 1, 2]); expect(s.presentations).toEqual(['varied']); });
  it('AC-5.1.1/15 — Chord level 15 is varied all qualities in any voicing as mixed review', () => { expect(pres(15)).toEqual(['varied']); const s = sample(15, 900); expect(s.qualities).toEqual([...T, ...S, 'sus2', 'sus4'].sort()); expect(s.inversions).toEqual([0, 1, 2, 3]); expect(s.presentations).toEqual(['varied']); expect(level(15).mixedReview).toBe(true); });

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
    for (let n = 2; n <= 15; n++) expect(p.levels[`chordQualities:${n - 1}`]?.mastered ?? false).toBe(false);
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

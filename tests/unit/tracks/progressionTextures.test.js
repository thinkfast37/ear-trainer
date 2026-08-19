import { describe, it, expect } from 'vitest';
import { harness } from '../helpers/harness.js';
import { emptyProgress } from '../../../src/storage/schema.js';

const chordsOf = (ex) => { const onsets = [...new Set(ex.events.map((e) => e.at))].sort((a, b) => a - b); return onsets.map((t) => ex.events.filter((e) => e.at === t).map((e) => e.midi).sort((a, b) => a - b)); };
const level = (h, n) => h.tracks.defs.progressions.levels.find((l) => l.no === n);

describe('US-8.5 Voicing realism tiers', () => {
  it('AC-8.5.1/1 — Levels 1 to 7 use identical block voicings', async () => {
    const h = harness({ trackId: 'progressions', levelNo: 1, seed: 3 });
    for (let l = 1; l <= 7; l++) expect(level(h, l).presentations).toEqual(['block']);
    expect(h.tracks.defs.progressions.subStages).toBeUndefined();
    await h.session.start();
    const q = h.session.state.question; expect(q.meta.presentation).toBe('block'); expect(q.exercise.presentation).toBe('block');
    // identical close voicings: every chord's tones at one onset, same register band
    for (const c of chordsOf(q.exercise)) { expect(c.length).toBeGreaterThanOrEqual(3); expect(Math.max(...c) - Math.min(...c)).toBeLessThan(12); expect(Math.min(...c)).toBeGreaterThanOrEqual(55); expect(Math.max(...c)).toBeLessThanOrEqual(79); }
  });
  it('AC-8.5.1/2 — Levels 8 to 10 use voice-led voicings with varied register', async () => {
    const h = harness({ trackId: 'progressions', levelNo: 8, seed: 3 });
    for (let l = 8; l <= 10; l++) expect(level(h, l).presentations).toEqual(['voiceLed']);
    await h.session.start();
    const q = h.session.state.question; expect(q.meta.presentation).toBe('voiceLed');
    // voice-led: consecutive chords move less than the block rendering of the same numerals
    const cs = chordsOf(q.exercise);
    const move = (chords) => chords.slice(1).reduce((s, c, i) => s + c.reduce((ss, t, k) => ss + Math.abs(t - (chords[i][k] ?? chords[i][chords[i].length - 1])), 0), 0);
    const block = h.tracks.byId.progressions.exerciseFor(q, q.answer);
    expect(move(cs)).toBeLessThanOrEqual(move(chordsOf(block)));
  });
  it('AC-8.5.1/3 — Levels 11 to 13 use arpeggiated or strummed texture', async () => {
    const h = harness({ trackId: 'progressions', levelNo: 11, seed: 3 });
    for (let l = 11; l <= 13; l++) expect(level(h, l).presentations).toEqual(['arp']);
    await h.session.start();
    const q = h.session.state.question; expect(q.exercise.presentation).toBe('arp');
    // arpeggiated: tones of a chord at staggered onsets
    const onsets = [...new Set(q.exercise.events.map((e) => e.at))];
    expect(onsets.length).toBeGreaterThan(q.answer.length);
  });
  it('AC-8.5.2 — Texture is a Leitner dimension for progressions', async () => {
    // Axis rotation 0 as blocks (level 2) right, as arpeggios (level 11) wrong: only their own items move.
    const p = emptyProgress();
    p.items['prog:8r0:block'] = { box: 3, attempts: 2, correct: 1, lastSeen: 1, confusions: {} };
    p.items['prog:8r0:arp'] = { box: 3, attempts: 2, correct: 1, lastSeen: 1, confusions: {} };
    const h = harness({ trackId: 'progressions', levelNo: 2, progress: p, seed: 5 });
    await h.session.start(); let guard = 0;
    while (h.session.state.question.itemId !== 'prog:8r0:block' && guard++ < 500) await h.session.next();
    expect(h.session.state.question.answer).toEqual(['I', 'V', 'vi', 'IV']);
    h.session.submit(['I', 'V', 'vi', 'IV']);
    const s2 = h.newSession({ levelNo: 11 }); await s2.start(); guard = 0;
    while (s2.state.question.itemId !== 'prog:8r0:arp' && guard++ < 800) await s2.next();
    expect(s2.state.question.itemId).toBe('prog:8r0:arp');
    s2.submit(['I', 'IV', 'V', 'I']);
    const items = h.store.getState().items;
    expect(items['prog:8r0:block'].box).toBe(4); expect(items['prog:8r0:arp'].box).toBe(1);
  });
});

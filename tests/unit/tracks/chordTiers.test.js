import { describe, it, expect } from 'vitest';
import { harness } from '../helpers/harness.js';
import { emptyProgress } from '../../../src/storage/schema.js';
import { buildTracks } from '../../../src/tracks/index.js';

const tracks = buildTracks();
const track = tracks.byId.chordQualities;
const levelDef = (n) => track.def.levels.find((l) => l.no === n);

describe('US-5.2 Chord presentation tiers', () => {
  it('AC-5.2.1/1 — Levels 1 to 9 present block chords in close voicing and fixed register', async () => {
    for (let l = 1; l <= 9; l++) expect(levelDef(l).presentations).toEqual(['block']);
    expect(track.def.subStages).toBeUndefined();
    const h = harness({ trackId: 'chordQualities', levelNo: 1, seed: 3 });
    await h.session.start();
    const q = h.session.state.question;
    expect(q.meta.presentation).toBe('block'); expect(q.exercise.presentation).toBe('block');
    // close voicing: span < an octave; all tones at one onset; fixed register within settings
    const tones = q.exercise.events.map((e) => e.midi);
    expect(Math.max(...tones) - Math.min(...tones)).toBeLessThan(12);
    expect(new Set(q.exercise.events.map((e) => e.at)).size).toBe(1);
    expect(Math.min(...tones)).toBeGreaterThanOrEqual(48); expect(Math.max(...tones)).toBeLessThanOrEqual(84);
  });
  it('AC-5.2.1/2 — Levels 10 to 13 present arpeggiated chords', async () => {
    for (let l = 10; l <= 13; l++) expect(levelDef(l).presentations).toEqual(['arp']);
    const h = harness({ trackId: 'chordQualities', levelNo: 10, seed: 3 });
    await h.session.start();
    const q = h.session.state.question;
    expect(q.meta.presentation).toBe('arp'); expect(q.exercise.presentation).toBe('arp');
    expect(new Set(q.exercise.events.map((e) => e.at)).size).toBeGreaterThan(1); // tones in sequence
  });
  it('AC-5.2.1/3 — Levels 14 to 15 present varied register and voicing spread', async () => {
    for (let l = 14; l <= 15; l++) expect(levelDef(l).presentations).toEqual(['varied']);
    const h = harness({ trackId: 'chordQualities', levelNo: 14, seed: 3 });
    await h.session.start();
    const q = h.session.state.question; expect(q.exercise.presentation).toBe('varied');
    const tones = q.exercise.events.map((e) => e.midi);
    expect(Math.max(...tones) - Math.min(...tones)).toBeGreaterThan(12); // spread voicing
  });
  it('AC-5.2.2 — Each chord presentation is a separate Leitner item', async () => {
    // maj7 block (level 6) right, maj7 arpeggiated (level 12) wrong: only their own items move.
    const p = emptyProgress();
    p.items['chord:maj7:block'] = { box: 3, attempts: 4, correct: 3, lastSeen: 1, confusions: {} };
    p.items['chord:maj7:arp'] = { box: 3, attempts: 4, correct: 3, lastSeen: 1, confusions: {} };
    const h = harness({ trackId: 'chordQualities', levelNo: 6, progress: p, seed: 5 });
    await h.session.start(); let guard = 0;
    while (h.session.state.question.itemId !== 'chord:maj7:block' && guard++ < 300) await h.session.next();
    h.session.submit('maj7');
    const s2 = h.newSession({ levelNo: 12 }); await s2.start(); guard = 0;
    while (s2.state.question.itemId !== 'chord:maj7:arp' && guard++ < 300) await s2.next();
    expect(s2.state.question.itemId).toBe('chord:maj7:arp');
    s2.submit('dom7');
    const items = h.store.getState().items;
    expect(items['chord:maj7:block'].box).toBe(4); expect(items['chord:maj7:arp'].box).toBe(1);
  });
  it('AC-5.2.3 — The arpeggiation tempo setting applies to the next arpeggiated question', async () => {
    const h = harness({ trackId: 'chordQualities', levelNo: 10, seed: 2 });
    await h.session.start();
    const gap = (q) => q.exercise.events[1].at - q.exercise.events[0].at;
    expect(gap(h.session.state.question)).toBeCloseTo(60 / 120 / 2);
    h.store.update((d) => { d.settings.arpeggioTempo = 60; });
    await h.session.next();
    expect(gap(h.session.state.question)).toBeCloseTo(60 / 60 / 2);
  });
});

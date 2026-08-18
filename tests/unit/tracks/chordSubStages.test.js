import { describe, it, expect } from 'vitest';
import { harness, answerMany } from '../helpers/harness.js';
import { getLevelState } from '../../../src/learning/mastery.js';
import { isSubStageUnlocked, currentSubStage } from '../../../src/learning/subStages.js';
import { emptyProgress } from '../../../src/storage/schema.js';

describe('US-5.2 Chord presentation sub-stages', () => {
  it('AC-5.2.1/1 — A chord level starts in the block sub-stage with close voicing and fixed register', async () => {
    const h = harness({ trackId: 'chordQualities', levelNo: 1, seed: 3 });
    expect(h.tracks.defs.chordQualities.subStages).toEqual(['block', 'arp', 'varied']);
    expect(currentSubStage(getLevelState(h.store.getState(), 'chordQualities', 1), h.tracks.defs.chordQualities.subStages)).toBe('block');
    await h.session.start();
    const q = h.session.state.question;
    expect(q.subStage).toBe('block'); expect(q.exercise.presentation).toBe('block');
    // close voicing: span < an octave; all tones at one onset; fixed register within settings
    const tones = q.exercise.events.map((e) => e.midi);
    expect(Math.max(...tones) - Math.min(...tones)).toBeLessThan(12);
    expect(new Set(q.exercise.events.map((e) => e.at)).size).toBe(1);
    expect(Math.min(...tones)).toBeGreaterThanOrEqual(48); expect(Math.max(...tones)).toBeLessThanOrEqual(84);
  });
  it('AC-5.2.1/2 — Mastering block unlocks arpeggiated', async () => {
    const h = harness({ trackId: 'chordQualities', levelNo: 1, seed: 3 });
    const subs = h.tracks.defs.chordQualities.subStages;
    expect(isSubStageUnlocked(getLevelState(h.store.getState(), 'chordQualities', 1), subs, 'arp')).toBe(false);
    await answerMany(h.session, 20);
    const ls = getLevelState(h.store.getState(), 'chordQualities', 1);
    expect(ls.subStages.block.mastered).toBe(true); expect(isSubStageUnlocked(ls, subs, 'arp')).toBe(true); expect(ls.subStage).toBe('arp');
    expect(isSubStageUnlocked(ls, subs, 'varied')).toBe(false);
    const s2 = h.newSession({}); await s2.start(); expect(s2.state.question.exercise.presentation).toBe('arp');
  });
  it('AC-5.2.1/3 — Mastering arpeggiated unlocks varied register and voicing spread', async () => {
    const h = harness({ trackId: 'chordQualities', levelNo: 1, seed: 3 });
    const subs = h.tracks.defs.chordQualities.subStages;
    await answerMany(h.session, 20);
    const s2 = h.newSession({}); await answerMany(s2, 20);
    const ls = getLevelState(h.store.getState(), 'chordQualities', 1);
    expect(ls.subStages.arp.mastered).toBe(true); expect(isSubStageUnlocked(ls, subs, 'varied')).toBe(true); expect(ls.subStage).toBe('varied');
    const s3 = h.newSession({}); await s3.start();
    const q = s3.state.question; expect(q.exercise.presentation).toBe('varied');
    const tones = q.exercise.events.map((e) => e.midi);
    expect(Math.max(...tones) - Math.min(...tones)).toBeGreaterThan(12); // spread voicing
  });
  it('AC-5.2.2 — Each chord presentation is a separate Leitner item', async () => {
    const p = emptyProgress();
    p.items['chord:maj7:block'] = { box: 3, attempts: 4, correct: 3, lastSeen: 1, confusions: {} };
    p.items['chord:maj7:arp'] = { box: 3, attempts: 4, correct: 3, lastSeen: 1, confusions: {} };
    p.levels['chordQualities:6'] = { mastered: false, masteredAt: null, subStage: 'block', subStages: {}, history: [] };
    const h = harness({ trackId: 'chordQualities', levelNo: 6, progress: p, seed: 5 });
    await h.session.start(); let guard = 0;
    while (h.session.state.question.itemId !== 'chord:maj7:block' && guard++ < 300) await h.session.next();
    h.session.submit('maj7');
    h.store.update((d) => { d.levels['chordQualities:6'].subStage = 'arp'; });
    const s2 = h.newSession({}); await s2.start(); guard = 0;
    while (s2.state.question.itemId !== 'chord:maj7:arp' && guard++ < 300) await s2.next();
    s2.submit('dom7');
    const items = h.store.getState().items;
    expect(items['chord:maj7:block'].box).toBe(4); expect(items['chord:maj7:arp'].box).toBe(1);
  });
  it('AC-5.2.3 — The arpeggiation tempo setting applies to the next arpeggiated question', async () => {
    const p = emptyProgress();
    p.levels['chordQualities:1'] = { mastered: false, masteredAt: null, subStage: 'arp', subStages: {}, history: [] };
    const h = harness({ trackId: 'chordQualities', levelNo: 1, progress: p, seed: 2 });
    await h.session.start();
    const gap = (q) => q.exercise.events[1].at - q.exercise.events[0].at;
    expect(gap(h.session.state.question)).toBeCloseTo(60 / 120 / 2);
    h.store.update((d) => { d.settings.arpeggioTempo = 60; });
    await h.session.next();
    expect(gap(h.session.state.question)).toBeCloseTo(60 / 60 / 2);
  });
});

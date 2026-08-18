import { describe, it, expect } from 'vitest';
import { harness, answerUntilMastered } from '../helpers/harness.js';
import { getLevelState } from '../../../src/learning/mastery.js';
import { isSubStageUnlocked, currentSubStage } from '../../../src/learning/subStages.js';
import { emptyProgress } from '../../../src/storage/schema.js';

const chordsOf = (ex) => { const onsets = [...new Set(ex.events.map((e) => e.at))].sort((a, b) => a - b); return onsets.map((t) => ex.events.filter((e) => e.at === t).map((e) => e.midi).sort((a, b) => a - b)); };

describe('US-8.5 Voicing realism sub-stages', () => {
  it('AC-8.5.1/1 — A progression level starts in the identical block voicings sub-stage', async () => {
    const h = harness({ trackId: 'progressions', levelNo: 1, seed: 3 });
    expect(h.tracks.defs.progressions.subStages).toEqual(['block', 'voiceLed', 'arp']);
    expect(currentSubStage(getLevelState(h.store.getState(), 'progressions', 1), h.tracks.defs.progressions.subStages)).toBe('block');
    await h.session.start();
    const q = h.session.state.question; expect(q.subStage).toBe('block'); expect(q.exercise.presentation).toBe('block');
    // identical close voicings: every chord's tones at one onset, same register band
    for (const c of chordsOf(q.exercise)) { expect(c.length).toBeGreaterThanOrEqual(3); expect(Math.max(...c) - Math.min(...c)).toBeLessThan(12); expect(Math.min(...c)).toBeGreaterThanOrEqual(55); expect(Math.max(...c)).toBeLessThanOrEqual(79); }
  });
  it('AC-8.5.1/2 — Mastering block unlocks voice-led voicings with varied register', async () => {
    const h = harness({ trackId: 'progressions', levelNo: 1, seed: 3 });
    const subs = h.tracks.defs.progressions.subStages;
    await answerUntilMastered(h.session);
    const ls = getLevelState(h.store.getState(), 'progressions', 1);
    expect(ls.subStages.block.mastered).toBe(true); expect(isSubStageUnlocked(ls, subs, 'voiceLed')).toBe(true); expect(ls.subStage).toBe('voiceLed');
    expect(isSubStageUnlocked(ls, subs, 'arp')).toBe(false);
    const s2 = h.newSession({}); await s2.start();
    expect(s2.state.question.subStage).toBe('voiceLed');
    // voice-led: consecutive chords move less than the block rendering of the same numerals
    const q = s2.state.question; const cs = chordsOf(q.exercise);
    const move = (chords) => chords.slice(1).reduce((s, c, i) => s + c.reduce((ss, t, k) => ss + Math.abs(t - (chords[i][k] ?? chords[i][chords[i].length - 1])), 0), 0);
    const block = h.tracks.byId.progressions.exerciseFor(q, q.answer);
    expect(move(cs)).toBeLessThanOrEqual(move(chordsOf(block)));
  });
  it('AC-8.5.1/3 — Mastering voice-led unlocks arpeggiated or strummed texture', async () => {
    const h = harness({ trackId: 'progressions', levelNo: 1, seed: 3 });
    const subs = h.tracks.defs.progressions.subStages;
    await answerUntilMastered(h.session);
    const s2 = h.newSession({}); await answerUntilMastered(s2);
    const ls = getLevelState(h.store.getState(), 'progressions', 1);
    expect(ls.subStages.voiceLed.mastered).toBe(true); expect(isSubStageUnlocked(ls, subs, 'arp')).toBe(true); expect(ls.subStage).toBe('arp');
    const s3 = h.newSession({}); await s3.start();
    const q = s3.state.question; expect(q.exercise.presentation).toBe('arp');
    // arpeggiated: tones of a chord at staggered onsets
    const onsets = [...new Set(q.exercise.events.map((e) => e.at))];
    expect(onsets.length).toBeGreaterThan(q.answer.length);
    if (ls.mastered) expect(ls.masteredAt).toBeNull(); // not yet mastered: arp still to go
  });
  it('AC-8.5.2 — Texture is a Leitner dimension for progressions', async () => {
    const p = emptyProgress();
    p.items['prog:8r0:block'] = { box: 3, attempts: 2, correct: 1, lastSeen: 1, confusions: {} };
    p.items['prog:8r0:arp'] = { box: 3, attempts: 2, correct: 1, lastSeen: 1, confusions: {} };
    p.levels['progressions:2'] = { mastered: false, masteredAt: null, subStage: 'block', subStages: {}, history: [] };
    const h = harness({ trackId: 'progressions', levelNo: 2, progress: p, seed: 5 });
    await h.session.start(); let guard = 0;
    while (h.session.state.question.itemId !== 'prog:8r0:block' && guard++ < 500) await h.session.next();
    expect(h.session.state.question.answer).toEqual(['I', 'V', 'vi', 'IV']);
    h.session.submit(['I', 'V', 'vi', 'IV']);
    h.store.update((d) => { d.levels['progressions:2'].subStage = 'arp'; });
    const s2 = h.newSession({}); await s2.start(); guard = 0;
    while (s2.state.question.itemId !== 'prog:8r0:arp' && guard++ < 500) await s2.next();
    s2.submit(['I', 'IV', 'V', 'I']);
    const items = h.store.getState().items;
    expect(items['prog:8r0:block'].box).toBe(4); expect(items['prog:8r0:arp'].box).toBe(1);
  });
});

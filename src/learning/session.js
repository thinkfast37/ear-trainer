/**
 * A practice session: generates questions from a track/level (or Mixed Review), plays them,
 * scores answers, and writes every consequence to the store — Leitner boxes, level and
 * sub-stage history, mastery and unlocks, XP, the day log and streak, the session record.
 */
import { recordAnswer, getItem, weightOf } from './leitner.js';
import { evaluate, getLevelState, levelKey, emptyLevelState, pushHistory, rollingAccuracy } from './mastery.js';
import { currentSubStage, evaluateSubStage, nextSubStage } from './subStages.js';
import { nextBias } from './selection.js';
import { partnersOf } from './options.js';
import { questionScore } from './scoring.js';
import { awardXp } from './xp.js';
import { recordActivity } from './streak.js';
import { masteredLevels } from './mixedReview.js';
import { getSettings } from '../app/settings.js';

let seq = 0;

export function createSession({ trackId = null, levelNo = null, mixed = false, bassFirst = false }, { store, tracks, renderer, rng, now = () => Date.now() }) {
  const id = `s${now()}-${++seq}`;
  const state = {
    id, trackId, levelNo, mixed, bassFirst,
    phase: 'idle', question: null, result: null, replaysUsed: 0, stepIndex: 0, stepResults: [],
    startedAt: now(), lastTick: now(), questions: 0, correct: 0, replays: 0, streak: 0,
    prevKey: null, prevItem: null, bias: null, ended: false, cadenceHeard: false, asked: 0, lastAsked: {},
  };
  const listeners = new Set();
  const emit = () => { for (const l of listeners) l(state); };

  function settings() { return getSettings(store.getState()); }
  function progress() { return store.getState(); }
  function track(tid = state.question?.trackId ?? trackId) { return tracks.byId[tid]; }
  function levelDef(tid, no) { return track(tid).def.levels.find((l) => l.no === no); }

  function subStageFor(tid, no) {
    const t = track(tid);
    return currentSubStage(getLevelState(progress(), tid, no), t.def.subStages);
  }

  function historyFor(tid, no, sub) {
    const ls = getLevelState(progress(), tid, no);
    return sub ? (ls.subStages?.[sub]?.history ?? []) : ls.history;
  }

  function withCadence() {
    const f = settings().cadenceFrequency;
    if (f === 'never') return false;
    if (f === 'firstOnly') return !state.cadenceHeard;
    return true;
  }

  /** Mixed Review: pick a mastered (track, level) weighted by the summed Leitner weight of its items. */
  function pickMixedTarget() {
    const p = progress();
    const cands = masteredLevels(p).map(({ trackId: tid, levelNo: no }) => {
      const t = track(tid);
      const sub = t.def.subStages.length ? t.def.subStages[t.def.subStages.length - 1] : null;
      const ids = t.itemsFor(no, sub ?? undefined);
      const weight = ids.reduce((s, iid) => s + weightOf(getItem(p.items, iid).box), 0);
      return { tid, no, sub, weight };
    });
    const total = cands.reduce((s, c) => s + c.weight, 0);
    let r = rng() * total;
    for (const c of cands) { r -= c.weight; if (r <= 0) return c; }
    return cands[cands.length - 1];
  }

  function generate() {
    let tid = trackId, no = levelNo, sub = null;
    if (mixed) { const m = pickMixedTarget(); tid = m.tid; no = m.no; sub = m.sub; }
    else sub = subStageFor(tid, no);
    const t = track(tid);
    const accuracy = rollingAccuracy(historyFor(tid, no, null)); // proficiency is level-wide (AC-2.5.1, AC-4.2.2)
    const recency = {};
    for (const [iid, idx] of Object.entries(state.lastAsked)) recency[iid] = state.asked - idx;
    const q = t.generate({
      levelNo: no, subStage: sub ?? undefined, progress: progress(), rng, settings: settings(),
      bias: state.bias, avoid: state.prevItem, accuracy, prevKey: state.prevKey, recency,
      withCadence: withCadence(), bassFirst: state.bassFirst,
    });
    state.asked++;
    state.lastAsked[q.itemId] = state.asked;
    q.trackLabel = t.name;
    q.replayLimit = q.meta?.replayLimit ?? levelDef(tid, no).replayLimit ?? (t.kind === 'single' ? null : settings().replayLimit);
    if (q.replayLimit == null && (t.kind === 'sequence' || t.kind === 'numerals')) q.replayLimit = settings().replayLimit;
    state.question = q;
    state.replaysUsed = 0;
    state.stepIndex = 0;
    state.stepResults = [];
    state.result = null;
    state.phase = 'question';
    state.prevKey = q.meta?.key ?? state.prevKey;
    state.prevItem = q.itemId;
    state.questionStartedAt = now();
    return q;
  }

  async function play() {
    const r = await renderer.play(state.question.exercise, { includePrelude: withCadence() });
    if (state.question.exercise.prelude) state.cadenceHeard = true;
    return r;
  }

  async function start() { generate(); emit(); return play(); }

  function replayLimitReached() {
    const lim = state.question?.replayLimit;
    return lim != null && state.replaysUsed >= lim;
  }

  /** Replays the stimulus with identical rendering; counts against the cap. */
  async function replay() {
    if (!state.question || replayLimitReached()) return false;
    state.replaysUsed++;
    state.replays++;
    emit();
    await renderer.play(state.question.exercise, { includePrelude: false });
    return true;
  }

  /** Re-hear the cadence only; free (AC-4.1.3). Plays the cadence part alone when the prelude has parts. */
  async function rehearCadence() {
    const ex = state.question?.exercise;
    if (!ex?.prelude) return false;
    if (ex.prelude.parts?.cadence) await renderer.play(ex, { part: 'cadence' });
    else await renderer.play(ex, { preludeOnly: true });
    return true;
  }

  /** Whether the current question offers the scale reference on demand (US-4.4). */
  function scaleAvailable() { return Boolean(state.question?.exercise.prelude?.parts?.scale); }

  /** Hear the scale reference alone; free — never touches the replay count (AC-4.4.4). */
  async function hearScale() {
    if (!scaleAvailable()) return false;
    await renderer.play(state.question.exercise, { part: 'scale' });
    return true;
  }

  /** Comparison replay: correct then chosen (AC-2.4.2). */
  async function playComparison() {
    const q = state.question;
    const t = track(q.trackId);
    const chosen = state.result?.chosen;
    if (chosen == null || !t.exerciseFor) return null;
    const correctEx = t.exerciseFor(q, q.answer, settings());
    const chosenEx = t.exerciseFor(q, chosen, settings());
    return renderer.playSequence([correctEx, chosenEx]);
  }

  function currentStep() { return state.question?.steps ? state.question.steps[state.stepIndex] : null; }

  function submit(answer) {
    const q = state.question;
    if (!q || state.phase !== 'question') return null;
    const t = track(q.trackId);
    const step = currentStep();
    if (step) {
      const r = t.evaluate({ ...q, answer: step.answer }, answer);
      state.stepResults.push({ kind: step.kind, ...r, given: answer });
      if (state.stepIndex < q.steps.length - 1) { state.stepIndex++; emit(); return { step: true, ...r }; }
      // final step decides the item; per-step scores are kept on the result
    }
    const evalResult = t.evaluate(q, answer);
    const correct = evalResult.correct;
    const baseScore = evalResult.score ?? (correct ? 1 : 0);
    const score = questionScore(baseScore, state.replaysUsed);
    const chosen = answer;
    const chosenItemId = q.kind === 'single' && typeof answer === 'string' ? t.optionItemId(answer, q) : null;
    const ts = now();
    const elapsed = Math.min(60, Math.max(0, Math.round((ts - state.lastTick) / 1000)));
    state.lastTick = ts;
    state.questions++;
    if (correct) { state.correct++; state.streak++; } else state.streak = 0;
    const level = levelDef(q.trackId, q.levelNo);
    const sub = q.subStage ?? null;

    let outcome = {};
    store.update((d) => {
      recordAnswer(d, q.itemId, correct, ts, correct ? null : (q.kind === 'single' ? answer : null));
      const key = levelKey(q.trackId, q.levelNo);
      const ls = d.levels[key] ?? (d.levels[key] = emptyLevelState());
      const entry = { item: q.itemId, correct, at: ts, replays: state.replaysUsed, score };
      pushHistory(ls.history, entry);
      let subMastered = false;
      let levelMastered = false;
      const wasMastered = ls.mastered;
      if (sub) {
        const ss = ls.subStages[sub] ?? (ls.subStages[sub] = { mastered: false, history: [] });
        pushHistory(ss.history, entry);
        const ev = evaluateSubStage(ls, sub, d.items, t.itemsFor(q.levelNo, sub));
        if (ev.mastered && !ss.mastered) {
          ss.mastered = true; subMastered = true;
          const nx = nextSubStage(t.def.subStages, sub);
          if (nx) ls.subStage = nx; else if (!ls.mastered) { ls.mastered = true; ls.masteredAt = ts; levelMastered = true; }
        }
      } else {
        const ev = evaluate(ls.history, d.items, t.itemsFor(q.levelNo));
        if (ev.mastered && !ls.mastered) { ls.mastered = true; ls.masteredAt = ts; levelMastered = true; }
      }
      const xp = awardXp({ score: baseScore, replays: state.replaysUsed, streak: state.streak - (correct ? 1 : 0), mixed });
      d.xp += xp;
      const act = recordActivity(d, { questions: 1, seconds: elapsed }, ts, d.settings.sessionGoal);
      let rec = d.sessions.find((s) => s.id === id);
      if (!rec) { rec = { id, trackId, levelNo, mixed, startedAt: state.startedAt, endedAt: ts, questions: 0, correct: 0, replays: 0 }; d.sessions.push(rec); }
      rec.endedAt = ts; rec.questions = state.questions; rec.correct = state.correct; rec.replays = state.replays;
      if (d.sessions.length > 500) d.sessions.splice(0, d.sessions.length - 500);
      outcome = { xp, subMastered, levelMastered: levelMastered && !wasMastered, dayCompleted: act.justCompleted, levelState: structuredClone(ls) };
    });

    const accuracy = rollingAccuracy(historyFor(q.trackId, q.levelNo, null));
    state.bias = nextBias({ bias: state.bias, accuracy, correct, itemId: q.itemId, chosenItemId, confusablePairs: (level.confusables ?? []).map((p) => p.map((o) => t.optionItemId(o, q))) });

    state.result = {
      correct, score, baseScore, positions: evalResult.positions ?? null, correctAnswer: q.answer, chosen,
      partners: q.kind === 'single' ? partnersOf(q.answer, level.confusables ?? []) : [],
      steps: state.stepResults.slice(), replaysUsed: state.replaysUsed, trackLabel: q.trackLabel, name: q.meta?.name ?? null,
      ...outcome,
    };
    state.phase = 'feedback';
    emit();
    return state.result;
  }

  async function next() { generate(); emit(); return play(); }

  function end() {
    if (state.ended) return;
    state.ended = true;
    renderer.stop();
    emit();
  }

  return {
    id, state, start, play, replay, rehearCadence, hearScale, scaleAvailable, playComparison, submit, next, end,
    replayLimitReached, currentStep,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    summary() { return { questions: state.questions, correct: state.correct, replays: state.replays, avgReplays: state.questions ? state.replays / state.questions : 0, seconds: Math.round((now() - state.startedAt) / 1000) }; },
  };
}

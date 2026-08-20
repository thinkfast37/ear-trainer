/**
 * Session screen: stimulus controls (replay / re-hear cadence / hear scale), the answer input for the
 * question kind, and — after an answer — the feedback panel (US-2.4, US-3.4, US-7.2, US-7.3,
 * US-8.3, US-8.4, US-9.2, US-9.3).
 */
import { h, replace } from './dom.js';
import { renderAnswerGrid, renderCombinedGrid } from './answerGrid.js';
import { createSequenceModel, renderSequenceInput } from './sequenceInput.js';
import { renderFeedback } from './feedback.js';
import { celebrationStats, renderMasteryDialog } from './celebration.js';
import { getSettings } from '../app/settings.js';
import { getLevelState, evaluate, ACCURACY_THRESHOLD, BOX_FLOOR } from '../learning/mastery.js';
import { dayKey } from '../learning/streak.js';
import { presentationLabel } from './labels.js';
import { helpButton, questionsAnsweredOnTrack, ORDER_HINT, ORDER_HINT_UNTIL } from './guidance.js';

export function renderSessionScreen(container, { session, store, tracks, go, onEnd }) {
  const wrap = h('div', { class: 'stack session', 'data-role': 'session' });
  const header = h('div', { class: 'row', 'data-role': 'session-header' });
  const status = h('div', { class: 'row session-status', 'data-role': 'session-status' });
  const stimulus = h('div', { class: 'card stimulus', 'data-role': 'stimulus' });
  const answerArea = h('div', { class: 'stack', 'data-role': 'answer-area' });
  const feedbackArea = h('div', { class: 'stack', 'data-role': 'feedback-area' });
  const guidanceArea = h('div', { 'data-role': 'guidance-area' });
  const toastArea = h('div', { 'data-role': 'toast-area' });
  const dialogArea = h('div', { 'data-role': 'dialog-area' });
  wrap.append(header, status, stimulus, guidanceArea, answerArea, feedbackArea, toastArea, dialogArea);
  replace(container, wrap);
  let seqModel = null;
  let toastShown = false;
  let masteryDialogShown = false;
  let masteryDialogDismissed = false;

  function leave() { session.end(); if (onEnd) onEnd(); else go('/home'); }

  /** The mastery dialog (AC-9.3.2): return to the menu, or keep practising this level. */
  function showMasteryDialog(trackId, levelNo) {
    const state = store.getState();
    const track = tracks.byId[trackId];
    const ls = getLevelState(state, trackId, levelNo);
    const stats = celebrationStats(ls, state.items, track.itemsFor(levelNo));
    masteryDialogShown = true;
    renderMasteryDialog(dialogArea, {
      trackName: track.name, levelNo, stats, track,
      onMenu: leave,
      onKeepPractising: () => { masteryDialogDismissed = true; replace(dialogArea); },
    });
  }

  /** End taps show a never-seen mastery from this session before leaving (AC-9.3.4). */
  function endSession() {
    const { trackId, levelNo, startedAt } = session.state;
    if (!masteryDialogShown && trackId != null && levelNo != null) {
      const ls = getLevelState(store.getState(), trackId, levelNo);
      if (ls.masteredAt != null && ls.masteredAt >= startedAt) return showMasteryDialog(trackId, levelNo);
    }
    leave();
  }

  function draw() {
    const st = session.state;
    const q = st.question;
    const settings = getSettings(store.getState());
    if (!q) return;
    const track = tracks.byId[q.trackId];
    replace(header,
      h('span', { 'data-role': 'track-label' }, q.trackLabel + (st.mixed ? ' (Mixed Review)' : '')),
      h('span', { class: 'muted', 'data-role': 'progress' }, `Q${st.questions + (st.phase === 'question' ? 1 : 0)} · ${st.correct} correct`),
      h('button', { class: 'btn ghost', 'data-action': 'end-session', onClick: endSession }, 'End'),
    );
    const state = store.getState();
    const ls = getLevelState(state, q.trackId, q.levelNo);
    const itemIds = track.itemsFor(q.levelNo);
    const ev = evaluate(ls.history, state.items, itemIds);
    const level = track.def.levels.find((l) => l.no === q.levelNo);
    const meterParts = [];
    const pres = presentationLabel(level);
    if (pres) meterParts.push(pres);
    meterParts.push(`${ev.answered}/${ev.required}`);
    meterParts.push(`${Math.round(ev.accuracy * 100)}% (target ${Math.round(ACCURACY_THRESHOLD * 100)}%)`);
    if (ev.weakItems.length) meterParts.push(`${ev.weakItems.length} below box ${BOX_FLOOR}`);
    const goal = settings.sessionGoal;
    const today = state.days[dayKey(Date.now())] ?? { questions: 0 };
    replace(status,
      h('span', { class: 'muted', 'data-role': 'mastery-meter', 'data-weak': String(ev.weakItems.length), 'data-presentation': pres ?? '' }, meterParts.join(' · ')),
      h('span', { class: 'muted', 'data-role': 'goal-progress' }, `Today ${today.questions}/${goal.questions}`),
    );
    const capped = session.replayLimitReached();
    const replayInfo = q.replayLimit != null ? ` (${st.replaysUsed}/${q.replayLimit})` : '';
    // Scale reference (US-4.4): offered only where the level's policy says so; shown disabled with
    // a hint at the other scale-degree levels so the learner knows the aid exists and has been withdrawn.
    const scalePolicy = q.meta?.scaleReference;
    const scaleOn = session.scaleAvailable();
    const scaleControls = scalePolicy ? [
      h('button', { class: 'btn', 'data-action': 'hear-scale', disabled: !scaleOn, 'aria-disabled': String(!scaleOn), onClick: () => { if (scaleOn) session.hearScale(); } }, 'Hear scale'),
      scaleOn ? null : h('span', { class: 'muted', 'data-role': 'scale-hint' }, 'Scale reference is a level 1–2 aid'),
    ] : [];
    const showOrderHint = scalePolicy === 'auto' && st.phase === 'question' && questionsAnsweredOnTrack(state, q.trackId) < ORDER_HINT_UNTIL;
    replace(stimulus,
      h('button', { class: 'btn primary', 'data-action': 'replay', disabled: capped, 'aria-disabled': String(capped), onClick: () => session.replay().then(draw) }, `Replay${replayInfo}`),
      q.exercise.prelude ? h('button', { class: 'btn', 'data-action': 'rehear-cadence', onClick: () => session.rehearCadence() }, 'Re-hear cadence') : null,
      ...scaleControls,
      helpButton({ store, trackId: q.trackId, container: guidanceArea }),
      st.phase === 'question' && q.steps ? h('span', { class: 'muted', 'data-role': 'step-indicator' }, `Step ${st.stepIndex + 1} of ${q.steps.length}`) : null,
      showOrderHint ? h('div', { class: 'muted order-hint', 'data-role': 'order-hint' }, ORDER_HINT) : null,
    );

    replace(answerArea);
    if (st.phase === 'question') {
      const step = session.currentStep();
      const kind = step ? (step.kind === 'bass' ? 'sequence' : 'numerals') : q.kind;
      if (kind === 'single') renderAnswerGrid(answerArea, { question: q, track, settings, onAnswer: (id) => { session.submit(id); draw(); } });
      else if (kind === 'qualityInversion') renderCombinedGrid(answerArea, { question: q, track, settings, onAnswer: (id) => { session.submit(id); draw(); } });
      else {
        const options = step ? step.options : q.options;
        const labelFor = step?.kind === 'bass' ? (x) => x : (id) => track.optionLabel(id, settings);
        seqModel = createSequenceModel();
        renderSequenceInput(answerArea, { options, labelFor, model: seqModel, prompt: step?.prompt ?? null, expectedLength: (step ? step.answer : q.answer).length, onSubmit: (v) => { session.submit(v); draw(); } });
      }
      replace(feedbackArea);
    } else if (st.phase === 'feedback') {
      replace(feedbackArea);
      renderFeedback(feedbackArea, { session, track, settings, store, onNext: () => session.next().then(draw) });
      const r = st.result;
      if (r.levelMastered && !masteryDialogDismissed) showMasteryDialog(q.trackId, q.levelNo);
      if (r.dayCompleted && !toastShown) {
        toastShown = true;
        const toast = h('div', { class: 'toast', role: 'status', 'data-role': 'stopping-point' },
          h('span', {}, 'Daily goal reached — this is a good stopping point.'),
          h('button', { class: 'btn', 'data-action': 'dismiss-toast', onClick: () => toast.remove() }, 'Dismiss'));
        replace(toastArea, toast);
      }
    }
  }
  session.subscribe(draw);
  draw();
  return { wrap, draw };
}

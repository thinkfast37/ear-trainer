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
import { masteryProgressPanel } from './masteryProgress.js';
import { renderSessionSummary } from './sessionSummary.js';
import { getSettings } from '../app/settings.js';
import { getLevelState, evaluate, answersFromMastery, NEAR_MASTERY_ANSWERS } from '../learning/mastery.js';
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

  // Practice time stops accruing while the app is away (D-014). The clock lives in the learning
  // layer, which may not know a document exists, so the wiring is here.
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') session.clock.pause();
    else session.clock.resume();
  };
  document.addEventListener('visibilitychange', onVisibility);

  function stop() { session.end(); document.removeEventListener('visibilitychange', onVisibility); }
  function goHome() { if (onEnd) onEnd(); else go('/home'); }
  function leave() { stop(); goHome(); }

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

  /**
   * End taps show a never-seen mastery from this session before leaving (AC-9.3.4), and otherwise
   * the session summary (AC-2.6.3) — so stopping always says what the session bought and that it
   * is kept, rather than dropping straight back to the menu.
   */
  function endSession() {
    const { trackId, levelNo, startedAt } = session.state;
    if (trackId == null || levelNo == null) return leave(); // Mixed Review has no single level
    const state = store.getState();
    const ls = getLevelState(state, trackId, levelNo);
    if (!masteryDialogShown && ls.masteredAt != null && ls.masteredAt >= startedAt) return showMasteryDialog(trackId, levelNo);
    const track = tracks.byId[trackId];
    const itemIds = track.itemsFor(levelNo);
    const level = track.def.levels.find((l) => l.no === levelNo);
    stop();
    renderSessionSummary(dialogArea, {
      trackName: track.name, levelNo, presentation: presentationLabel(level),
      questions: session.state.questions, correct: session.state.correct,
      evaluation: evaluate(ls.history, state.items, itemIds), itemCount: itemIds.length,
      onClose: goHome,
    });
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
    const pres = presentationLabel(level);
    const goal = settings.sessionGoal;
    const today = state.days[dayKey(Date.now())] ?? { questions: 0 };
    replace(status,
      masteryProgressPanel({ evaluation: ev, itemCount: itemIds.length, presentation: pres, compact: true }),
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
        // Within reach of mastering the level, the goal is worth reporting but stopping is not
        // worth advising (AC-9.2.2/3): a few answers short of mastery is the worst moment in a
        // session to be told to stop. The day is complete and the streak has incremented either way.
        const remaining = answersFromMastery(ev);
        const nearly = remaining != null && remaining > 0 && remaining <= NEAR_MASTERY_ANSWERS;
        const message = nearly
          ? `Daily goal reached — and you are ${remaining} ${remaining === 1 ? 'answer' : 'answers'} from mastering this level. Worth finishing.`
          : 'Daily goal reached — this is a good stopping point.';
        const toast = h('div', { class: 'toast', role: 'status', 'data-role': 'stopping-point', 'data-near-mastery': String(nearly) },
          h('span', {}, message),
          h('button', { class: 'btn', 'data-action': 'dismiss-toast', onClick: () => toast.remove() }, 'Dismiss'));
        replace(toastArea, toast);
      }
    }
  }
  session.subscribe(draw);
  draw();
  return { wrap, draw };
}

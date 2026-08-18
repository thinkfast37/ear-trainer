/**
 * Session screen: stimulus controls (play/replay/re-hear cadence), the answer input for the
 * question kind, and — after an answer — the feedback panel (US-2.4, US-3.4, US-7.2, US-7.3,
 * US-8.3, US-8.4, US-9.2, US-9.3).
 */
import { h, replace } from './dom.js';
import { renderAnswerGrid, renderCombinedGrid } from './answerGrid.js';
import { createSequenceModel, renderSequenceInput } from './sequenceInput.js';
import { renderFeedback } from './feedback.js';
import { celebrationStats, renderCelebration } from './celebration.js';
import { getSettings } from '../app/settings.js';

export function renderSessionScreen(container, { session, store, tracks, go, onEnd }) {
  const wrap = h('div', { class: 'stack session', 'data-role': 'session' });
  const header = h('div', { class: 'row', 'data-role': 'session-header' });
  const stimulus = h('div', { class: 'card stimulus', 'data-role': 'stimulus' });
  const answerArea = h('div', { class: 'stack', 'data-role': 'answer-area' });
  const feedbackArea = h('div', { class: 'stack', 'data-role': 'feedback-area' });
  const toastArea = h('div', { 'data-role': 'toast-area' });
  wrap.append(header, stimulus, answerArea, feedbackArea, toastArea);
  replace(container, wrap);
  let seqModel = null;
  let toastShown = false;

  function draw() {
    const st = session.state;
    const q = st.question;
    const settings = getSettings(store.getState());
    if (!q) return;
    const track = tracks.byId[q.trackId];
    replace(header,
      h('span', { 'data-role': 'track-label' }, q.trackLabel + (st.mixed ? ' (Mixed Review)' : '')),
      h('span', { class: 'muted', 'data-role': 'progress' }, `Q${st.questions + (st.phase === 'question' ? 1 : 0)} · ${st.correct} correct`),
      h('button', { class: 'btn ghost', 'data-action': 'end-session', onClick: () => { session.end(); onEnd?.(); } }, 'End'),
    );
    const capped = session.replayLimitReached();
    const replayInfo = q.replayLimit != null ? ` (${st.replaysUsed}/${q.replayLimit})` : '';
    replace(stimulus,
      h('button', { class: 'btn primary', 'data-action': 'replay', disabled: capped, 'aria-disabled': String(capped), onClick: () => session.replay().then(draw) }, `Replay${replayInfo}`),
      q.exercise.prelude ? h('button', { class: 'btn', 'data-action': 'rehear-cadence', onClick: () => session.rehearCadence() }, 'Re-hear cadence') : null,
      st.phase === 'question' && q.steps ? h('span', { class: 'muted', 'data-role': 'step-indicator' }, `Step ${st.stepIndex + 1} of ${q.steps.length}`) : null,
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
      renderFeedback(feedbackArea, { session, track, settings, store, onNext: () => session.next().then(draw) });
      const r = st.result;
      if (r.levelMastered) {
        const ids = track.itemsFor(q.levelNo, q.subStage ?? undefined);
        const stats = celebrationStats(r.levelState, store.getState().items, ids);
        renderCelebration(feedbackArea, { trackName: track.name, levelNo: q.levelNo, stats, onContinue: () => go('/home') });
      }
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

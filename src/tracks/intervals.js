/**
 * Track 1 — Intervals (US-3.1 … US-3.4). Item id: interval:<id>:<asc|desc|harm>.
 * A level's presentations are data (D-013): its items are pool × presentations.
 */
import { semitonesOf, isCompound, simpleOf, intervalLabel } from '../theory/intervals.js';
import { intervalExercise } from '../theory/exercise.js';
import { optionsFor } from '../learning/options.js';
import { pickRoot, selectItem } from './common.js';

export function itemId(intervalId, presentation) { return `interval:${intervalId}:${presentation}`; }
export function parseItemId(id) { const [, iv, pres] = id.split(':'); return { intervalId: iv, presentation: pres }; }

export function createIntervalsTrack(def) {
  const levelByNo = (no) => def.levels.find((l) => l.no === no);
  return {
    id: def.id,
    name: def.name,
    def,
    kind: 'single',
    itemsFor(levelNo) {
      const l = levelByNo(levelNo);
      return l.presentations.flatMap((p) => l.pool.map((iv) => itemId(iv, p)));
    },
    generate({ levelNo, progress, rng, settings, bias = null, avoid = null, recency = null }) {
      const level = levelByNo(levelNo);
      const ids = this.itemsFor(levelNo);
      const id = selectItem(rng, progress, ids, { bias, avoid, recency });
      const { intervalId, presentation } = parseItemId(id);
      const span = semitonesOf(intervalId);
      const low = pickRoot(rng, span, settings.register);
      const exercise = intervalExercise(low, span, presentation);
      const options = this.optionsFor(level, intervalId);
      return { trackId: def.id, levelNo, itemId: id, answer: intervalId, options, exercise, kind: 'single', meta: { low, span, presentation } };
    },
    optionsFor(level, answer) {
      const opts = optionsFor(level.pool, answer, level.confusables);
      // Compound intervals train against their simple equivalent (AC-3.1.3)
      if (isCompound(answer) && !opts.includes(simpleOf(answer))) opts.push(simpleOf(answer));
      return opts;
    },
    optionItemId(optionId, question) { return itemId(optionId, question.meta.presentation); },
    evaluate(question, answer) { const correct = answer === question.answer; return { correct, score: correct ? 1 : 0 }; },
    optionLabel(id, settings) { return intervalLabel(id, settings.labels?.intervals === 'full' ? 'full' : 'short'); },
    /** Exercise for an arbitrary option, for comparison replay (AC-2.4.2). */
    exerciseFor(question, optionId) { return intervalExercise(question.meta.low, semitonesOf(optionId), question.meta.presentation); },
  };
}

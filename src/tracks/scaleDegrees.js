/** Track 2 — Scale Degrees (US-4.1 … US-4.3). Item id: degree:<Do>:<major|minor>. */
import { scaleDegreeExercise } from '../theory/exercise.js';
import { degreeLabel } from '../theory/scales.js';
import { optionsFor } from '../learning/options.js';
import { pickKey, tonicMidi, selectItem } from './common.js';
import { PROFICIENCY } from '../learning/selection.js';

export function itemId(degree, mode) { return `degree:${degree}:${mode}`; }
export function parseItemId(id) { const [, degree, mode] = id.split(':'); return { degree, mode }; }

const STABLE = { Do: 3, Sol: 3, Mi: 2.5 };
const TENDENCY = ['Fa', 'Ti', 'Re', 'La', 'Me', 'Le', 'Te', 'Di', 'Ri', 'Fi', 'Si', 'Li'];

/** Extra selection weights by proficiency (AC-4.2.2, AC-4.2.3). */
export function degreeWeights(pool, accuracy) {
  const w = {};
  for (const d of pool) {
    if (accuracy < PROFICIENCY) w[itemKeyless(d)] = STABLE[d] ?? 1;
    else w[itemKeyless(d)] = TENDENCY.includes(d) ? 2.5 : 1;
  }
  return w;
}
const itemKeyless = (d) => d;

export function createScaleDegreesTrack(def) {
  const levelByNo = (no) => def.levels.find((l) => l.no === no);
  return {
    id: def.id, name: def.name, def, kind: 'single',
    itemsFor(levelNo) { const l = levelByNo(levelNo); return l.pool.map((d) => itemId(d, l.mode)); },
    generate({ levelNo, progress, rng, settings, bias = null, avoid = null, accuracy = 0, prevKey = null, withCadence = true }) {
      const level = levelByNo(levelNo);
      const ids = this.itemsFor(levelNo);
      const dw = degreeWeights(level.pool, accuracy);
      const extraWeights = Object.fromEntries(ids.map((id) => [id, dw[parseItemId(id).degree] ?? 1]));
      const id = selectItem(rng, progress, ids, { bias, avoid, extraWeights });
      const { degree, mode } = parseItemId(id);
      const key = pickKey(rng, prevKey);
      const tonic = tonicMidi(key, settings.register);
      const exercise = scaleDegreeExercise(tonic, degree, mode, { withCadence });
      const options = optionsFor(level.pool, degree, level.confusables);
      return { trackId: def.id, levelNo, subStage: null, itemId: id, answer: degree, options, exercise, kind: 'single', meta: { key, tonic, mode } };
    },
    optionItemId(optionId, question) { return itemId(optionId, question.meta.mode); },
    evaluate(question, answer) { const correct = answer === question.answer; return { correct, score: correct ? 1 : 0 }; },
    optionLabel(id, settings) { return degreeLabel(id, settings.labels?.degrees ?? 'both'); },
    exerciseFor(question, optionId) { return scaleDegreeExercise(question.meta.tonic, optionId, question.meta.mode, { withCadence: false }); },
  };
}

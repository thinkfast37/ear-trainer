/** Track 5 — Melodic Phrases (US-7.1 … US-7.3). Item id: melodic:L<n>. */
import { generatePhrase } from '../theory/melody.js';
import { melodicExercise } from '../theory/exercise.js';
import { compareSequences } from '../learning/scoring.js';
import { pickKey, tonicMidi } from './common.js';

export const DEGREE_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const SYLLABLES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do′'];

export function itemId(levelNo) { return `melodic:L${levelNo}`; }

export function createMelodicTrack(def) {
  const levelByNo = (no) => def.levels.find((l) => l.no === no);
  return {
    id: def.id, name: def.name, def, kind: 'sequence',
    itemsFor(levelNo) { return [itemId(levelNo)]; },
    generate({ levelNo, rng, settings, prevKey = null }) {
      const level = levelByNo(levelNo);
      const phrase = generatePhrase(level, rng, 'major');
      const key = pickKey(rng, prevKey);
      const tonic = tonicMidi(key, settings.register);
      const exercise = melodicExercise(tonic, phrase.degrees, phrase.rhythm, 'major');
      const answer = phrase.degrees.map(String);
      return { trackId: def.id, levelNo, itemId: itemId(levelNo), answer, options: DEGREE_OPTIONS, exercise, kind: 'sequence', meta: { key, tonic, phrase, replayLimit: level.replayLimit } };
    },
    optionItemId(_optionId, question) { return question.itemId; },
    evaluate(question, answer) { return compareSequences(answer ?? [], question.answer); },
    optionLabel(id, settings) {
      const i = Number(id) - 1;
      const mode = settings.labels?.degrees ?? 'both';
      if (mode === 'number') return id;
      if (mode === 'syllable') return SYLLABLES[i];
      return `${SYLLABLES[i]} · ${id}`;
    },
    exerciseFor(question, seq) {
      const degrees = seq.map(Number);
      return melodicExercise(question.meta.tonic, degrees, degrees.map(() => 0.5), 'major', { withPrelude: false });
    },
  };
}

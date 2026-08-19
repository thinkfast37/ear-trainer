/** Track 3 — Chord Qualities (US-5.1 … US-5.3). Item id: chord:<q>:<pres> (root) or chord:<q>:inv:<pres>. */
import { chordExercise } from '../theory/exercise.js';
import { chordSize, qualityLabel, inversionIndex, chordTones } from '../theory/chords.js';
import { optionsFor } from '../learning/options.js';
import { pickRoot, selectItem, pick } from './common.js';

export function itemId(quality, voicing, presentation) {
  return voicing === 'root' ? `chord:${quality}:${presentation}` : `chord:${quality}:inv:${presentation}`;
}
export function parseItemId(id) {
  const parts = id.split(':');
  return parts.length === 4 ? { quality: parts[1], voicing: 'inv', presentation: parts[3] } : { quality: parts[1], voicing: 'root', presentation: parts[2] };
}

export function createChordQualitiesTrack(def) {
  const levelByNo = (no) => def.levels.find((l) => l.no === no);
  return {
    id: def.id, name: def.name, def, kind: 'single',
    itemsFor(levelNo) {
      const l = levelByNo(levelNo);
      const voicings = l.voicings.some((v) => v !== 'root') ? ['root', 'inv'] : ['root'];
      const ids = [];
      for (const pres of l.presentations) for (const q of l.pool) for (const v of voicings) if (v === 'root' && l.voicings.includes('root') || v === 'inv') ids.push(itemId(q, v, pres));
      return ids;
    },
    generate({ levelNo, progress, rng, settings, bias = null, avoid = null, recency = null }) {
      const level = levelByNo(levelNo);
      const ids = this.itemsFor(levelNo);
      const id = selectItem(rng, progress, ids, { bias, avoid, recency });
      const { quality, voicing, presentation } = parseItemId(id);
      const invChoices = voicing === 'root' ? [0] : level.voicings.filter((v) => v !== 'root').map(inversionIndex).filter((i) => i < chordSize(quality));
      const inversion = pick(rng, invChoices.length ? invChoices : [1]);
      const span = 12 + (chordSize(quality) === 4 ? 4 : 0);
      const root = pickRoot(rng, span, presentation === 'varied' ? { low: settings.register.low - 5, high: settings.register.high + 5 } : settings.register);
      let exercise;
      if (presentation === 'varied') {
        // open voicing: drop the second tone an octave and lift the top for a wider spread
        const tones = chordTones(root, quality, inversion);
        const spread = tones.map((t, i) => (i === 1 ? t - 12 : t));
        exercise = { kind: 'chord', presentation: 'varied', events: spread.map((midi) => ({ midi, at: 0, dur: 1.4, gain: 0.9 })) };
      } else {
        exercise = chordExercise(root, quality, inversion, presentation === 'arp' ? 'arp' : 'block', { tempo: settings.arpeggioTempo });
      }
      const options = optionsFor(level.pool, quality, level.confusables);
      return { trackId: def.id, levelNo, itemId: id, answer: quality, options, exercise, kind: 'single', meta: { root, inversion, quality, voicing, presentation } };
    },
    optionItemId(optionId, question) { return itemId(optionId, question.meta.voicing, question.meta.presentation); },
    evaluate(question, answer) { const correct = answer === question.answer; return { correct, score: correct ? 1 : 0 }; },
    optionLabel(id, settings) { return qualityLabel(id, settings.labels?.chords ?? 'symbolAndName'); },
    exerciseFor(question, optionId, settings = { arpeggioTempo: 120 }) {
      const inv = Math.min(question.meta.inversion, chordSize(optionId) - 1);
      return chordExercise(question.meta.root, optionId, inv, question.meta.presentation === 'arp' ? 'arp' : 'block', { tempo: settings.arpeggioTempo });
    },
  };
}

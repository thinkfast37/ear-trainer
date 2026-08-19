/** Track 4 — Inversions (US-6.1 … US-6.2). Item id: inv:<q>:inv<N>:<block|arp>. */
import { chordExercise } from '../theory/exercise.js';
import { INVERSION_NAMES, qualityLabel } from '../theory/chords.js';
import { pickRoot, selectItem } from './common.js';

export function itemId(quality, inversion, presentation) { return `inv:${quality}:inv${inversion}:${presentation}`; }
export function parseItemId(id) { const [, quality, inv, presentation] = id.split(':'); return { quality, inversion: Number(inv.slice(3)), presentation }; }

export function inversionOptionLabel(id) { return INVERSION_NAMES[Number(id.slice(3))]; }

export function createInversionsTrack(def) {
  const levelByNo = (no) => def.levels.find((l) => l.no === no);
  return {
    id: def.id, name: def.name, def, kind: 'single',
    itemsFor(levelNo) {
      const l = levelByNo(levelNo);
      const ids = [];
      for (const pres of l.presentations) for (const q of l.quality) for (const i of l.inversions) ids.push(itemId(q, i, pres));
      return ids;
    },
    generate({ levelNo, progress, rng, settings, bias = null, avoid = null, recency = null }) {
      const level = levelByNo(levelNo);
      const ids = this.itemsFor(levelNo);
      const id = selectItem(rng, progress, ids, { bias, avoid, recency });
      const { quality, inversion, presentation } = parseItemId(id);
      const root = pickRoot(rng, 16, settings.register);
      const exercise = chordExercise(root, quality, inversion, presentation === 'arp' ? 'arp' : 'block', { tempo: settings.arpeggioTempo });
      const combined = level.answer === 'qualityInversion';
      const answer = combined ? `${quality}:inv${inversion}` : `inv${inversion}`;
      const options = combined
        ? level.quality.flatMap((q) => level.inversions.map((i) => `${q}:inv${i}`))
        : level.inversions.map((i) => `inv${i}`);
      return { trackId: def.id, levelNo, itemId: id, answer, options, exercise, kind: combined ? 'qualityInversion' : 'single', meta: { root, quality, inversion, combined, presentation, qualities: level.quality, inversions: level.inversions } };
    },
    optionItemId(optionId, question) {
      const [q, inv] = optionId.includes(':') ? optionId.split(':') : [question.meta.quality, optionId];
      return itemId(q, Number(inv.slice(3)), question.meta.presentation);
    },
    evaluate(question, answer) { const correct = answer === question.answer; return { correct, score: correct ? 1 : 0 }; },
    optionLabel(id, settings) {
      if (id.includes(':')) { const [q, inv] = id.split(':'); return `${qualityLabel(q, settings.labels?.chords === 'name' ? 'name' : 'symbol')} · ${inversionOptionLabel(inv)}`; }
      return inversionOptionLabel(id);
    },
    exerciseFor(question, optionId, settings = { arpeggioTempo: 120 }) {
      const [q, inv] = optionId.includes(':') ? optionId.split(':') : [question.meta.quality, optionId];
      return chordExercise(question.meta.root, q, Number(inv.slice(3)), question.meta.presentation === 'arp' ? 'arp' : 'block', { tempo: settings.arpeggioTempo });
    },
  };
}

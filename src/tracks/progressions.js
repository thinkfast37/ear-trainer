/** Track 6 — Chord Progressions (US-8.1 … US-8.5). Item id: prog:<id>[r<k>]:<texture>. */
import { numeralToChord, rotations, bassDegree, numeralLabel, parseNumeral } from '../theory/progressions.js';
import { blockVoicings, voiceLedVoicings } from '../theory/voicing.js';
import { progressionExercise } from '../theory/exercise.js';
import { compareSequences } from '../learning/scoring.js';
import { pickKey, tonicMidi, selectItem } from './common.js';

/** Rotation families carry r<k> for every rotation (including r0); plain entries carry none. */
export function itemId(entryId, rotation, texture) { return `prog:${entryId}${rotation === null || rotation === undefined ? '' : `r${rotation}`}:${texture}`; }
export function parseItemId(id) {
  const m = /^prog:(\d+)(?:r(\d+))?:(\w+)$/.exec(id);
  return { entryId: Number(m[1]), rotation: m[2] ? Number(m[2]) : 0, texture: m[3] };
}

/** Every item (entry × rotation) available at a level, for a texture. */
export function catalogItems(catalog, levelNo, texture) {
  const out = [];
  for (const e of catalog) {
    if (!e.active || e.level > levelNo) continue;
    const rots = e.rotations ? rotations(e.numerals).length : 1;
    for (let r = 0; r < rots; r++) out.push({ id: itemId(e.id, e.rotations ? r : null, texture), entry: e, rotation: r, numerals: e.rotations ? rotations(e.numerals)[r] : e.numerals });
  }
  return out;
}

/** Cumulative vocabulary through a level. */
export function vocabularyFor(def, levelNo) {
  const set = new Set();
  for (const l of def.levels) if (l.no <= levelNo) for (const v of l.vocabulary) set.add(v);
  return [...set];
}

export function bassDegreeLabel(bd) {
  return `${bd.accidental < 0 ? '♭' : bd.accidental > 0 ? '♯' : ''}${bd.number}`;
}

export function createProgressionsTrack(def, catalog) {
  const levelByNo = (no) => def.levels.find((l) => l.no === no);
  return {
    id: def.id, name: def.name, def, kind: 'numerals', catalog,
    itemsFor(levelNo, subStage = 'block') { return catalogItems(catalog, levelNo, subStage).map((c) => c.id); },
    numeralOptions(levelNo, mode) {
      const level = levelByNo(levelNo);
      const set = new Set();
      for (const c of catalogItems(catalog, levelNo, 'block')) if (c.entry.mode === mode) for (const n of c.numerals) set.add(n);
      if (level.mode === mode) for (const n of level.vocabulary) set.add(n);
      return [...set];
    },
    generate({ levelNo, subStage = 'block', progress, rng, settings, bias = null, avoid = null, prevKey = null, bassFirst = false, recency = null }) {
      const level = levelByNo(levelNo);
      const items = catalogItems(catalog, levelNo, subStage);
      const id = selectItem(rng, progress, items.map((c) => c.id), { bias, avoid, recency });
      const item = items.find((c) => c.id === id);
      const mode = item.entry.mode;
      const key = pickKey(rng, prevKey);
      const tonic = tonicMidi(key, settings.register);
      const chords = item.numerals.map((n) => numeralToChord(n, tonic, mode));
      const voiced = subStage === 'block' ? blockVoicings(chords) : voiceLedVoicings(chords, 48 + (subStage === 'arp' ? 0 : 4), 84);
      const exercise = progressionExercise(voiced, subStage === 'arp' ? 'arp' : 'block', { tonicMidi: tonic, mode }, { tempo: settings.arpeggioTempo });
      const answer = item.numerals.slice();
      const options = this.numeralOptions(levelNo, mode);
      const q = { trackId: def.id, levelNo, subStage, itemId: id, answer, options, exercise, kind: 'numerals', meta: { key, tonic, mode, entry: item.entry, rotation: item.rotation, name: item.entry.name, replayLimit: level.replayLimit } };
      if (bassFirst && level.bassFirst) {
        const bass = item.numerals.map((n) => bassDegreeLabel(bassDegree(n, mode)));
        q.steps = [
          { kind: 'bass', prompt: 'Step 1 — bass scale degrees', answer: bass, options: ['1', '2', '3', '4', '5', '6', '7', '♭2', '♭3', '♭6', '♭7', '♯4'] },
          { kind: 'numerals', prompt: 'Step 2 — roman numerals', answer, options },
        ];
      }
      return q;
    },
    optionItemId(_optionId, question) { return question.itemId; },
    evaluate(question, answer) { return compareSequences(answer ?? [], question.answer); },
    optionLabel(id) { return numeralLabel(id); },
    exerciseFor(question, seq, settings = { arpeggioTempo: 120 }) {
      const chords = seq.map((n) => numeralToChord(parseNumeral(n), question.meta.tonic, question.meta.mode));
      return progressionExercise(blockVoicings(chords), question.subStage === 'arp' ? 'arp' : 'block', { tonicMidi: question.meta.tonic, mode: question.meta.mode }, { withCadence: false, tempo: settings.arpeggioTempo });
    },
  };
}

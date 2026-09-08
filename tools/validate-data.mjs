#!/usr/bin/env node
/**
 * Validates the bundled content files against contracts/data-files.md (Constitution IX).
 * Exit non-zero on any violation. Importable: `validateAll()` returns the list of problems.
 */
import { readFileSync } from 'node:fs';
import { isInterval } from '../src/theory/intervals.js';
import { isQuality } from '../src/theory/chords.js';
import { isDegree } from '../src/theory/scales.js';
import { isNumeral } from '../src/theory/progressions.js';

/** The presentation set per presentation-bearing track (D-013). */
export const PRESENTATIONS = Object.freeze({
  intervals: ['asc', 'desc', 'harm'],
  chordQualities: ['block', 'arp', 'varied'],
  inversions: ['block', 'arp'],
  progressions: ['block', 'voiceLed', 'arp'],
});

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));

export function validateLevels(data) {
  const errs = [];
  const ids = new Set();
  const trackIds = new Set(data.tracks.map((t) => t.id));
  for (const t of data.tracks) {
    if (ids.has(t.id)) errs.push(`levels: duplicate track ${t.id}`);
    ids.add(t.id);
    for (const p of t.prerequisites ?? []) {
      if (!trackIds.has(p.track)) errs.push(`levels: ${t.id} prerequisite names unknown track ${p.track}`);
      const pt = data.tracks.find((x) => x.id === p.track);
      if (pt && !pt.levels.some((l) => l.no === p.level)) errs.push(`levels: ${t.id} prerequisite names ${p.track} level ${p.level} which does not exist`);
    }
    // Presentation is a level property (D-013); sub-stages no longer exist.
    if ('subStages' in t) errs.push(`levels: ${t.id} subStages is no longer a track field (D-013) — presentation is a level property`);
    const presSet = PRESENTATIONS[t.id];
    t.levels.forEach((l, i) => {
      if (l.no !== i + 1) errs.push(`levels: ${t.id} level numbers not contiguous at ${l.no}`);
      if (presSet) {
        if (!Array.isArray(l.presentations) || l.presentations.length === 0) errs.push(`levels: ${t.id} L${l.no} presentations must be a non-empty array`);
        else {
          for (const pr of l.presentations) if (!presSet.includes(pr)) errs.push(`levels: ${t.id} L${l.no} unknown presentation ${pr}`);
          if (new Set(l.presentations).size !== l.presentations.length) errs.push(`levels: ${t.id} L${l.no} duplicate presentation`);
        }
      } else if ('presentations' in l) errs.push(`levels: ${t.id} L${l.no} has presentations but the track has no presentation set`);
      if (t.id === 'progressions' && !(Number.isInteger(l.catalogTier) && l.catalogTier >= 1 && l.catalogTier <= 7)) errs.push(`levels: progressions L${l.no} catalogTier must be an integer 1–7`);
      const check = (id) => {
        switch (t.id) {
          case 'intervals': return isInterval(id);
          case 'scaleDegrees': return isDegree(id);
          case 'chordQualities': return isQuality(id);
          case 'progressions': return isNumeral(id);
          default: return true;
        }
      };
      for (const id of l.pool ?? l.vocabulary ?? []) if (!check(id)) errs.push(`levels: ${t.id} L${l.no} unresolvable id ${id}`);
      if (t.id === 'inversions') {
        for (const q of l.quality) if (!isQuality(q)) errs.push(`levels: inversions L${l.no} bad quality ${q}`);
        if (!['inversion', 'qualityInversion'].includes(l.answer)) errs.push(`levels: inversions L${l.no} bad answer kind`);
      }
      if (t.id === 'melodic' && !(Array.isArray(l.notes) && l.notes.length === 2)) errs.push(`levels: melodic L${l.no} notes must be [min,max]`);
      if (!Array.isArray(l.confusables)) errs.push(`levels: ${t.id} L${l.no} confusables missing`);
      if (!('replayLimit' in l)) errs.push(`levels: ${t.id} L${l.no} replayLimit missing`);
      if (t.id === 'scaleDegrees') {
        if (!['auto', 'onDemand', 'none'].includes(l.scaleReference)) errs.push(`levels: scaleDegrees L${l.no} scaleReference must be auto | onDemand | none`);
        else if (l.mode !== 'major' && l.scaleReference !== 'none') errs.push(`levels: scaleDegrees L${l.no} scaleReference must be none in ${l.mode} keys`);
      }
    });
  }
  return errs;
}

export function validateProgressions(cat) {
  const errs = [];
  const seen = new Set();
  for (const e of cat) {
    if (seen.has(e.id)) errs.push(`progressions: duplicate id ${e.id}`);
    seen.add(e.id);
    if (!(e.level >= 1 && e.level <= 7)) errs.push(`progressions: #${e.id} level out of range`);
    for (const n of e.numerals) if (!isNumeral(n)) errs.push(`progressions: #${e.id} bad numeral ${n}`);
    if (e.rotations && e.numerals.length < 3) errs.push(`progressions: #${e.id} rotations need ≥ 3 numerals`);
    if (!e.name) errs.push(`progressions: #${e.id} missing name`);
  }
  for (let i = 1; i <= 52; i++) if (!seen.has(i)) errs.push(`progressions: missing id ${i}`);
  return errs;
}

/**
 * A cue a learner can actually find by ear (AC-3.4.7): it quotes the words, names the pitches,
 * or counts the notes. "opening" and "heard harmonically" name nothing and are rejected — that
 * is how entries like "Jazz 13th chords — heard harmonically" got in.
 */
const CUE_QUOTES_WORDS = /["“”]/;
const CUE_NAMES_PITCHES = /\b[A-G][♯♭#b]?\b/;
const CUE_COUNTS_NOTES = /\b(?:first|second|third|fourth|fifth|last|one|two|three|four|five)\b[^.]*\bnotes?\b/i;
const CUE_NUMBERS_NOTES = /\bnotes?\s*\d/i;
export function cueIsSpecific(cue) {
  return CUE_QUOTES_WORDS.test(cue) || CUE_NAMES_PITCHES.test(cue) || CUE_COUNTS_NOTES.test(cue) || CUE_NUMBERS_NOTES.test(cue);
}

export function validateAnchors(a) {
  const errs = [];
  const simple = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
  const compound = ['m9', 'M9', 'm10', 'M10', 'P11', 'P12', 'm13', 'M13'];
  // Anchors are stored per direction (2026-09-08). Direction is the key, never a field on the
  // entry: a single mixed list let an entry's direction disagree with how it was shown.
  const checkEntries = (id, list, where) => {
    if (!Array.isArray(list) || list.length < 1 || list.length > 5) errs.push(`anchors: ${id}.${where} needs 1–5 entries`);
    for (const e of list ?? []) {
      if (!e.title || !e.cue) errs.push(`anchors: ${id}.${where} entry malformed`);
      else if (!cueIsSpecific(e.cue)) errs.push(`anchors: ${id}.${where} cue for "${e.title}" names neither notes nor words`);
      if ('direction' in e) errs.push(`anchors: ${id}.${where} entry carries a direction field; direction is the key`);
    }
  };
  for (const id of simple) {
    const entry = a[id];
    if (!entry || Array.isArray(entry) || typeof entry !== 'object') { errs.push(`anchors: ${id} needs asc and desc lists`); continue; }
    for (const dir of ['asc', 'desc']) checkEntries(id, entry[dir], dir);
  }
  for (const id of compound) {
    const c = a[id];
    if (!c || !simple.includes(c.simple)) errs.push(`anchors: ${id} needs a simple equivalent`);
    if (!Array.isArray(c?.examples)) errs.push(`anchors: ${id} needs examples[]`);
    for (const e of c?.examples ?? []) {
      if (!e.title || !e.cue) errs.push(`anchors: ${id} example malformed`);
      else if (!cueIsSpecific(e.cue)) errs.push(`anchors: ${id} cue for "${e.title}" names neither notes nor words`);
    }
  }
  return errs;
}

export function validateCredits(c) {
  const errs = [];
  if (!Array.isArray(c) || c.length === 0) errs.push('credits: empty');
  for (const e of c ?? []) for (const k of ['asset', 'author', 'source', 'licence']) if (!e[k]) errs.push(`credits: ${e.asset ?? '?'} missing ${k}`);
  return errs;
}

export function validateAll() {
  return [
    ...validateLevels(read('src/data/levels.json')),
    ...validateProgressions(read('src/data/progressions.json')),
    ...validateAnchors(read('src/data/anchors.json')),
    ...validateCredits(read('src/data/credits.json')),
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errs = validateAll();
  if (errs.length) { for (const e of errs) console.error(`validate-data: ${e}`); process.exit(1); }
  console.log('validate-data: OK');
}

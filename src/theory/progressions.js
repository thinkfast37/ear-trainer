/**
 * Roman numerals → chords in a key. Grammar (ASCII, as stored in progressions.json):
 *   [b|#]? ROMAN (maj7|m7b5|dim7|7|o|+|sus2|sus4)? (6|64|65|43|42)?
 * Case gives triad quality (upper = major, lower = minor) unless a quality suffix says otherwise;
 * `o` = diminished, `+` = augmented. In minor keys, degrees are read against natural minor
 * (III, VI, VII natural) except V/V7/vii-o which use the raised leading tone.
 */
import { MAJOR, MINOR } from './scales.js';
import { chordTones, chordSize } from './chords.js';

const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7 };
const RE = /^([b#]?)(vii|vi|iv|v|iii|ii|i|VII|VI|IV|V|III|II|I)(maj7|m7b5|dim7|7|o|\+|sus2|sus4)?(64|65|43|42|6)?$/;
const INV_OF = { undefined: 0, 6: 1, 64: 2, 65: 1, 43: 2, 42: 3 };

export function parseNumeral(raw) {
  const m = RE.exec(raw.trim());
  if (!m) throw new Error(`bad roman numeral ${raw}`);
  const [, acc, roman, suffix, figure] = m;
  const degree = ROMAN[roman.toLowerCase()];
  const upper = roman === roman.toUpperCase();
  let quality;
  switch (suffix) {
    case 'maj7': quality = 'maj7'; break;
    case 'm7b5': quality = 'm7b5'; break;
    case 'dim7': quality = 'dim7'; break;
    case '7': quality = upper ? 'dom7' : 'm7'; break;
    case 'o': quality = 'dim'; break;
    case '+': quality = 'aug'; break;
    case 'sus2': quality = 'sus2'; break;
    case 'sus4': quality = 'sus4'; break;
    default: quality = upper ? 'maj' : 'min';
  }
  const inversion = INV_OF[figure];
  return { raw: raw.trim(), degree, accidental: acc === 'b' ? -1 : acc === '#' ? 1 : 0, quality, inversion, upper };
}

export function isNumeral(raw) { return RE.test(String(raw).trim()); }

/** Root MIDI (relative to tonic MIDI) for a parsed numeral in a mode. */
export function numeralRoot(parsed, tonicMidi, mode = 'major') {
  const scale = mode === 'minor' ? MINOR : MAJOR;
  let semis = scale[parsed.degree - 1] + parsed.accidental;
  // borrowed major-mode chords in minor: V and V7 raise the 7th; III/VI/VII stay natural.
  return tonicMidi + semis;
}

/** Full chord for a numeral in a key: {root, quality, inversion, tones}. */
export function numeralToChord(raw, tonicMidi, mode = 'major') {
  const p = typeof raw === 'string' ? parseNumeral(raw) : raw;
  const root = numeralRoot(p, tonicMidi, mode);
  const tones = chordTones(root, p.quality, p.inversion);
  return { numeral: p.raw, root, quality: p.quality, inversion: p.inversion, tones, bass: tones[0] };
}

/** All cyclic rotations of a numeral list, starting from the original. */
export function rotations(numerals) {
  const out = [];
  for (let k = 0; k < numerals.length; k++) out.push([...numerals.slice(k), ...numerals.slice(0, k)]);
  return out;
}

/** The scale-degree number (1..7, with accidental) of the bass note of a numeral. */
export function bassDegree(raw, mode = 'major') {
  const p = typeof raw === 'string' ? parseNumeral(raw) : raw;
  const n = chordSize(p.quality);
  const inv = p.inversion % n;
  const scale = mode === 'minor' ? MINOR : MAJOR;
  const rootSemis = scale[p.degree - 1] + p.accidental;
  const tones = chordTones(0, p.quality, 0);
  const bassSemis = (rootSemis + tones[inv]) % 12;
  // nearest diatonic degree; a chromatic bass is spelled with the numeral's own accidental sign
  for (let d = 0; d < 7; d++) if (scale[d] === bassSemis) return { number: d + 1, accidental: 0 };
  const order = p.accidental < 0 ? [-1, 1] : [1, -1];
  for (const acc of order) for (let d = 0; d < 7; d++) if (scale[d] + acc === bassSemis) return { number: d + 1, accidental: acc };
  return { number: 1, accidental: 0 };
}

/** Human label for a numeral (unicode flats/superscripts) for display. */
export function numeralLabel(raw) {
  return raw.replace(/^b/, '♭').replace(/^#/, '♯').replace(/m7b5/, 'm7♭5').replace(/64$/, '⁶⁴').replace(/6$/, '⁶');
}

# Contracts: bundled data files and the test hook

The application has no network API. Its external contracts are (a) the three bundled JSON
content files, which a content author edits without code changes (Constitution IX), (b) the
exported progress file, and (c) the `window.__test` hook that e2e tests read.

## `src/data/levels.json`

```jsonc
{ "tracks": [ {
    "id": "intervals|scaleDegrees|chordQualities|inversions|melodic|progressions",
    "name": "string",
    "prerequisites": [ { "track": "chordQualities", "level": 1 } ],   // may be empty
    "cadence": true,                     // cadence prelude on by default for this track
    "subStages": ["asc","desc","harm"],  // may be empty; order = unlock order
    "answerKind": "single|sequence|qualityInversion|numerals",
    "levels": [ {
        "no": 1,
        "pool": ["P8","P5"],             // intervals / degrees / qualities: option ids
        "voicings": ["root","inv1","inv2","inv3"],   // chordQualities only
        "quality": ["maj"], "inversions": [0,1,2],  // inversions track only
        "answer": "inversion|qualityInversion",     // inversions track only
        "notes": [3,3], "motion": "step|third|leap5|any", "startOnDo": true, "rhythm": "even8|mixed|syncopated", // melodic
        "vocabulary": ["I","IV","V"], "bassFirst": false, "mode": "major|minor",           // progressions
        "mixedReview": false,
        "confusables": [["P4","P5"]],
        "replayLimit": 3                 // or null = unlimited
    } ] } ] }
```
Validation (`tools/validate-data.mjs`): ids unique; every prerequisite names an existing
track/level; every pool id resolvable by `theory/`; sub-stage lists non-empty when named;
level numbers contiguous from 1.

## `src/data/progressions.json`

```jsonc
[ { "id": 8, "numerals": ["I","V","vi","IV"], "level": 2, "name": "Axis",
    "rotations": true, "mode": "major", "active": true } ]
```
Validation: ids unique 1..52; every numeral parses via `theory/progressions.js`; `level`
1..7; a `rotations: true` entry has ≥ 3 numerals.

## `src/data/anchors.json`

```jsonc
{ "m2": [ { "title": "Jaws theme", "cue": "the two-note motif", "direction": "asc|desc", "playsMotif": false } ],
  "m9": { "simple": "m2", "examples": [ { "title": "…", "cue": "…" } ] } }
```
Validation: every simple interval id (m2 … P8) present with 1–5 entries; every compound id
(m9 … M13) present with a `simple` that exists.

## Export file

The persisted Progress document verbatim (see [data-model.md](../data-model.md)), served as
`ear-trainer-progress-<YYYY-MM-DD>.json`. Import accepts only `schemaVersion` ≤ the app's.

## `window.__test` (test builds only)

```js
window.__test = {
  audioLog: [],           // every scheduled note: { midi, at, dur } from the fake/real ctx
  store,                  // the live store: getState(), dispatch(), subscribe()
  seed(n),                // reseed the PRNG
  clock: { now() }        // AudioContext.currentTime proxy
};
```
Present only when `import.meta.env.MODE === 'test'`; production builds do not define it.

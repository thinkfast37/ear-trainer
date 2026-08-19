# Data Model: Ear Trainer

## Progress document (persisted; `schemaVersion: 2` — 2026-08-18: was 1; a v1 document is reset on load, D-007/D-013)

```jsonc
{
  "schemaVersion": 2,
  "items": {
    "interval:m6:desc": { "box": 2, "attempts": 12, "correct": 9, "lastSeen": 1755500000000,
                          "confusions": { "M6": 2, "P5": 1 } }
  },
  "levels": {
    "intervals:2": { "mastered": true, "masteredAt": 1755500000000,
                     "history": [ { "item": "interval:m3:asc", "correct": true, "at": 1755500000000, "replays": 1, "score": 1 } ] }
  },
  "xp": 1240,
  "streak": { "current": 4, "best": 9, "lastCompletedDay": "2026-08-17" },
  "days": { "2026-08-17": { "questions": 31, "seconds": 540, "complete": true } },
  "sessions": [ { "id": "s1", "trackId": "intervals", "levelNo": 2, "mixed": false,
                  "startedAt": 1, "endedAt": 2, "questions": 30, "correct": 27, "replays": 12 } ],
  "settings": {
    "cadenceFrequency": "everyQuestion",           // everyQuestion | firstOnly | never
    "replayLimit": 3,
    "arpeggioTempo": 120,
    "register": { "low": 48, "high": 72 },
    "labels": { "degrees": "both", "chords": "symbolAndName", "intervals": "short" },
    "sessionGoal": { "minutes": 10, "questions": 30 },
    "notifications": { "enabled": false, "hour": 19 }
  },
  "guidance": { "scaleDegrees": true }              // per-track first-open guidance dismissed (US-4.5, added 2026-08-18)
}
```

Rules:
- `items` keys are `<track>:<thing>:<presentation>`; box ∈ 1..5; `confusions` counts wrong
  answers by option id.
- `levels[<trackId>:<levelNo>].history` keeps at most the last 200 answers (rolling accuracy
  needs 20; the trend view needs dated history, which `days` and `sessions` also carry).
- `days` keys are local-date ISO strings.
- Level state has no sub-stage fields (2026-08-18, D-013): a level's presentation is data,
  not progress. Loading a `schemaVersion` < 2 document discards everything but `settings` and
  writes a fresh v2 document (AC-10.3.4/1); importing one is rejected (AC-10.3.4/2).
- Import merge (AC-10.3.3/2): per item, the record with the newer `lastSeen` wins; `levels`
  mastered = OR; `xp` = max; `streak.best` = max; `days` = union taking the larger counts;
  `sessions` = union by id; `settings` = local wins.
- `guidance` holds per-track "first-open guidance dismissed" flags; a progress reset clears it
  (US-4.5). Import: local wins.

## Levels data (`src/data/levels.json`)

```jsonc
{
  "tracks": [
    { "id": "intervals", "name": "Intervals", "prerequisites": [],
      "cadence": false, "answerKind": "single",
      "levels": [
        { "no": 1, "presentations": ["asc"], "pool": ["P8", "P5"], "mixedReview": false,
          "confusables": [["P8","P5"]], "replayLimit": null },
        { "no": 10, "presentations": ["asc", "desc"], "pool": ["P8", "P5", "…"] }   // a mixed level lists several
      ] },
    { "id": "scaleDegrees", "cadence": true, "levels": [ { "no": 1, "pool": ["Do","Mi","Sol"], "mode": "major",
          "scaleReference": "auto" } ] },   // auto | onDemand | none — scale scaffold policy (US-4.4); must be none in minor keys
    { "id": "chordQualities", "levels": [ { "no": 1, "presentations": ["block"], "pool": ["maj","min"], "voicings": ["root"] } ] },
    { "id": "inversions", "prerequisites": [{ "track": "chordQualities", "level": 1 }],
      "levels": [ { "no": 1, "presentations": ["block"], "quality": ["maj"], "inversions": [0,1,2], "answer": "inversion" } ] },
    { "id": "melodic", "cadence": true, "levels": [ { "no": 1, "notes": [3,3], "motion": "step", "startOnDo": true, "rhythm": "even8" } ] },
    { "id": "progressions", "prerequisites": [{ "track": "chordQualities", "level": 6 }, { "track": "inversions", "level": 1 }],
      "levels": [ { "no": 1, "presentations": ["block"], "catalogTier": 1, "vocabulary": ["I","IV","V"], "bassFirst": false } ] }
  ]
}
```

Rules (2026-08-18, D-013): no track has `subStages`. Every level of intervals, chordQualities,
inversions and progressions carries `presentations` — a non-empty list drawn from that track's
presentation set (intervals `asc|desc|harm`; chordQualities `block|arp|varied`; inversions
`block|arp`; progressions `block|voiceLed|arp`); the level's items are its pool × presentations.
Progression levels carry `catalogTier` (1–7): entries with catalog `level` ≤ `catalogTier` are
in the pool. `tools/validate-data.mjs` enforces all of this.

## Progression catalog (`src/data/progressions.json`)

```jsonc
[ { "id": 8, "numerals": ["I","V","vi","IV"], "level": 2, "name": "Axis", "rotations": true,
    "mode": "major", "active": true } ]
```
`level` here is the entry's Appendix A **catalog tier** (2026-08-18); a progression level's
`catalogTier` selects entries with `level` ≤ it.
Rotations, when `rotations: true`, are generated as items `prog:<id>r<k>:<texture>`.

## Anchors (`src/data/anchors.json`)

```jsonc
{ "m2": [ { "title": "Jaws theme", "cue": "the two-note motif", "direction": "asc", "playsMotif": true } ],
  "m9": { "simple": "m2", "examples": [ { "title": "…", "cue": "…" } ] } }
```

## Exercise (in memory; stored on a Question for replay)

```jsonc
{ "kind": "interval", "presentation": "asc", "key": null,
  "events": [ { "midi": 60, "at": 0, "dur": 0.8, "gain": 1 }, { "midi": 68, "at": 0.9, "dur": 0.8, "gain": 1 } ],
  "prelude": { "events": [ /* cadence chords */ ] } }
```

## Question (in memory)

```jsonc
{ "id": "q1", "trackId": "intervals", "levelNo": 2, "itemId": "interval:m6:asc",
  "answer": "m6", "options": ["P8","P5","M3","m3","m6","M6"], "exercise": { }, "replays": 0,
  "startedAt": 0, "sequence": null, "steps": null }
```
For sequence tracks `answer` is an array; for inversion level 3 it is `{quality, inversion}`;
for bass-first it has `steps: [{kind:'bass', answer:[...]},{kind:'numerals', answer:[...]}]`.

## Score

- Single-answer: 1 or 0.
- Sequence: matches / max(len(answer), len(target)).
- Replay factor: `1 − 0.1 × replaysUsed` floored at 0.5, applied to the question score for
  the level history and to XP.
- XP: base 10 × score × replayFactor × streakMultiplier(1 + 0.1 × min(streak,10)) × (mixed
  review ? 1.5 : 1).

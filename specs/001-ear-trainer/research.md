# Research: Ear Trainer — technical decisions

Each decision is numbered `D-00x`. A change that contradicts one is an **Approach change**
(CLAUDE.md §2): amend the entry here with the reversal and its reasoning before touching code.

## D-001 — Plain ES-module JavaScript with Vite; no UI framework, no TypeScript

**Decision**: the application is written in plain ES-module JavaScript, bundled by Vite. UI
is hand-rolled DOM built by small render functions per screen, with a hash router.

**Why**: the traceability (`check:trace`) and reachability (`check:unwired`) tooling reads
`.js`; the surface is ~10 screens with simple state; a framework adds a build-time dependency
that Capacitor does not need. Vite gives dev server, static build to `dist/`, and asset
hashing for free.

**Rejected**: React/Preact (build weight, tooling would need `.jsx` support in
`check-unwired`); Svelte (same); TypeScript (tooling reads `.js` only; adopting it is a
constitution amendment, Platform & Content Constraints).

## D-002 — Sample-based piano via Web Audio, ≤ 5 MB, nearest-sample pitch shifting

**Decision**: a multi-sample piano — one sample every minor third from C2 to C6 (17
samples), mono, encoded as low-bitrate MP3 or OGG (~48–64 kbps, ~4 s each) — decoded once
into `AudioBuffer`s. Each note picks the nearest sample by semitone distance and sets
`playbackRate = 2^(Δsemitones/12)`. An `GainNode` envelope (2 ms attack, release 60 ms) is
applied per note to prevent clicks. Source samples: a CC-licensed set (Salamander Grand
Piano, CC BY 3.0, via the trimmed set distributed with tonejs-instruments) — licence and
attribution recorded in `public/samples/LICENSE.md`. **Acquisition of the samples needs the
maintainer's go-ahead (a download); until then `tools/gen-samples.mjs` can synthesise a
placeholder set of the same file names so every path is exercisable.**

**Why**: ±1.5 semitone shifts are inaudible as artifacts on piano; 17 short mono files fit
comfortably under 5 MB; buffers-in-memory means zero network at play time.

**Rejected**: synthesised piano (fails "realistic"); one sample per note (size); a
SoundFont/`Tone.js` (dependency, and its scheduler hides the Web Audio clock we must prove
we use).

## D-003 — A single renderer over a neutral exercise object

**Decision**: every track produces an `Exercise` `{ events: [{midi, at, dur, gain}], key,
presentation, prelude?: Exercise }` and `renderer.play(exercise, atTime)` schedules it on
`AudioContext.currentTime`. Track modules build exercises through `theory/` helpers; the
renderer never knows what an interval is. The exercise object is stored on the question, so
replay is bit-identical (AC-1.3.3, AC-2.4.3).

**Rejected**: per-track playback code (drift, replay mismatch).

## D-004 — Scheduling on the Web Audio clock; a testable clock seam

**Decision**: `scheduler.schedule(events, startTime)` computes absolute `AudioContext` times
and calls `source.start(t)`. There is no `setTimeout` in the audio path. Tests use a fake
`AudioContext` (`tests/unit/audio/fakeAudioContext.js`) recording `start(t)` calls, and an
`OfflineAudioContext` render for onset accuracy (AC-1.2.2/2).

## D-005 — Unlock/resume the AudioContext on first gesture, resume on visibility/return

**Decision**: `audio/context.js` installs a one-time `pointerdown`/`touchend`/`keydown`
listener that calls `ctx.resume()`; a `visibilitychange` listener plus a resume-before-play
guard in `renderer.play` handles return from background (AC-1.2.1, AC-1.2.3).

## D-006 — Leitner: 5 boxes, +1 on correct, →1 on incorrect, weight = 6 − box

**Decision**: boxes 1–5. Correct → min(box+1, 5). Incorrect → 1. Selection weight per item is
`6 − box` (5,4,3,2,1). Rolling accuracy = correct/answered over the last 20 answers in the
level (or sub-stage). Mastery = ≥ 20 answers, accuracy ≥ 90%, every item ≥ box 3. Confusion
bias: above 75% rolling accuracy, after a wrong answer on item X answered as Y where (X,Y) is
a declared confusable pair, both X and Y get a ×4 weight for the next 5 questions.

**Amended 2026-08-18 (during implementation of AC-3.1.2/1)**: selection weight is additionally
multiplied by a recency factor `1 + min(questionsSinceAsked, 20) / 10` within a session
(never-asked = ×3), so a 20-item pool is reliably covered inside 50 questions. Leitner
weighting still dominates; recency only stops an item being starved.

**Amended 2026-08-18 (presentation tiers, D-013)**: the flat 20-answer minimum is replaced
by `max(10, 3 × N)` where N is the number of Leitner items in the level (AC-2.2.4). The
rolling-accuracy window stays 20. Reasoning: a flat floor cost a two-item level the same as
a twelve-item one, so the smallest levels were the most tedious (level 1 of intervals needed
60 answers on P5/P8 across its three sub-stages); the box floor already forces at least two
correct answers per item, so 3× keeps small levels short without letting large ones be
mastered on a thin sample. 5× was considered and rejected — it made the last progression
level a 290-answer minimum. Sub-stage mastery no longer exists (D-013).

**Why**: simple, explainable, deterministic to test with a seeded PRNG (`learning/random.js`,
mulberry32).

## D-007 — Storage: one JSON document, `schemaVersion`, adapter for web/native

**Decision**: the whole `Progress` document is one JSON blob under key `ear-trainer/progress`
in `localStorage`; on Capacitor, the same blob under the same key in `@capacitor/preferences`.
`storage/storage.js` exposes `load()/save()` and picks the adapter by
`Capacitor.isNativePlatform()`. Writes are debounced (50 ms) and flushed on
`visibilitychange`. Export = the same document; import merges items by `lastSeen` (newer
wins), unions day logs, keeps the max streak, and rejects unknown/newer `schemaVersion`.

**Amended 2026-08-18 (presentation tiers, D-013)**: `schemaVersion` becomes 2. A stored
document with `schemaVersion` < 2 is not migrated: its learning state is discarded on load and
a fresh document is written keeping only `settings` (AC-10.3.4/1); an import file with
`schemaVersion` < 2 is rejected naming both versions (AC-10.3.4/2). Reasoning: levels were
renumbered in four tracks and sub-stage state removed, so a migration could only guess which
new level an old answer belonged to; the maintainer accepted the reset. Later schema changes
should migrate where a faithful mapping exists.

## D-008 — Layout: two breakpoints, phone < 600 px ≤ tablet; desktop = tablet

**Decision**: CSS custom properties + `@media (min-width: 600px)`. No hover styles at all
(`:hover` is banned by a stylelint-free grep in `npm run lint`). Session state lives in the
store, not the DOM, so rotation is a re-render (AC-10.1.4).

## D-009 — Testing: Vitest (node + jsdom for `tests/unit/ui/`), Playwright for e2e

**Decision**: pure logic under `tests/unit/<area>/`, DOM-level component tests under
`tests/unit/ui/` (jsdom environment via `// @vitest-environment jsdom`), full-app flows under
`tests/e2e/` (Playwright, Chromium, mobile and tablet projects). e2e runs against `vite
preview` of the production build so AC-10.1.5/1 is proved by the same run. Playwright can set
viewport and emulate touch; a `window.__test` hook (only when `import.meta.env.MODE ===
'test'`) exposes the fake-audio event log and the store for assertions.

## D-010 — Capacitor for iOS/Android; local notifications via `@capacitor/local-notifications`

**Decision**: `capacitor.config.json` with `webDir: dist`. Native projects are generated by
`npx cap add ios|android` on the maintainer's machine and are not committed in this feature.
Reminder scheduling (AC-9.2.3) is behind `platform/notifications.js` which is a no-op on the
web. AC-10.2.x that need a device (offline session, native persistence) are proved at the
adapter/contract level in unit tests plus a documented manual device checklist in
`quickstart.md`.

## D-011 — Content as bundled JSON, validated at build

**Decision**: `src/data/levels.json` (every track's levels, pools, presentations — 2026-08-18:
was sub-stages, see D-013 — prerequisites, confusables, replay limits), `src/data/progressions.json` (Appendix A), `src/data/anchors.json`
(Appendix B). `tools/validate-data.mjs` runs under `npm run lint` and fails on a malformed
entry.

## D-012 — Music theory in-house

**Decision**: `theory/` implements MIDI ↔ pitch, interval semitones, chord formulas and
inversions, keys/scales/solfège (movable-do, chromatic syllables), roman numeral → chord in
key (major and minor, borrowed, sevenths, bass inversions), and voice-leading for progression
textures. No external theory library.

**Why**: the requirements are precise and small; a library brings its own naming and would
still need wrapping.

## D-013 — Presentation is a level property; levels are ordered by presentation difficulty

**Decision (2026-08-18)**: no track has sub-stages. Every level of a presentation-bearing
track carries `presentations: [...]` (intervals: `asc` | `desc` | `harm`; chord qualities:
`block` | `arp` | `varied`; inversions: `block` | `arp`; progressions: `block` | `voiceLed` |
`arp`); the level's Leitner items are its pool crossed with its presentations, and a
multi-entry list (interval levels 10 and 16) is how a mixed level is expressed. Levels are
ordered presentation-first — ascending < descending < harmonic; block < arpeggiated < varied;
block < voice-led < arpeggiated — with the pool re-growing inside each tier (spec AC-3.1.1,
AC-5.1.1, AC-6.2.1, AC-8.2.1). Progression levels name the highest catalog tier they draw on
(`catalogTier`) because level number and Appendix A tier no longer coincide above level 7.
`learning/subStages.js` and the `subStage`/`subStages` fields of level state are removed;
level state is `{ mastered, masteredAt, history }`.

**Why**: the maintainer's guidance is that presentation is the primary difficulty axis and a
level should have one objective. Pool-major levels cycling every presentation gave
levels × forms mastery gates and held a learner on P5/P8 for three sub-stages before a third
interval was heard. The block-before-arpeggiated order for chords is kept from the original
spec — arpeggiated is arguably the easier form for quality identification, but reversing it
was not part of the decision and can be revisited as data.

**Rejected**: keeping sub-stages but relaxing only their mastery gate (still 36 gates on
intervals; does not make a level one difficulty); presentation-major with a per-level
migration of stored progress (no faithful mapping from old level N sub-stage S to a new
level — see D-007 amendment).


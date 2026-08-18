# Tasks: Ear Trainer

**Input**: Design documents from `specs/001-ear-trainer/` — plan.md (Traceability Matrix
P-001–P-042), spec.md (US-1.1 … US-10.4, AC-x.y.z with Cases), research.md (D-001–D-012),
data-model.md, contracts/data-files.md, quickstart.md.

**Tests**: REQUIRED (Constitution III). Every plan item carrying ACs has an implementation
task and a test task, numbered exactly as plan.md's matrix says. Every test is named for its
criterion verbatim — `it('AC-1.1.1/1 — The nearest sample is chosen and pitch-shifted to the
target note', …)` — and every UI-level criterion (one naming a button, screen, tap, view,
map, layout …) has its test in `tests/e2e/` or `tests/unit/ui/`. `npm run check:trace` is the
arbiter; a task is not done until its criteria are 🟢 in `specs/traceability-matrix.md`.

**Organization**: Setup → Foundational → one phase per user story in build-dependency order
(the order in spec.md) → Polish. Story labels are `[USe.s]`.

## Format: `- [ ] Tnnn [P?] [USe.s?] Description with `file/paths` and AC IDs`

---

## Phase 1: Setup (P-001)

- [X] T001 Vite scaffold: `package.json` (scripts dev/build/preview/lint/test/test:e2e, deps: vite, vitest, jsdom, @playwright/test, eslint, @capacitor/core, @capacitor/preferences, @capacitor/local-notifications), `vite.config.js`, `index.html`, `src/main.js` (composition root stub), `src/styles.css`
- [X] T002 [P] Lint: `eslint.config.js` (flat config, ES2022 modules, browser + node globals) and `tools/lint-extras.mjs` (fails on `:hover` in any CSS, runs `tools/validate-data.mjs`, fails when a media directory under `public/` lacks `LICENSE.md`); wire `npm run lint`
- [X] T003 [P] Playwright: `playwright.config.js` (phone 375×812 touch and tablet 1024×768 projects, `webServer: vite preview --mode test`, baseURL) and `tests/e2e/helpers.js` (goto, tapToUnlock, seed, readAudioLog)
- [X] T004 [P] Vitest: extend `vitest.config.js` include to cover every unit test under tests/unit; `tests/unit/ui/` files opt into jsdom via `// @vitest-environment jsdom`; add `tests/unit/ui/dom.js` (mount helper)
- [X] T005 [P] Fake AudioContext test double `tests/unit/audio/fakeAudioContext.js` (records `createBufferSource().start(t)`, gain envelopes, `currentTime`, `state`, `resume()`), plus `tests/unit/audio/offlineRender.js` helper for onset measurement

## Phase 2: Foundational (P-002 – P-005) — blocks every story

- [X] T006 [P] Levels data `src/data/levels.json`: all six tracks with every level's pool/voicings/inversions/melodic constraints/vocabulary, sub-stage lists, prerequisites, confusable pairs, replay limits, mixedReview flags, per contracts/data-files.md (Epics 3–8)
- [X] T007 [P] Catalog and anchors data `src/data/progressions.json` (Appendix A, 52 entries with level/name/rotations/mode/active) and `src/data/anchors.json` (Appendix B, simple + compound with `simple` links)
- [X] T008 Data validator `tools/validate-data.mjs` per contracts/data-files.md; exits non-zero on any violation; invoked by `tools/lint-extras.mjs`
- [X] T009 Tests for data files and validator in `tests/unit/data/levels.test.js`, `tests/unit/data/progressions.test.js`, `tests/unit/data/anchors.test.js`, `tests/unit/data/validate.test.js`
- [X] T010 [P] Theory core `src/theory/notes.js` (midi↔name, octave, clamp to register) and `src/theory/intervals.js` (ids m2…M13, semitones, simple↔compound, labels short/full)
- [X] T011 [P] Theory harmony `src/theory/chords.js` (quality formulas maj/min/dim/aug/dom7/maj7/m7/m7b5/dim7/sus2/sus4, inversions 0–3, close voicing, labels symbol/name) and `src/theory/scales.js` (12 keys, major/minor, degrees, solfège incl. chromatic movable-do, degree↔midi)
- [X] T012 Theory progressions `src/theory/progressions.js` (roman numeral parse incl. ♭VII, iv, 7ths, ⁶/⁶⁴ bass inversions; numeral→chord in key; rotations), `src/theory/cadence.js` (I–IV–V–I major, i–iv–V–i minor, tonic reference), `src/theory/voicing.js` (identical block, voice-led with register variation, arpeggio/strum event expansion), `src/theory/melody.js` (constrained phrase generator per level rules)
- [X] T013 Theory tests `tests/unit/theory/notes.test.js`, `tests/unit/theory/intervals.test.js`, `tests/unit/theory/chords.test.js`, `tests/unit/theory/scales.test.js`, `tests/unit/theory/progressions.test.js`, `tests/unit/theory/voicing.test.js`, `tests/unit/theory/melody.test.js`
- [X] T014 Store and storage: `src/learning/random.js` (seedable mulberry32), `src/app/store.js` (state, dispatch, subscribe, debounced persist), `src/storage/schema.js` (schemaVersion 1, empty document, validate), `src/storage/storage.js` (localStorage adapter + Capacitor Preferences adapter selected by platform, load/save)
- [X] T015 Store/storage tests `tests/unit/storage/schema.test.js`, `tests/unit/storage/storage.test.js`, `tests/unit/app/store.test.js`
- [X] T016 App shell: `src/app/router.js` (hash routes: home, level, session, feedback, stats, settings, reference), `src/ui/dom.js` (h(), on(), mount), `src/ui/layout.js` (app frame, header/nav, phone/tablet container), `src/styles.css` (tokens, breakpoints, ≥44 px controls, no `:hover`), wire in `src/main.js`
- [X] T017 Shell tests `tests/unit/ui/router.test.js`, `tests/unit/ui/layout.test.js`

**Checkpoint**: data validates, theory tests green, store persists, shell routes render.

---

## Phase 3: US-1.1 — Piano playback (P-006)

- [X] T018 [US1.1] Sampler `src/audio/sampler.js` (load 17 bundled samples from `public/samples/`, decode once, nearest-sample selection, playbackRate pitch shift, per-note gain envelope), `tools/gen-samples.mjs` (synthesises the placeholder set with the real file names until licensed samples land), `public/samples/LICENSE.md`; wire in `src/main.js`. AC-1.1.1, AC-1.1.2
- [X] T019 [US1.1] Tests `tests/unit/audio/sampler.test.js` (AC-1.1.1/1, AC-1.1.1/3, AC-1.1.2) and `tests/e2e/audio.spec.js` (AC-1.1.1/2 — no network request during playback), named verbatim

## Phase 4: US-1.2 — Mobile-safe audio initialization (P-007)

- [X] T020 [US1.2] `src/audio/context.js` (create/get context, first-gesture unlock listeners, visibilitychange resume, `ensureRunning()`), `src/audio/scheduler.js` (absolute-time scheduling on `ctx.currentTime`, no timers); wire in `src/main.js`. AC-1.2.1–AC-1.2.3
- [X] T021 [US1.2] Tests `tests/unit/audio/scheduler.test.js` (AC-1.2.2/1, AC-1.2.2/2 via offline render), `tests/unit/ui/audioUnlock.test.js` (AC-1.2.1 tap unlock, AC-1.2.3 return-and-tap resume), named verbatim

## Phase 5: US-1.3 — Unified exercise renderer (P-008)

- [X] T022 [US1.3] `src/audio/renderer.js` (`play(exercise, at)`: prelude then stimulus, all eight shapes via scheduler+sampler; returns the scheduled event log; `stop()`), exercise builders in `src/theory/exercise.js` (single, interval asc/desc/harm, chord block/arp, sequence, progression, with cadence prelude); replay path in `src/learning/session.js` reuses the stored exercise object. AC-1.3.1–AC-1.3.3
- [X] T023 [US1.3] Tests `tests/unit/audio/renderer.test.js` (AC-1.3.1/1–/8, AC-1.3.2) and `tests/unit/ui/replay.test.js` (AC-1.3.3 tap replay identical rendering), named verbatim

## Phase 6: US-2.1 — Per-item Leitner scheduling (P-009)

- [X] T024 [US2.1] `src/learning/leitner.js` (item record, promote/demote, attempts/correct/lastSeen), `src/learning/selection.js` (weight 6−box, weighted pick with PRNG); persistence through store. AC-2.1.1–AC-2.1.4
- [X] T025 [US2.1] Tests `tests/unit/learning/leitner.test.js` (AC-2.1.1, AC-2.1.2, AC-2.1.3) and `tests/unit/storage/leitnerPersistence.test.js` (AC-2.1.4/1–/3), named verbatim

## Phase 7: US-2.2 — Mastery-gated level advancement (P-010)

- [X] T026 [US2.2] `src/learning/mastery.js` (rolling accuracy over last 20, box floor, `evaluate(level)` → mastered/unmet conditions, unlock next level, retain mastered on decay), `src/ui/levelScreen.js` (level status, unmet condition text, start button). AC-2.2.1–AC-2.2.3
- [X] T027 [US2.2] Tests `tests/unit/learning/mastery.test.js` (AC-2.2.1/1, AC-2.2.1/2, AC-2.2.2/1, AC-2.2.3/1, AC-2.2.3/2) and `tests/unit/ui/levelScreen.test.js` (AC-2.2.2/2), named verbatim

## Phase 8: US-2.3 — Interleaved review mode (P-011)

- [X] T028 [US2.3] `src/learning/mixedReview.js` (eligibility: ≥ 2 mastered levels; question drawing across tracks weighted by box; track label on question), Mixed Review node on `src/ui/homeMap.js`, track label in `src/ui/feedback.js`, streak counting via `src/learning/streak.js`. AC-2.3.1–AC-2.3.3
- [X] T029 [US2.3] Tests `tests/unit/learning/mixedReview.test.js` (AC-2.3.3) and `tests/e2e/mixedReview.spec.js` (AC-2.3.1, AC-2.3.2/1–/3 — the AC names the feedback screen, so all its Cases are UI-level), named verbatim

## Phase 9: US-2.4 — Immediate feedback with comparison replay (P-012)

- [X] T030 [US2.4] `src/ui/feedback.js` (verdict rendered synchronously on submit, comparison button playing correct then chosen with on-screen labels, replay button using stored exercise), `src/learning/session.js` submit path. AC-2.4.1–AC-2.4.3
- [X] T031 [US2.4] Tests `tests/e2e/feedback.spec.js` (AC-2.4.1 verdict ≤ 200 ms, AC-2.4.2/1, AC-2.4.2/2, AC-2.4.3), named verbatim

## Phase 10: US-2.5 — Confusion-weighted question generation (P-013)

- [X] T032 [US2.5] Confusion bias in `src/learning/selection.js` (×4 for 5 questions when accuracy > 75% and a confusable pair was confused), options builder `src/learning/options.js` (always include confusable partner). AC-2.5.1–AC-2.5.3
- [X] T033 [US2.5] Tests `tests/unit/learning/confusion.test.js` (AC-2.5.1, AC-2.5.2) and `tests/unit/ui/options.test.js` (AC-2.5.3 answer buttons include partner), named verbatim

## Phase 11: US-3.1 — Interval level progression (P-014)

- [X] T034 [US3.1] `src/tracks/intervals.js` (level pools from data, cumulative item set, question generator, compound-distractor rule), registered in `src/tracks/index.js`. AC-3.1.1–AC-3.1.3
- [X] T035 [US3.1] Tests `tests/unit/tracks/intervals.test.js` (AC-3.1.1/1–/12, AC-3.1.2/1, AC-3.1.2/2) and `tests/unit/ui/intervalOptions.test.js` (AC-3.1.3), named verbatim

## Phase 12: US-3.2 — Interval presentation sub-stages (P-015)

- [X] T036 [US3.2] `src/learning/subStages.js` (ordered sub-stages, per-sub-stage mastery, unlock next), interval items keyed `interval:<id>:<asc|desc|harm>` in `src/tracks/intervals.js`, randomized roots within register. AC-3.2.1–AC-3.2.3
- [X] T037 [US3.2] Tests `tests/unit/learning/subStages.test.js` (AC-3.2.1/1, AC-3.2.1/2), `tests/unit/tracks/intervalItems.test.js` (AC-3.2.2, AC-3.2.3/1, AC-3.2.3/2), named verbatim

## Phase 13: US-3.3 — Interval answer input (P-016)

- [X] T038 [US3.3] `src/ui/answerGrid.js` (scoped buttons, ≥ 44 px, label modes) and `src/ui/labels.js` (interval short/full names). AC-3.3.1–AC-3.3.2
- [X] T039 [US3.3] Tests `tests/e2e/intervalGrid.spec.js` (AC-3.3.1/1, AC-3.3.1/2 measured ≥ 44 px, AC-3.3.2), named verbatim

## Phase 14: US-3.4 — Anchor-song reference (P-017)

- [X] T040 [US3.4] `src/ui/anchors.js` (up to 5 anchors, direction ordering/marking, compound decomposition + simple anchors + compound examples) used by `src/ui/feedback.js`; `src/ui/reference.js` (browse level intervals with anchors, route from level screen). AC-3.4.1–AC-3.4.5
- [X] T041 [US3.4] Tests `tests/unit/ui/anchors.test.js` (AC-3.4.1/1, AC-3.4.1/2, AC-3.4.2, AC-3.4.4/1, AC-3.4.4/2), `tests/e2e/reference.spec.js` (AC-3.4.3), `tests/unit/data/anchorsBundled.test.js` (AC-3.4.5), named verbatim

## Phase 15: US-4.1 — Tonal context establishment (P-018)

- [X] T042 [US4.1] `src/tracks/scaleDegrees.js` (cadence prelude per setting, random key rotation from all 12, target note), re-hear cadence control in `src/ui/session.js` that does not touch replay count/score. AC-4.1.1–AC-4.1.3
- [X] T043 [US4.1] Tests `tests/unit/tracks/scaleDegrees.test.js` (AC-4.1.1, AC-4.1.2) and `tests/e2e/scaleDegrees.spec.js` (AC-4.1.3/1, AC-4.1.3/2), named verbatim

## Phase 16: US-4.2 — Scale degree level progression (P-019)

- [X] T044 [US4.2] Level pools and prevalence/tendency weighting in `src/tracks/scaleDegrees.js` (stable-degree weights below 75%, tendency-tone weights at/above 75%). AC-4.2.1–AC-4.2.3
- [X] T045 [US4.2] Tests `tests/unit/tracks/scaleDegreeLevels.test.js` (AC-4.2.1/1–/5, AC-4.2.2, AC-4.2.3), named verbatim

## Phase 17: US-4.3 — Degree answer input (P-020)

- [X] T046 [US4.3] Degree row in `src/ui/answerGrid.js` with label mode syllable/number/both from `src/ui/labels.js`, scoped to level pool. AC-4.3.1–AC-4.3.2
- [X] T047 [US4.3] Tests `tests/e2e/degreeRow.spec.js` (AC-4.3.1, AC-4.3.2), named verbatim

## Phase 18: US-5.1 — Chord quality level progression (P-021)

- [X] T048 [US5.1] `src/tracks/chordQualities.js` (pools + voicing rules per level, quality-only answer across inversions, items keyed `chord:<quality>:<root|inv>` and by presentation, random roots). AC-5.1.1–AC-5.1.5
- [X] T049 [US5.1] Tests `tests/unit/tracks/chordQualities.test.js` (AC-5.1.1/1–/10, AC-5.1.2/1, AC-5.1.3/1, AC-5.1.3/2, AC-5.1.4, AC-5.1.5) and `tests/unit/ui/chordOptions.test.js` (AC-5.1.2/2), named verbatim

## Phase 19: US-5.2 — Chord presentation sub-stages (P-022)

- [X] T050 [US5.2] Chord sub-stages block→arp→varied via `src/learning/subStages.js`, items `chord:<q>:<block|arp|varied>`, arpeggiation tempo from settings in `src/theory/exercise.js`. AC-5.2.1–AC-5.2.3
- [X] T051 [US5.2] Tests `tests/unit/tracks/chordSubStages.test.js` (AC-5.2.1/1–/3, AC-5.2.2, AC-5.2.3), named verbatim

## Phase 20: US-5.3 — Chord quality answer input (P-023)

- [X] T052 [US5.3] Chord labels symbol · name in `src/ui/labels.js`, grid scoped in `src/ui/answerGrid.js`. AC-5.3.1
- [X] T053 [US5.3] Tests `tests/e2e/chordGrid.spec.js` (AC-5.3.1/1, AC-5.3.1/2), named verbatim

## Phase 21: US-6.1 — Inversion track unlock (P-024)

- [X] T054 [US6.1] `src/learning/unlocks.js` (track prerequisites from data → locked/available with message text), used by `src/ui/homeMap.js`. AC-6.1.1–AC-6.1.2
- [X] T055 [US6.1] Tests `tests/e2e/inversionsUnlock.spec.js` (AC-6.1.1, AC-6.1.2), named verbatim

## Phase 22: US-6.2 — Inversion level progression (P-025)

- [X] T056 [US6.2] `src/tracks/inversions.js` (pools per level, combined quality+inversion answer at level 3, block→arp sub-stages), combined answer UI in `src/ui/answerGrid.js`. AC-6.2.1–AC-6.2.3
- [X] T057 [US6.2] Tests `tests/unit/tracks/inversions.test.js` (AC-6.2.1/1–/4, AC-6.2.2/2, AC-6.2.3) and `tests/e2e/inversionAnswer.spec.js` (AC-6.2.2/1), named verbatim

## Phase 23: US-7.1 — Melodic dictation levels (P-026)

- [X] T058 [US7.1] `src/tracks/melodic.js` (phrase generation per level via `src/theory/melody.js`, cadence + tonic reference prelude). AC-7.1.1–AC-7.1.2
- [X] T059 [US7.1] Tests `tests/unit/tracks/melodic.test.js` (AC-7.1.1/1–/6, AC-7.1.2), named verbatim

## Phase 24: US-7.2 — Sequence answer input (P-027)

- [X] T060 [US7.2] `src/ui/sequenceInput.js` (append, delete-last, clear-all, insert-at-cursor, submit) and `src/learning/scoring.js` (position-wise comparison, partial credit), comparison marks in `src/ui/feedback.js`. AC-7.2.1–AC-7.2.3
- [X] T061 [US7.2] Tests `tests/unit/ui/sequenceInput.test.js` (AC-7.2.1, AC-7.2.2/1–/3), `tests/unit/ui/comparison.test.js` (AC-7.2.3/1, AC-7.2.3/2 — the AC names the comparison view), `tests/unit/learning/scoring.test.js` (scoring helpers), named verbatim

## Phase 25: US-7.3 — Limited replays with replay scoring (P-028)

- [X] T062 [US7.3] Replay cap and disabled state in `src/ui/session.js`, replay factor in `src/learning/scoring.js`, average replays in `src/learning/stats.js` and session summary in `src/ui/stats.js`. AC-7.3.1–AC-7.3.3
- [X] T063 [US7.3] Tests `tests/e2e/replayCap.spec.js` (AC-7.3.1, AC-7.3.3), `tests/unit/learning/replayScore.test.js` (AC-7.3.2), named verbatim

## Phase 26: US-8.1 — Progression track unlock (P-029)

- [ ] T064 [US8.1] Multi-prerequisite lock display in `src/learning/unlocks.js` and `src/ui/homeMap.js` (both prerequisites with status). AC-8.1.1–AC-8.1.2
- [ ] T065 [US8.1] Tests `tests/e2e/progressionsUnlock.spec.js` (AC-8.1.1, AC-8.1.2), named verbatim

## Phase 27: US-8.2 — Progression level design (P-030)

- [ ] T066 [US8.2] `src/tracks/progressions.js` (catalog filtering by level, rotations as items `prog:<id>r<k>:<texture>`, random key, name lookup, cadence prelude), name in `src/ui/feedback.js`. AC-8.2.1–AC-8.2.5
- [ ] T067 [US8.2] Tests `tests/unit/tracks/progressions.test.js` (AC-8.2.1/1–/8, AC-8.2.2, AC-8.2.4, AC-8.2.5) and `tests/unit/ui/progressionFeedback.test.js` (AC-8.2.3), named verbatim

## Phase 28: US-8.3 — Roman numeral answer input (P-031)

- [ ] T068 [US8.3] Numeral row scoped to vocabulary in `src/ui/answerGrid.js`, reuse `src/ui/sequenceInput.js`, chord-wise scoring via `src/learning/scoring.js`. AC-8.3.1–AC-8.3.3
- [ ] T069 [US8.3] Tests `tests/e2e/numeralInput.spec.js` (AC-8.3.1, AC-8.3.2/1, AC-8.3.2/2), `tests/unit/learning/progressionScoring.test.js` (AC-8.3.3/2), `tests/unit/ui/progressionComparison.test.js` (AC-8.3.3/1), named verbatim

## Phase 29: US-8.4 — Bass-first sub-mode (P-032)

- [ ] T070 [US8.4] Two-step question flow in `src/tracks/progressions.js` and `src/ui/session.js` (bass degrees step then numerals step, separate scores), toggle availability from level 2 in `src/ui/levelScreen.js`. AC-8.4.1–AC-8.4.2
- [ ] T071 [US8.4] Tests `tests/e2e/bassFirst.spec.js` (AC-8.4.1/1–/3, AC-8.4.2/1, AC-8.4.2/2), named verbatim

## Phase 30: US-8.5 — Voicing realism sub-stages (P-033)

- [ ] T072 [US8.5] Texture sub-stages block→voiceLed→arp for progressions via `src/learning/subStages.js` and `src/theory/voicing.js`; items per texture. AC-8.5.1–AC-8.5.2
- [ ] T073 [US8.5] Tests `tests/unit/tracks/progressionTextures.test.js` (AC-8.5.1/1–/3, AC-8.5.2), named verbatim

## Phase 31: US-9.1 — Unlock map (P-034)

- [ ] T074 [US9.1] `src/ui/homeMap.js` (nodes with locked/available/in-progress/mastered, SVG dependency lines, tap → unlock condition or start session). AC-9.1.1–AC-9.1.3
- [ ] T075 [US9.1] Tests `tests/e2e/homeMap.spec.js` (AC-9.1.1, AC-9.1.2/1, AC-9.1.2/2, AC-9.1.3/1, AC-9.1.3/2), named verbatim

## Phase 32: US-9.2 — Daily streak and session goal (P-035)

- [ ] T076 [US9.2] `src/learning/streak.js` (day log, goal by minutes or questions, streak increment), stopping-point message in `src/ui/session.js`, `src/platform/notifications.js` (Capacitor local notification scheduling; no-op on web). AC-9.2.1–AC-9.2.3
- [ ] T077 [US9.2] Tests `tests/unit/learning/streak.test.js` (AC-9.2.1/1, AC-9.2.1/2), `tests/e2e/stoppingPoint.spec.js` (AC-9.2.2), `tests/unit/platform/notifications.test.js` (AC-9.2.3 with a fake plugin), named verbatim

## Phase 33: US-9.3 — XP and level-up feedback (P-036)

- [ ] T078 [US9.3] `src/learning/xp.js` (base, streak/replay/mixed multipliers), `src/ui/celebration.js` (accuracy, time, weakest item conquered), unlock evaluation in `src/learning/unlocks.js` reads mastery only. AC-9.3.1–AC-9.3.3
- [ ] T079 [US9.3] Tests `tests/unit/learning/xp.test.js` (AC-9.3.1/1–/3, AC-9.3.3), `tests/e2e/celebration.spec.js` (AC-9.3.2), named verbatim

## Phase 34: US-9.4 — Weakness dashboard (P-037)

- [ ] T080 [US9.4] `src/learning/stats.js` (per-item accuracy/attempts/box, weakest-first, confusion detail, daily accuracy trend), `src/ui/stats.js` (screen, track detail, item detail, trend). AC-9.4.1–AC-9.4.4
- [ ] T081 [US9.4] Tests `tests/e2e/stats.spec.js` (AC-9.4.1, AC-9.4.2, AC-9.4.3, AC-9.4.4), named verbatim

## Phase 35: US-10.1 — Form-factor–adaptive layout (P-038)

- [ ] T082 [US10.1] Responsive rules in `src/styles.css` and `src/ui/layout.js` (phone < 600, tablet ≥ 600, desktop = tablet, no hover), state-in-store so rotation re-renders; static build settings in `vite.config.js` (relative base). AC-10.1.1–AC-10.1.5
- [ ] T083 [US10.1] Tests `tests/e2e/layout.spec.js` (AC-10.1.1/1, AC-10.1.1/2, AC-10.1.2, AC-10.1.3/1, AC-10.1.3/2, AC-10.1.4/1, AC-10.1.4/2, AC-10.1.5/1 served from `dist/`), `tests/unit/platform/parity.test.js` (AC-10.1.5/2 feature registry parity), named verbatim

## Phase 36: US-10.2 — Capacitor mobile build (P-039)

- [ ] T084 [US10.2] `capacitor.config.json`, `src/platform/capacitor.js` (isNative, Preferences adapter binding), release checklist in `specs/001-ear-trainer/quickstart.md`. AC-10.2.1–AC-10.2.4
- [ ] T085 [US10.2] Tests `tests/unit/platform/capacitor.test.js` (AC-10.2.1/1, AC-10.2.1/2, AC-10.2.3 offline session against fake network, AC-10.2.4 schema parity), `tests/unit/platform/releaseGate.test.js` (AC-10.2.2 checklist present and ordered), named verbatim

## Phase 37: US-10.3 — Progress persistence and export (P-040)

- [ ] T086 [US10.3] `src/storage/exportImport.js` (export document, import validate/merge/reject), export/import controls in `src/ui/settings.js`. AC-10.3.1–AC-10.3.3
- [ ] T087 [US10.3] Tests `tests/unit/storage/exportImport.test.js` (AC-10.3.1, AC-10.3.3/1–/3), `tests/e2e/exportImport.spec.js` (AC-10.3.2 tap export produces JSON), named verbatim

## Phase 38: US-10.4 — Settings (P-041)

- [ ] T088 [US10.4] `src/ui/settings.js` (all seven controls, link to Credits), `src/ui/credits.js` (bundled assets with author/source/licence from `src/data/credits.json`), `src/app/settings.js` (defaults, apply, persist). AC-10.4.1–AC-10.4.3
- [ ] T089 [US10.4] Tests `tests/e2e/settings.spec.js` (AC-10.4.1/1–/7, AC-10.4.2, AC-10.4.3), named verbatim

---

## Phase 39: Polish (P-042)

- [ ] T090 Replace `README.md` with the project README; delete `SETUP.md`; fill CLAUDE.md TODOs (title, §4 gates, §5 deployment, §6 architecture rules, §3/§7 paths); commit `specs/traceability-matrix.md`
- [ ] T091 Full gate run: `npm run lint`, `npm test`, `npm run test:e2e`, `npm run coverage:ac` (100%), `npm run trace:matrix`, `npm run check:trace` (0 findings), `npm run check:unwired` (0 findings); prune nothing (baselines empty)

---

## Post-MVP

*(Every change after the MVP ships gets a numbered task here — CLAUDE.md §3. Do not
renumber the MVP section above.)*

---

## Dependencies & Execution Order

- **Setup (T001–T005)** → **Foundational (T006–T017)** → stories.
- Epic 1 (US-1.1 → US-1.2 → US-1.3) before Epic 2; Epic 2 before every track.
- Tracks: US-3.x → US-4.x → US-5.x → US-6.x (needs 5.x mastery data) → US-7.x → US-8.x
  (needs 5.x, 6.x, 7.2 sequence input).
- Epic 9 needs the tracks and mastery; Epic 10 needs everything for parity tests.
- Within a story: the test task is written with the implementation task; tests fail first.

## Parallel Opportunities

- T002–T005 in parallel after T001. T006/T007 with T010/T011.
- Independent tracks after Epic 2: US-3.x, US-4.x, US-5.x can proceed in parallel; US-6.x
  after US-5.1; US-8.x after US-6.2 and US-7.2.
- Epic 9 stories in parallel with each other once Epic 2 lands.

## Implementation Strategy

Everything is in scope (maintainer decision, 2026-08-18). The first demonstrable increment is
Setup + Foundational + US-1.1–US-1.3 + US-2.1–US-2.5 + US-3.1–US-3.4 (a complete Intervals
track); each further epic is validated against quickstart.md before the next begins.

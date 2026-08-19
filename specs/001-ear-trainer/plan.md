# Implementation Plan: Ear Trainer

**Branch**: `claude/backlog-spec-kit-setup-35b114` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-ear-trainer/spec.md`

## Summary

Build the whole backlog: a mobile-first, offline, sample-based piano ear trainer with six
tracks (intervals, scale degrees, chord qualities, inversions, melodic phrases, chord
progressions), per-item Leitner scheduling, mastery-gated unlocks, mixed review, streaks/XP/
stats, form-factor-adaptive layout, versioned local persistence with export/import, and a
Capacitor wrap. Plain ES-module JS + Vite, Web Audio, Vitest + Playwright, content as
bundled JSON. Decisions are in [research.md](research.md); shapes in
[data-model.md](data-model.md).

## Technical Context

**Language/Version**: JavaScript (ES2022 modules), Node 24 for tooling
**Primary Dependencies**: Vite 5, Vitest 3, Playwright, jsdom (UI unit tests), Capacitor 6
(`@capacitor/core`, `@capacitor/preferences`, `@capacitor/local-notifications`), ESLint 9
**Storage**: `localStorage` (web) / Capacitor Preferences (native), one JSON document,
`schemaVersion`
**Testing**: Vitest (node + jsdom), Playwright (Chromium; phone + tablet projects) against
`vite preview`
**Target Platform**: modern mobile browsers, iOS/Android WebView via Capacitor, desktop
browsers (tablet layout)
**Project Type**: single-page web app, single project
**Performance Goals**: verdict ≤ 200 ms; note onset ±10 ms; first question ≤ 3 taps
**Constraints**: offline, no server, samples ≤ 5 MB, touch targets ≥ 44 px, no hover
**Scale/Scope**: 36 user stories, 109 ACs / 207 criteria, ~12 screens

## Constitution Check

| Principle | How this plan complies |
|---|---|
| I Spec before code | spec.md written first; every AC has Cases where compound (0 T4 findings) |
| II Failing test → fix code | Tests are written per criterion before/with implementation; no skips |
| III Traceability | Matrix below maps every AC to P-0xx + impl + test tasks; matrix regenerated per change |
| IV Reachable code | `main.js` composition root wires every module; `check:unwired` in gates |
| V Offline/static | D-002, D-007, D-011; e2e runs from `vite preview` of `dist/` |
| VI Web-first/mobile-first | D-008, D-009 (phone + tablet Playwright projects), D-010 |
| VII Audio | D-002–D-005 |
| VIII Learning integrity | D-006; XP is separate from `mastery.js` and never read by unlocks |
| IX Content is data | D-011 |
| X Licensing & attribution | `public/samples/LICENSE.md`, Credits view (AC-10.4.3), licence-file check in `tools/lint-extras.mjs` |

No violations; Complexity Tracking is empty.

**Post-design re-check (after Phase 1)**: research.md D-001–D-012, data-model.md,
contracts/data-files.md and quickstart.md introduce no framework, no server, no TypeScript, no
timer-based audio and no XP-based unlock; the `window.__test` hook is test-build only. All
ten principles still hold.

## Project Structure

### Documentation (this feature)

```text
specs/001-ear-trainer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md          # run, gates, validation scenarios, device checklist
├── contracts/data-files.md # bundled JSON contracts, export file, window.__test hook
├── checklists/requirements.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html
src/
├── main.js                     # composition root
├── app/    router.js  store.js  settings.js
├── audio/  context.js  sampler.js  scheduler.js  renderer.js
├── theory/ notes.js  intervals.js  chords.js  scales.js  cadence.js  progressions.js  melody.js  voicing.js
├── learning/ random.js  leitner.js  selection.js  mastery.js  unlocks.js
│             scoring.js  xp.js  streak.js  stats.js  session.js  mixedReview.js
├── tracks/ intervals.js  scaleDegrees.js  chordQualities.js  inversions.js  melodic.js  progressions.js  index.js
├── storage/ storage.js  schema.js  exportImport.js
├── platform/ notifications.js
├── ui/  dom.js  layout.js  homeMap.js  levelScreen.js  session.js  answerGrid.js  sequenceInput.js
│        feedback.js  anchors.js  reference.js  stats.js  settings.js  celebration.js  labels.js
├── data/ levels.json  progressions.json  anchors.json
└── styles.css
public/samples/                 # piano samples + LICENSE.md
tools/  validate-data.mjs  gen-samples.mjs  lint-extras.mjs  check-unwired.mjs
tests/
├── unit/  audio/  theory/  learning/  storage/  tracks/  ui/  data/
└── e2e/                        # Playwright specs
capacitor.config.json
```

**Structure Decision**: single project; `src/` split by concern, `tests/` mirrors it. `ui/`
tests run under jsdom in `tests/unit/ui/`; flows and layout under `tests/e2e/`.

## Traceability Matrix

Every AC's plan item, and the tasks that build and prove it. Test tasks name the test files
that carry the verbatim-titled tests. `—` in the AC column marks infrastructure.

| Plan item | Covers | Acceptance Criteria | Implementation tasks | Test tasks |
|---|---|---|---|---|
| **P-001** | Setup — Vite, ESLint, Vitest (jsdom), Playwright, scripts | — | T001–T005 | — |
| **P-002** | Content data files + validator | — | T006–T008 | T009 |
| **P-003** | Music theory library | — | T010–T012 | T013 |
| **P-004** | Store, PRNG, storage adapters, schema | — | T014 | T015 |
| **P-005** | App shell: router, layout, DOM helpers, styles | — | T016 | T017 |
| **P-006** | US-1.1 — Piano playback | AC-1.1.1–AC-1.1.2 | T018 | T019 |
| **P-007** | US-1.2 — Mobile-safe audio initialization | AC-1.2.1–AC-1.2.3 | T020 | T021 |
| **P-008** | US-1.3 — Unified exercise renderer | AC-1.3.1–AC-1.3.3 | T022 | T023 |
| **P-009** | US-2.1 — Per-item Leitner scheduling | AC-2.1.1–AC-2.1.4 | T024 | T025 |
| **P-010** | US-2.2 — Mastery-gated level advancement | AC-2.2.1–AC-2.2.3 | T026, T102 | T027, T105 |
| **P-011** | US-2.3 — Interleaved review mode | AC-2.3.1–AC-2.3.3 | T028 | T029 |
| **P-012** | US-2.4 — Immediate feedback with comparison replay | AC-2.4.1–AC-2.4.3 | T030 | T031 |
| **P-013** | US-2.5 — Confusion-weighted question generation | AC-2.5.1–AC-2.5.3 | T032 | T033 |
| **P-014** | US-3.1 — Interval level progression | AC-3.1.1–AC-3.1.3 | T034, T101 | T035, T104 |
| **P-015** | US-3.2 — Interval presentation tiers | AC-3.2.1–AC-3.2.3 | T036, T101 | T037, T104 |
| **P-016** | US-3.3 — Interval answer input | AC-3.3.1–AC-3.3.2 | T038 | T039 |
| **P-017** | US-3.4 — Anchor-song reference | AC-3.4.1–AC-3.4.5 | T040 | T041 |
| **P-018** | US-4.1 — Tonal context establishment | AC-4.1.1–AC-4.1.3 | T042 | T043 |
| **P-019** | US-4.2 — Scale degree level progression | AC-4.2.1–AC-4.2.3 | T044 | T045 |
| **P-020** | US-4.3 — Degree answer input | AC-4.3.1–AC-4.3.2 | T046 | T047 |
| **P-021** | US-5.1 — Chord quality level progression | AC-5.1.1–AC-5.1.5 | T048, T101 | T049, T104 |
| **P-022** | US-5.2 — Chord presentation tiers | AC-5.2.1–AC-5.2.3 | T050, T101 | T051, T104 |
| **P-023** | US-5.3 — Chord quality answer input | AC-5.3.1 | T052 | T053 |
| **P-024** | US-6.1 — Inversion track unlock | AC-6.1.1–AC-6.1.2 | T054 | T055 |
| **P-025** | US-6.2 — Inversion level progression | AC-6.2.1–AC-6.2.3 | T056, T101 | T057, T104 |
| **P-026** | US-7.1 — Melodic dictation levels | AC-7.1.1–AC-7.1.2 | T058 | T059 |
| **P-027** | US-7.2 — Sequence answer input | AC-7.2.1–AC-7.2.3 | T060 | T061 |
| **P-028** | US-7.3 — Limited replays with replay scoring | AC-7.3.1–AC-7.3.3 | T062 | T063 |
| **P-029** | US-8.1 — Progression track unlock | AC-8.1.1–AC-8.1.2 | T064 | T065 |
| **P-030** | US-8.2 — Progression level design | AC-8.2.1–AC-8.2.5 | T066, T101 | T067, T104 |
| **P-031** | US-8.3 — Roman numeral answer input | AC-8.3.1–AC-8.3.3 | T068 | T069 |
| **P-032** | US-8.4 — Bass-first sub-mode | AC-8.4.1–AC-8.4.2 | T070 | T071 |
| **P-033** | US-8.5 — Voicing realism tiers | AC-8.5.1–AC-8.5.2 | T072, T101 | T073, T104 |
| **P-034** | US-9.1 — Unlock map | AC-9.1.1–AC-9.1.3 | T074 | T075 |
| **P-035** | US-9.2 — Daily streak and session goal | AC-9.2.1–AC-9.2.3 | T076 | T077 |
| **P-036** | US-9.3 — XP and level-up feedback | AC-9.3.1–AC-9.3.3 | T078 | T079 |
| **P-037** | US-9.4 — Weakness dashboard | AC-9.4.1–AC-9.4.4 | T080 | T081 |
| **P-038** | US-10.1 — Form-factor–adaptive layout | AC-10.1.1–AC-10.1.5 | T082 | T083 |
| **P-039** | US-10.2 — Capacitor mobile build | AC-10.2.1–AC-10.2.4 | T084 | T085 |
| **P-040** | US-10.3 — Progress persistence and export | AC-10.3.1–AC-10.3.3 | T086 | T087 |
| **P-041** | US-10.4 — Settings | AC-10.4.1–AC-10.4.3 | T088 | T089 |
| **P-042** | Polish: quickstart, README, matrix, gates | — | T090–T091 | — |
| **P-043** | US-2.6 — In-session progress visibility (post-MVP) | AC-2.6.1–AC-2.6.2 | T093, T102 | T094, T105 |
| **P-044** | US-9.2 — Daily-goal progress visibility (post-MVP extension) | AC-9.2.4 | T095 | T096 |
| **P-045** | US-4.4 — Scale reference scaffold for novices (post-MVP) | AC-4.4.1–AC-4.4.6 | T097 | T098 |
| **P-046** | US-4.5 — Scale-degree onboarding guidance (post-MVP) | AC-4.5.1–AC-4.5.3 | T099 | T100 |
| **P-047** | US-2.2 — Pool-scaled mastery gate (post-MVP, D-006 amendment) | AC-2.2.4 | T102 | T105 |
| **P-048** | US-10.3 — Progress reset at the presentation-tier restructure (post-MVP, D-007 amendment) | AC-10.3.4 | T103 | T106 |

## Complexity Tracking

None.

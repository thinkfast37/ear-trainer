<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (MINOR: new principle added)
- Modified principles: none renamed or redefined
- Added sections: Principle X — Licensing and Attribution; one bullet under Platform & Content
  Constraints (Credits view) and one gate line under Development Workflow & Quality Gates
  (licence-file check inside `npm run lint`)
- Removed sections: none
- Templates: plan-template's Constitution Check reads this file at command time; the current
  plan.md Constitution Check table should gain a row for Principle X on its next edit.
  CLAUDE.md §4 gate list already runs `npm run lint`, which carries the new check.
- Follow-up TODOs: none

Previous report (1.0.0, 2026-08-18): initial ratification — Core Principles I–IX; Platform &
Content Constraints; Development Workflow & Quality Gates; Governance.
-->

# Ear Trainer Constitution

Ear Trainer is a mobile-first web application, packaged for app stores with Capacitor, that
teaches a learner to hear intervals, scale degrees, chord qualities, inversions, melodic
phrases and chord progressions through spaced, mastery-gated drills with a real piano sound.
This document states the principles every change is judged against.

## Core Principles

### I. Spec Before Code (NON-NEGOTIABLE)

The specification (`specs/<feature>/spec.md`) is the contract. Every behaviour the
application has MUST be stated as a numbered Acceptance Criterion (`AC-<epic>.<story>.<n>`)
with a Given/When/Then body **before** the code that implements it is written. An AC that
asserts more than one thing MUST declare numbered Cases, one per assertion.

If an AC has to change, it changes **first**, in the same change, with a dated parenthetical
saying what changed and why — so the intent can be objected to rather than the finished work.
Backfilling ACs to match what was already built is forbidden. Before implementing anything,
the blast radius MUST be worked out (which ACs, which other stories, which research
decisions, which principles) and any spill beyond the literal request MUST be surfaced and
approved before code is written.

*Rationale*: a request that sounds like a small tweak can reverse a User Story; that has to
be visible before the work, not reported after it.

### II. A Failing Test Means the Code Is Wrong (NON-NEGOTIABLE)

A failing test is evidence about the code, and the implementation is what changes. A test
may be altered **only** when the test itself is the defect — it asserts something its AC
never said — and then the change MUST name the AC that settles it, be logged in the task and
cited in the commit, and bring the test to the AC, never to the code. Relaxing an assertion,
narrowing a case, deleting or skipping a test to turn a build green is forbidden. If a test
cannot be made to pass, say so and stop; a reported failure is worth more than a green build
that means nothing.

### III. Full Traceability, Verbatim (NON-NEGOTIABLE)

Every criterion MUST trace along the chain
`AC → Case → plan item (P-0xx) → implementation task + test task → a test named for the
criterion, verbatim` (`it('AC-1.1.9 — <the AC's title>', …)`), and the chain is enforced by
`npm run check:trace` (checks T1–T9) and `npm run coverage:ac` (100%, always). A UI-level
criterion — one naming a control, view, panel, prompt, gesture or viewport — MUST be proved by
a test that can reach the DOM (`tests/e2e/` or `tests/unit/ui/`); a pure unit test cannot
see a screen. Adding an AC means adding its plan-item row and both tasks in the same change.
The generated matrix (`specs/traceability-matrix.md`) is committed and never hand-edited.
CRITICAL and HIGH traceability gaps can never be waived; the baselines start empty and may
only shrink.

*Rationale*: an AC ID in a test name proves the ID was typed, not that anything was proved.
Two User Stories in the predecessor project shipped unbuilt at "100% coverage" this way.

### IV. Reachable Code Only

Every export in `src/` MUST be reachable from something else in `src/` (`npm run
check:unwired`). Tests are not uses. A specified, written, tested function that nothing in the
application calls is an unbuilt feature reporting as complete. Genuine test seams go in the
unwired baseline with a written reason.

### V. Offline, Self-Contained, Static

The application MUST run entirely on the device: no server-side component, no network request
during any exercise, all audio samples and reference content bundled with the build. A
production build MUST be deployable to a static host and MUST function identically inside the
Capacitor WebView. Progress MUST persist locally under a versioned schema and MUST be
exportable and importable as a plain JSON file.

*Rationale*: practice happens on trains and in airplane mode; a drill that depends on a
network is a drill that sometimes does not happen.

### VI. Web-First, Mobile-First, One Codebase

There is one codebase. It is a web app first — the browser build is the permanent testing
surface and MUST retain feature parity with the packaged app (excluding native-only
capabilities such as local notifications). Layout is designed for phones and tablets; a
desktop browser presents the tablet experience and no desktop-only or hover-dependent
behaviour may exist. Every feature MUST be verified in a desktop browser before it is promoted
to a Capacitor build, device testing and store release.

### VII. Audio Is Scheduled, Sampled and Deterministic

All playback MUST be rendered from the bundled piano sample set (≤ 5 MB) through a single
exercise renderer shared by every track. Note onsets MUST be scheduled on the Web Audio clock
— never with `setTimeout`/`setInterval` — and MUST be accurate to ±10 ms. The AudioContext
MUST be unlocked on the learner's first gesture and recovered after backgrounding without a
reload. A replayed question MUST use the identical voicing and register it was first heard
with.

*Rationale*: an ear-training app whose sound is unreliable is teaching the wrong thing.

### VIII. Learning Integrity: Mastery Gates, XP Never Does

Content unlocks MUST be decided solely by mastery conditions (rolling accuracy and per-item
Leitner box), never by XP, streaks or time spent. Every discriminable thing the learner is
asked to hear (an interval in a direction, a chord quality in a voicing, a progression in a
texture) MUST be its own Leitner item, promoted and demoted independently. Feedback MUST be
immediate and MUST let the learner hear the correct answer against their own.

### IX. Content Is Data

Level definitions, question pools, the progression catalog, anchor-song references and
confusable pairs MUST live in bundled data files (JSON) validated at build time, so that
content can be added or retuned without a code change. A change that touches only such data
is a **Data** change and needs no spec pass.

### X. Licensing and Attribution

Every bundled third-party asset — audio samples, fonts, images, data — MUST ship with its
licence file beside it (for example `public/samples/LICENSE.md`) and MUST be credited in-app
on a Credits/About view reachable from Settings. Only licences compatible with app-store
distribution (CC BY, CC0, MIT, public domain, or equivalent) may be bundled. Adding an asset
without both the licence file and the in-app credit is a gate failure: `npm run lint`
(`tools/lint-extras.mjs`) MUST fail when a directory under `public/` that contains media
lacks a `LICENSE.md`.

*Rationale*: the piano sample set is CC BY 3.0 (Salamander Grand Piano); attribution is a
legal condition of shipping it, and a condition that is checked by a gate cannot be forgotten
in a release.

## Platform & Content Constraints

- **Stack**: plain ES-module JavaScript, Vite for bundling, Vitest for unit tests,
  Playwright for e2e, Capacitor for iOS/Android. No TypeScript (the traceability and
  reachability tooling reads `.js`). Any framework adoption is a research decision (D-00x)
  and a constitution amendment.
- **Storage**: `localStorage` on the web, Capacitor Preferences on device, one schema
  (`schemaVersion` field) for both.
- **Assets**: piano samples ≤ 5 MB total, bundled; catalog and reference JSON bundled.
- **Accessibility floor**: touch targets ≥ 44 px; no hover-only affordances; labels always
  shown as text beside any colour or icon.
- **Credits**: a Credits/About view listing every bundled third-party asset and its licence
  is reachable from Settings (Principle X).
- **Deferred content**: sing-back mode and honor-system sing-first (US-V2.x) are out of scope
  for feature 001 and MUST NOT be built there.

## Development Workflow & Quality Gates

Every change, however small, follows CLAUDE.md: classify by what it contradicts (Bug, Spec
defect, New capability, Approach change, Governance, Data), get its numbered task in
`tasks.md`, ask once how it lands (Auto or Review), and land it as a PR carrying the change
matrix (`npm run trace:changed`).

Before every commit, all of these MUST pass; a failing gate stops the change and is never
made to ask for less:

```bash
npm run lint            # eslint, data validation, no-hover, licence-file check (X)
npm test
npm run test:e2e
npm run coverage:ac      # 100%
npm run trace:matrix     # regenerate and commit
npm run check:trace      # no new findings
npm run check:unwired
```

The repository is the source of truth; before asking the maintainer or reporting work as
outstanding, check `git log`, `tasks.md`, `spec.md` and `research.md`.

## Governance

This constitution supersedes every other practice in the repository. CLAUDE.md is its
operational restatement and MUST be kept consistent with it. Amendments are made through
`/speckit-constitution` with a version bump — MAJOR for removing or redefining a principle,
MINOR for adding one or materially expanding guidance, PATCH for clarification — and are
recorded in the Sync Impact Report at the top of this file. Any change that contradicts a
principle is a **Governance** change and MUST amend this document first. Every PR review MUST
verify compliance with Principles I–IV and X explicitly; complexity beyond what a principle allows
MUST be justified in the plan's Complexity Tracking table.

**Version**: 1.1.0 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-08-18

# Specification Quality Checklist: Ear Trainer

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-18
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — the remaining technical
      nouns (AudioContext, Web Audio clock, Capacitor, localStorage, JSON export) are
      constraints stated verbatim by the product owner in the backlog, not choices made here;
      file paths that had crept into Appendices A/B were removed (2026-08-18)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (0)
- [x] Requirements are testable and unambiguous — every AC has a single Then or declared
      Cases; one backlog defect corrected in place with a dated parenthetical (AC-5.3.1:
      m7♭5 first appears at chord level 7, not 5)
- [x] Success criteria are measurable (SC-001–SC-005)
- [x] Success criteria are technology-agnostic
- [x] All acceptance scenarios are defined — 36 stories, 108 ACs, 206 criteria
- [x] Edge cases are identified (10)
- [x] Scope is clearly bounded — US-V2.x deferred and named as out of scope
- [x] Dependencies and assumptions identified (Assumptions section, 9 items)

## Traceability shape (project gate, CLAUDE.md §2b)

- [x] Every AC is declared as `- **AC-e.s.n** — <title>` with a Given/When/Then body
- [x] Every AC asserting more than one thing declares numbered Cases (0 T4 findings)
- [x] Every scenario-outline table is decomposed into one Case per row
- [x] Story IDs `US-e.s` match the backlog's numbering, so backlog ↔ spec cross-reference holds

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria (FR-001–FR-012 each cite ACs)
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- All items pass. Ready for `/speckit-plan`.

## Extension: In-session progress visibility (2026-08-18)

Validated for US-2.6 (AC-2.6.1, AC-2.6.2) and AC-9.2.4:

- [x] No implementation details (no file, module or framework names in the ACs)
- [x] Focused on user value (knowing how long to continue and when to stop)
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements testable and unambiguous (thresholds and ordering stated per AC)
- [x] Compound ACs declare numbered Cases (T4 passes)
- [x] Scope bounded: session header meter, sub-stage transition announcement, daily-goal display and toast wording — nothing else
- [x] Assumptions recorded (question-target-only display; time threshold still completes the day)
- [x] Success criteria updated (SC-003 story count 36 → 37)

## Extension: Scale reference scaffold and onboarding (2026-08-18)

Validated for US-4.4 (AC-4.4.1–AC-4.4.6) and US-4.5 (AC-4.5.1–AC-4.5.3):

- [x] No implementation details in the ACs (no file, module or framework names; "one renderer" and "level definition" name existing constitutional concepts, not code)
- [x] Focused on user value (a novice can hear every degree before guessing; knows what the sounds are for)
- [x] No [NEEDS CLARIFICATION] markers remain — the three open choices (scale ends on Do without a held Do; level 2 on-demand only; hint counts track questions and stops at 5) are recorded as defaults in Assumptions for the maintainer to confirm
- [x] Requirements testable and unambiguous (order, levels, counts and free/counted replays stated per AC)
- [x] Compound ACs declare numbered Cases (T4)
- [x] Scope bounded: scale in the prelude, three reference controls, disabled-with-hint state, cadence-frequency interaction, first-open guidance with persisted dismissal, early-question hint — nothing else
- [x] Assumptions recorded (tempo, ending, level policy as data, minor keys excluded, reset clears the flag)
- [x] Success criteria updated (SC-003 story count 37 → 39)
- [x] Plan items P-045/P-046 and tasks T097–T100 added in the same change (T1/T2)

## Revision: Presentation-tier levels, pool-scaled mastery gate, progress reset (2026-08-18)

Validated for the revised US-2.2 (AC-2.2.1, new AC-2.2.4), US-2.6 (AC-2.6.1–AC-2.6.2), US-3.1
(AC-3.1.1–AC-3.1.3), US-3.2 (AC-3.2.1), US-3.4 (AC-3.4.4), US-5.1 (AC-5.1.1), US-5.2
(AC-5.2.1), US-6.2 (AC-6.2.1–AC-6.2.3), US-8.2 (AC-8.2.1–AC-8.2.2), US-8.5 (AC-8.5.1) and
US-10.3 (new AC-10.3.4):

- [x] No implementation details in the ACs (level tables, presentations, thresholds and schema-version behaviour are stated as learner-visible facts; file and module names live in research.md/data-model.md only)
- [x] Focused on user value (each level has one difficulty; a learner is not held on two intervals for 60 answers; the smallest levels are the shortest)
- [x] No [NEEDS CLARIFICATION] markers remain — the open choices (3× multiplier not 5×; block-before-arpeggiated kept for chords; settings survive the reset; mixed-direction level 10 and all-presentation capstone 16) are recorded as defaults in Assumptions and D-006/D-013 for the maintainer to confirm
- [x] Requirements testable and unambiguous (every level's presentation and pool is a table row with its own Case; the answer floor is a formula with two worked cases)
- [x] Compound ACs declare numbered Cases (T4) — AC-3.1.1/1–16, AC-5.1.1/1–15, AC-6.2.1/1–6, AC-8.2.1/1–14, AC-2.2.4/1–3, AC-10.3.4/1–2
- [x] Every revised AC carries a dated parenthetical naming what it replaced and why (CLAUDE.md §2 spec-defect convention); retired sub-stage ACs were revised in place, not deleted, so no test can keep an orphaned ID (T7)
- [x] Scope bounded: level restructure of the four sub-staged tracks, the answer-floor formula, the reset — nothing else (scale degrees and melodic phrases untouched; item ids unchanged; prerequisites CQ L1 / CQ L6 / Inv L1 unchanged)
- [x] Assumptions recorded (presentation tiers, catalog tiers, one-time reset)
- [x] Success criteria unchanged (SC-003 story count stays 39 — no story added or removed)
- [x] Plan items P-047/P-048 and tasks T101–T106 added in the same change (T1/T2)

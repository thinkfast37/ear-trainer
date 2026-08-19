# Feature Specification: Ear Trainer

**Feature Branch**: `001-ear-trainer`

**Created**: 2026-08-18

**Status**: Draft

**Input**: `specs/ear-training-backlog.md` — the product backlog (10 epics, 36 user stories),
reworked here into numbered Acceptance Criteria with declared Cases so that every assertion
can be traced to a plan item, an implementation task, a test task and a verbatim-named test.
The backlog remains the narrative source; this document is the contract.

Conventions: `AC-<epic>.<story>.<n>` — the text after the em dash is the criterion's title
and is what its test must be named. A criterion asserting more than one thing declares
`Cases` (`AC-e.s.n/k`), one per assertion. "Learner" is the end user. Item IDs take the form
`<track>:<thing>:<presentation>` (e.g. `interval:m6:desc`, `chord:m7b5:block`).

---

## User Scenarios & Testing *(mandatory)*

Priorities: the maintainer has stated that **everything in the backlog is a priority and
all of it is to be built**. Stories are therefore listed in build-dependency order (the
order in which one story's behaviour is needed by the next), not in a P1/P2/P3 cut. Epic 1
and Epic 2 are the foundation every track depends on; Epics 3–8 are the six tracks; Epics
9–10 are cross-cutting.

---

## Epic 1: Audio Engine

### User Story 1.1 - Piano playback

*Traceability: `US-1.1` — Piano playback*

As a learner, I want all exercises to play back with a realistic piano sound so that what I
hear resembles real music rather than synthetic tones.

**Independent Test**: play a single note in the browser and confirm it comes from a bundled
sample and no network request was made.

**Acceptance Scenarios**:

- **AC-1.1.1** — Notes render from the bundled sample set
  - **Given** the app has loaded its bundled piano sample set (≤ 5 MB total)
  - **When** any exercise plays a note between C2 and C6
  - **Then** the note is rendered from the nearest sample, pitch-shifted as needed
  - **And** no network request is made during playback
  - **Cases**:
    - **AC-1.1.1/1** — The nearest sample is chosen and pitch-shifted to the target note
    - **AC-1.1.1/2** — No network request is made during playback
    - **AC-1.1.1/3** — The bundled sample set totals at most 5 MB

- **AC-1.1.2** — Adjacent pitches play without clicks, dropouts or mistuning
  - **Given** any two adjacent chromatic pitches in the supported range C2–C6
  - **When** each is played
  - **Then** there are no audible clicks, dropouts, or mistuning artifacts (each rendered note is enveloped, sustained for its full duration, and tuned to within 5 cents of equal temperament)

### User Story 1.2 - Mobile-safe audio initialization

*Traceability: `US-1.2` — Mobile-safe audio initialization*

As a learner on iOS or Android, I want audio to work reliably the first time I use the app
so that I never hit a silent exercise.

**Independent Test**: load the app with a suspended AudioContext, tap once anywhere, and
confirm the context is running before the first playback.

**Acceptance Scenarios**:

- **AC-1.2.1** — The AudioContext is resumed on the first tap
  - **Given** the app has just loaded on iOS Safari or an iOS WebView, and the AudioContext is suspended
  - **When** I perform my first tap anywhere in the app
  - **Then** the AudioContext is resumed before any exercise attempts playback

- **AC-1.2.2** — Notes are scheduled on the Web Audio clock
  - **Given** an exercise with multiple timed notes
  - **When** it plays in the Capacitor WebView
  - **Then** every note is scheduled via the Web Audio clock (not setTimeout/setInterval)
  - **And** note onsets are accurate within ±10 ms of the scheduled time
  - **Cases**:
    - **AC-1.2.2/1** — Every note is scheduled via the Web Audio clock, never a timer
    - **AC-1.2.2/2** — Note onsets are accurate within 10 ms of the scheduled time

- **AC-1.2.3** — Audio recovers after backgrounding without a reload
  - **Given** I background the app mid-session and the AudioContext becomes suspended
  - **When** I return and tap any control
  - **Then** the AudioContext resumes and the next playback works without reload

### User Story 1.3 - Unified exercise renderer

*Traceability: `US-1.3` — Unified exercise renderer*

As a developer, I want a single playback function that renders any exercise definition so
that all tracks share one audio path.

**Independent Test**: hand the renderer one exercise object of each shape and confirm the
scheduled notes, timings and presentation match the object.

**Acceptance Scenarios**:

- **AC-1.3.1** — The renderer plays every exercise shape faithfully
  - **Given** an exercise object of a given type
  - **When** the renderer plays it
  - **Then** the audible result matches the object's notes, timing, and presentation mode for each type:

  | Type |
  |---|
  | single note |
  | interval (ascending) |
  | interval (descending) |
  | interval (harmonic) |
  | chord (block) |
  | chord (arpeggiated) |
  | melodic sequence |
  | chord progression |

  - **Cases**:
    - **AC-1.3.1/1** — A single note renders as one note at its pitch and duration
    - **AC-1.3.1/2** — An ascending interval renders its two notes lower then higher
    - **AC-1.3.1/3** — A descending interval renders its two notes higher then lower
    - **AC-1.3.1/4** — A harmonic interval renders both notes at the same onset
    - **AC-1.3.1/5** — A block chord renders all chord tones at the same onset
    - **AC-1.3.1/6** — An arpeggiated chord renders its tones in sequence at the arpeggiation tempo
    - **AC-1.3.1/7** — A melodic sequence renders each note at its own onset and duration
    - **AC-1.3.1/8** — A chord progression renders each chord in order at its own onset

- **AC-1.3.2** — A cadence prelude plays in the exercise key before the stimulus
  - **Given** a track configured with a cadence prelude, and an exercise in the key of A major
  - **When** the question plays
  - **Then** a I–IV–V–I cadence in A major plays before the stimulus

- **AC-1.3.3** — Replay uses identical rendering
  - **Given** a question has been played with a particular voicing and register
  - **When** I tap replay for that same question
  - **Then** the identical voicing and register are used

---

## Epic 2: Learning Engine

### User Story 2.1 - Per-item Leitner scheduling

*Traceability: `US-2.1` — Per-item Leitner scheduling*

As a learner, I want the app to quiz me more often on the items I get wrong so that my
practice time targets my weaknesses.

**Independent Test**: answer one item right and one wrong; confirm the boxes moved as
specified and survive a reload.

**Acceptance Scenarios**:

- **AC-2.1.1** — A correct answer promotes the item one box
  - **Given** the item `interval:m6:desc` is in Leitner box 2
  - **When** I answer a question on that item correctly
  - **Then** the item moves to box 3

- **AC-2.1.2** — An incorrect answer demotes the item to box 1
  - **Given** the item `chord:m7b5:block` is in box 4
  - **When** I answer a question on that item incorrectly
  - **Then** the item moves to box 1

- **AC-2.1.3** — Lower boxes are selected more often than higher boxes
  - **Given** a level whose items span boxes 1 through 5
  - **When** the next 50 questions are generated
  - **Then** items in lower boxes appear with measurably higher frequency than items in higher boxes

- **AC-2.1.4** — Leitner state persists across a restart
  - **Given** I have answered questions and closed the app
  - **When** I reopen the app
  - **Then** every item's box, attempts, correct count, and last-seen timestamp are unchanged
  - **Cases**:
    - **AC-2.1.4/1** — Every item's box is unchanged after reopening
    - **AC-2.1.4/2** — Every item's attempts and correct count are unchanged after reopening
    - **AC-2.1.4/3** — Every item's last-seen timestamp is unchanged after reopening

### User Story 2.2 - Mastery-gated level advancement

*Traceability: `US-2.2` — Mastery-gated level advancement*

As a learner, I want levels to unlock only when I've genuinely mastered the current one so
that the game mechanic enforces real learning.

**Independent Test**: drive a level to ≥ 90% rolling accuracy with all items in box ≥ 3 and
confirm the next level unlocks; drive it to 90% with one item in box 2 and confirm it does
not; confirm a two-item level needs 10 answers and a twelve-item level needs 36.

**Acceptance Scenarios**:

- **AC-2.2.1** — A level is mastered when accuracy and box conditions are both met
  - **Given** my rolling accuracy over the last 20 answers in a level is ≥ 90%, every item in the level has reached at least box 3, and I have answered at least the level's minimum answer count (AC-2.2.4; 2026-08-18: was a flat 20 answers)
  - **When** I complete the answer that satisfies all conditions
  - **Then** the level is marked mastered and the next level unlocks
  - **Cases**:
    - **AC-2.2.1/1** — The level is marked mastered on the satisfying answer
    - **AC-2.2.1/2** — The next level unlocks when the level is mastered

- **AC-2.2.4** — The minimum answer count scales with the level's item count
  - **Given** a level with N Leitner items (2026-08-18: added when levels became presentation tiers — a flat 20-answer floor cost a two-item level the same as a twelve-item one, so the smallest levels were the most tedious)
  - **When** mastery is evaluated
  - **Then** at least max(10, 3 × N) answers in the level are required
  - **And** rolling accuracy is still measured over the last 20 answers regardless of N
  - **Cases**:
    - **AC-2.2.4/1** — A two-item level requires at least 10 answers
    - **AC-2.2.4/2** — A twelve-item level requires at least 36 answers
    - **AC-2.2.4/3** — Rolling accuracy is measured over the last 20 answers regardless of item count

- **AC-2.2.2** — Accuracy alone does not master a level
  - **Given** my rolling accuracy is ≥ 90%, but at least one item in the level is below box 3
  - **When** I view the level screen
  - **Then** the level is not mastered
  - **And** the screen shows which condition is unmet
  - **Cases**:
    - **AC-2.2.2/1** — The level is not mastered while an item is below box 3
    - **AC-2.2.2/2** — The level screen shows which mastery condition is unmet

- **AC-2.2.3** — Mastered levels stay reviewable and decay per item
  - **Given** a mastered level
  - **When** I replay it and answer an item incorrectly
  - **Then** that item's box decreases
  - **And** the level's mastered status is retained for unlock purposes
  - **Cases**:
    - **AC-2.2.3/1** — An incorrect answer in a mastered level decreases that item's box
    - **AC-2.2.3/2** — The mastered status is retained for unlock purposes after decay

### User Story 2.3 - Interleaved review mode

*Traceability: `US-2.3` — Interleaved review mode*

As a learner, I want a mixed review mode drawing from everything I've unlocked so that my
recall survives outside blocked drills.

**Independent Test**: with levels mastered in two tracks, run Mixed Review and confirm
questions come from both, weighted by box, and count toward the daily goal.

**Acceptance Scenarios**:

- **AC-2.3.1** — Mixed Review is locked until two levels are mastered
  - **Given** I have mastered fewer than 2 levels across all tracks
  - **When** I view the home screen
  - **Then** Mixed Review is locked with its unlock condition shown

- **AC-2.3.2** — Mixed Review draws across tracks, weighted by box, and labels the track
  - **Given** I have mastered levels in at least two different tracks
  - **When** I run a Mixed Review session of 30 questions
  - **Then** questions are drawn from multiple tracks
  - **And** selection is weighted by Leitner box
  - **And** each feedback screen labels the question's track
  - **Cases**:
    - **AC-2.3.2/1** — Mixed Review questions are drawn from multiple tracks
    - **AC-2.3.2/2** — Mixed Review selection is weighted by Leitner box
    - **AC-2.3.2/3** — Each Mixed Review feedback screen labels the question's track

- **AC-2.3.3** — Mixed Review questions count toward the daily goal and streak
  - **Given** today's session goal is not yet met
  - **When** I complete Mixed Review questions
  - **Then** they count toward the daily goal and streak

### User Story 2.4 - Immediate feedback with comparison replay

*Traceability: `US-2.4` — Immediate feedback with comparison replay*

As a learner, I want instant feedback that replays the sound with the correct answer so
that I encode the correction while it's fresh.

**Independent Test**: answer wrongly, confirm the verdict appears within 200 ms and the
comparison replay plays correct then chosen, each labelled.

**Acceptance Scenarios**:

- **AC-2.4.1** — The verdict is displayed within 200 ms of submitting
  - **Given** I have just submitted an answer
  - **When** the app evaluates it
  - **Then** correct/incorrect feedback is displayed within 200 ms

- **AC-2.4.2** — After an error the correct and chosen answers can be heard back-to-back
  - **Given** I answered "sus2" and the correct answer was "sus4"
  - **When** I view the feedback screen
  - **Then** I can tap to hear the correct chord and my chosen chord back-to-back
  - **And** both are labeled on screen during playback
  - **Cases**:
    - **AC-2.4.2/1** — Tapping comparison plays the correct answer then my chosen answer
    - **AC-2.4.2/2** — Both answers are labeled on screen during comparison playback

- **AC-2.4.3** — Replay from the feedback screen uses identical rendering
  - **Given** any feedback screen
  - **When** I tap replay
  - **Then** the original question stimulus plays with identical rendering

### User Story 2.5 - Confusion-weighted question generation

*Traceability: `US-2.5` — Confusion-weighted question generation*

As a learner, I want the app to bias questions toward known-confusable pairs as I improve
so that I train the discriminations that matter.

**Independent Test**: at > 75% accuracy, confuse P5 for P4 and confirm a P4/P5 question
follows within 5; at < 75% confirm plain Leitner weighting.

**Acceptance Scenarios**:

- **AC-2.5.1** — A confused pair is re-asked within five questions once proficient
  - **Given** a level defines P4/P5 as a confusable pair, and my rolling accuracy in the level exceeds 75%
  - **When** I answer a P5 question incorrectly as "P4"
  - **Then** a P4 or P5 question appears within the next 5 questions

- **AC-2.5.2** — Pair bias is inactive below the proficiency threshold
  - **Given** my rolling accuracy in the level is below 75%
  - **When** questions are generated
  - **Then** standard Leitner weighting applies without pair biasing

- **AC-2.5.3** — The confusable partner is always among the answer options
  - **Given** a question on an item with a defined confusable partner
  - **When** answer buttons are displayed
  - **Then** the confusable partner is among the options

---

### User Story 2.6 - In-session progress visibility

*Traceability: `US-2.6` — In-session progress visibility*

As a learner, I want to see how close I am to mastering the current stage while I practise
so that I know how much longer to continue and when it is safe to stop.

**Independent Test**: start an interval level 1 session and confirm the header meter counts
answers toward the level's minimum answer count and tracks rolling accuracy; master level 6
(ascending) and confirm the celebration names level 7 as descending.

**Acceptance Scenarios**:

- **AC-2.6.1** — The session header shows a live mastery-progress meter
  - **Given** a practice session in a level (2026-08-18: was "scoped to the current sub-stage where the track has sub-stages" — sub-stages were retired when levels became presentation tiers, US-3.2/5.2/6.2/8.5)
  - **When** I answer a question
  - **Then** the session header shows how many answers count toward the level's minimum answer count (AC-2.2.4), the rolling accuracy against the 90% threshold, and how many items are still below box 3, updated for that answer
  - **And** where the level carries a presentation, the meter names it (e.g. "Descending")
  - **Cases**:
    - **AC-2.6.1/1** — The answers counted toward the level's minimum answer count are shown and update on each answer
    - **AC-2.6.1/2** — The rolling accuracy is shown against the 90% threshold and updates on each answer
    - **AC-2.6.1/3** — The number of items still below box 3 is shown
    - **AC-2.6.1/4** — The level's presentation is named for tracks whose levels carry one

- **AC-2.6.2** — Mastering a level names the next level and its presentation
  - **Given** a level in a track whose levels carry a presentation (2026-08-18: was "Mastering a sub-stage is announced with the next sub-stage named" — sub-stages were retired; the announcement now lives in the level celebration)
  - **When** my answer satisfies the level's mastery conditions
  - **Then** the level celebration (AC-9.3.2) names the next level that now unlocks, with its number and presentation (e.g. "Level 7 — Descending")
  - **And** when the mastered level is the last in its track, the celebration says the track is complete instead
  - **Cases**:
    - **AC-2.6.2/1** — The celebration names the next level with its number and presentation
    - **AC-2.6.2/2** — Mastering the last level of a track says the track is complete

## Epic 3: Track 1 — Intervals

### User Story 3.1 - Interval level progression

*Traceability: `US-3.1` — Interval level progression*

As a learner, I want intervals introduced from most-contrasting to most-confusable, in the
easiest presentation first, so that early success builds a foundation for hard
discriminations.

**Independent Test**: for each level, generate questions and confirm the pool and
presentation are exactly the listed set.

**Acceptance Scenarios**:

- **AC-3.1.1** — Each interval level draws from exactly its pool and presentation
  - **Given** an interval level is active (2026-08-18: levels restructured from pool-major — every level cycling asc → desc → harm sub-stages — to presentation-major, so a learner is not held on P5/P8 for three sub-stages before hearing a third interval; the presentation column is now part of the level)
  - **When** questions are generated
  - **Then** the question pool and presentation are exactly:

  | Level | Presentation | Pool |
  |---|---|---|
  | 1 | ascending | P8, P5 |
  | 2 | ascending | P8, P5, M3, m3 |
  | 3 | ascending | P8, P5, M3, m3, P4 |
  | 4 | ascending | P8, P5, M3, m3, P4, M2, m2 |
  | 5 | ascending | P8, P5, M3, m3, P4, M2, m2, M6, m6 |
  | 6 | ascending | all 12 simple intervals (adds M7, m7, TT) |
  | 7 | descending | P8, P5, P4, M3, m3 |
  | 8 | descending | P8, P5, P4, M3, m3, M2, m2, M6, m6 |
  | 9 | descending | all 12 simple intervals |
  | 10 | ascending and descending mixed | all 12 simple intervals |
  | 11 | harmonic | P8, P5, P4, TT, M2, m2 (the intervals that fuse or beat) |
  | 12 | harmonic | P8, P5, P4, TT, M2, m2, M3, m3, M6, m6 |
  | 13 | harmonic | all 12 simple intervals (adds M7, m7) |
  | 14 | ascending | all 12 simple + m9, M9, m10, M10 (compound 2nds and 3rds) |
  | 15 | ascending | all 12 simple + m9, M9, m10, M10, P11, P12, m13, M13 |
  | 16 | ascending, descending and harmonic mixed | all simple + compound intervals — mixed review |

  - **Cases**:
    - **AC-3.1.1/1** — Interval level 1 is ascending P8, P5
    - **AC-3.1.1/2** — Interval level 2 is ascending P8, P5, M3, m3
    - **AC-3.1.1/3** — Interval level 3 is ascending P8, P5, M3, m3, P4
    - **AC-3.1.1/4** — Interval level 4 is ascending P8, P5, M3, m3, P4, M2, m2
    - **AC-3.1.1/5** — Interval level 5 is ascending P8, P5, M3, m3, P4, M2, m2, M6, m6
    - **AC-3.1.1/6** — Interval level 6 is ascending all 12 simple intervals
    - **AC-3.1.1/7** — Interval level 7 is descending P8, P5, P4, M3, m3
    - **AC-3.1.1/8** — Interval level 8 is descending P8, P5, P4, M3, m3, M2, m2, M6, m6
    - **AC-3.1.1/9** — Interval level 9 is descending all 12 simple intervals
    - **AC-3.1.1/10** — Interval level 10 is ascending and descending mixed over all 12 simple intervals
    - **AC-3.1.1/11** — Interval level 11 is harmonic P8, P5, P4, TT, M2, m2
    - **AC-3.1.1/12** — Interval level 12 is harmonic P8, P5, P4, TT, M2, m2, M3, m3, M6, m6
    - **AC-3.1.1/13** — Interval level 13 is harmonic all 12 simple intervals
    - **AC-3.1.1/14** — Interval level 14 is ascending all 12 simple plus m9, M9, m10, M10
    - **AC-3.1.1/15** — Interval level 15 is ascending all 12 simple plus all eight compound intervals
    - **AC-3.1.1/16** — Interval level 16 is all presentations mixed over all simple and compound intervals

- **AC-3.1.2** — Interval pools are cumulative and box-weighted
  - **Given** any interval level above 1 within the same presentation tier is active (2026-08-18: was "any interval level above 1"; the pool now restarts when the presentation changes at levels 7, 11 and 14)
  - **When** 50 questions are generated
  - **Then** intervals introduced in all previous levels of that tier also appear in the question stream
  - **And** selection among them is weighted by each item's Leitner box
  - **Cases**:
    - **AC-3.1.2/1** — Intervals from all previous levels of the tier appear in the question stream
    - **AC-3.1.2/2** — Selection among cumulative intervals is weighted by Leitner box

- **AC-3.1.3** — Compound interval questions offer the simple equivalent as a distractor
  - **Given** a compound-interval level (14 and above; 2026-08-18: was 8 and above) is active
  - **When** answer buttons are displayed for a compound interval question
  - **Then** the corresponding simple interval is included among the options (e.g., M2 as a distractor for M9)

### User Story 3.2 - Interval presentation tiers

*Traceability: `US-3.2` — Interval presentation tiers*

As a learner, I want ascending intervals before descending, and descending before harmonic,
so that each level has one difficulty and I master every interval in every form in the order
the forms get harder. *(2026-08-18: was "Interval presentation sub-stages" — every level
cycled asc → desc → harm. The maintainer's guidance is that presentation is the primary
difficulty axis: ascending < descending < harmonic on the whole, so it orders the levels.)*

**Independent Test**: confirm levels 1–6 are ascending, 7–9 descending, 10 mixed
direction, 11–13 harmonic, and that a level's presentation never changes with progress.

**Acceptance Scenarios**:

- **AC-3.2.1** — Interval levels are ordered ascending, descending, mixed direction, harmonic
  - **Given** the interval track (2026-08-18: was "Interval sub-stages unlock in order ascending, descending, harmonic")
  - **When** I look at its levels
  - **Then** levels 1–6 are ascending only, 7–9 descending only, 10 ascending and descending mixed, 11–13 harmonic only, and each level's presentation is fixed by its definition, never by progress
  - **Cases**:
    - **AC-3.2.1/1** — Levels 1 to 6 present intervals ascending only
    - **AC-3.2.1/2** — Levels 7 to 9 present intervals descending only
    - **AC-3.2.1/3** — Level 10 mixes ascending and descending presentations
    - **AC-3.2.1/4** — Levels 11 to 13 present intervals harmonically only
    - **AC-3.2.1/5** — A level's presentation is fixed by its definition and does not change with progress

- **AC-3.2.2** — Each interval presentation form is a separate Leitner item
  - **Given** the interval m6
  - **When** I answer m6-ascending correctly and m6-descending incorrectly
  - **Then** only the `interval:m6:asc` item is promoted and only `interval:m6:desc` is demoted

- **AC-3.2.3** — Interval root notes are randomized across the register
  - **Given** any interval question
  - **When** 20 consecutive questions play
  - **Then** root notes vary across the configured register range
  - **And** no fixed reference pitch is reused in a detectable pattern
  - **Cases**:
    - **AC-3.2.3/1** — Root notes vary across the configured register range over 20 questions
    - **AC-3.2.3/2** — No fixed reference pitch recurs in a detectable pattern

### User Story 3.3 - Interval answer input

*Traceability: `US-3.3` — Interval answer input*

As a learner, I want to answer by tapping interval buttons so that answering is fast on a
phone.

**Independent Test**: open level 3 and confirm exactly five buttons, each ≥ 44 px.

**Acceptance Scenarios**:

- **AC-3.3.1** — The interval answer grid is scoped to the level pool with 44 px targets
  - **Given** interval level 3 is active
  - **When** the answer UI renders
  - **Then** only P8, P5, M3, m3, P4 buttons are shown
  - **And** each touch target is at least 44 px
  - **Cases**:
    - **AC-3.3.1/1** — Only the level 3 interval buttons P8, P5, M3, m3, P4 are shown
    - **AC-3.3.1/2** — Each interval answer touch target is at least 44 px

- **AC-3.3.2** — The label setting switches interval buttons to full names
  - **Given** the label setting is "full names"
  - **When** the answer grid renders
  - **Then** buttons show "minor 3rd" style labels instead of "m3"

### User Story 3.4 - Anchor-song reference

*Traceability: `US-3.4` — Anchor-song reference*

As a learner, I want each interval linked to well-known songs that open with it so that I
build memorable real-music anchors for every interval.

**Independent Test**: answer an interval question and confirm the feedback screen lists the
Appendix B songs for that interval.

**Acceptance Scenarios**:

- **AC-3.4.1** — The feedback screen shows anchor songs for the correct interval
  - **Given** I have just answered an interval question (correctly or incorrectly)
  - **When** the feedback screen displays
  - **Then** it shows up to 5 anchor songs for the correct interval from Appendix B
  - **And** each entry shows the song title and the lyric/motif cue where the interval occurs
  - **Cases**:
    - **AC-3.4.1/1** — Up to five anchor songs for the correct interval are shown
    - **AC-3.4.1/2** — Each anchor entry shows the song title and its lyric or motif cue

- **AC-3.4.2** — Descending anchors are listed first for descending questions
  - **Given** the question was a descending interval
  - **When** anchor songs display
  - **Then** descending anchors are listed first, marked with their direction

- **AC-3.4.3** — Anchor songs are browsable without starting a session
  - **Given** any interval level screen
  - **When** I open the reference view
  - **Then** I can browse all intervals in the level with their anchor songs without starting a session

- **AC-3.4.4** — Compound interval feedback shows the octave-plus-simple decomposition
  - **Given** feedback for a compound interval (level 14+; 2026-08-18: was level 8+)
  - **When** anchor content displays
  - **Then** it shows the "octave + simple interval" decomposition and the simple interval's anchors
  - **And** any known compound-specific examples from Appendix B
  - **Cases**:
    - **AC-3.4.4/1** — Compound feedback shows the octave plus simple interval decomposition with the simple anchors
    - **AC-3.4.4/2** — Compound feedback shows any known compound-specific examples

- **AC-3.4.5** — Anchor-song data ships as bundled static JSON
  - **Given** the anchor song data
  - **When** the app is built
  - **Then** the reference ships as static JSON bundled with the app (no network dependency)

---

## Epic 4: Track 2 — Scale Degrees

### User Story 4.1 - Tonal context establishment

*Traceability: `US-4.1` — Tonal context establishment*

As a learner, I want scale-degree questions preceded by a cadence so that I identify function
within a key, not absolute pitches.

**Independent Test**: start a scale-degree question in E♭ and confirm the I–IV–V–I cadence in
E♭ precedes the target note.

**Acceptance Scenarios**:

- **AC-4.1.1** — A cadence in the question key precedes each scale-degree question
  - **Given** the cadence frequency setting is "every question"
  - **When** a scale-degree question begins in the key of E♭ major
  - **Then** a I–IV–V–I cadence in E♭ major plays before the target note

- **AC-4.1.2** — Keys rotate across a session
  - **Given** a session of 24 scale-degree questions
  - **When** the session completes
  - **Then** multiple different keys were used, selected from all 12

- **AC-4.1.3** — Re-hearing the cadence costs nothing
  - **Given** an active scale-degree question
  - **When** I tap "re-hear cadence"
  - **Then** the cadence replays
  - **And** my replay count and score are unaffected
  - **Cases**:
    - **AC-4.1.3/1** — Tapping re-hear cadence replays the cadence
    - **AC-4.1.3/2** — Re-hearing the cadence leaves the replay count and score unaffected

### User Story 4.2 - Scale degree level progression

*Traceability: `US-4.2` — Scale degree level progression*

As a learner, I want degrees introduced by stability and frequency so that I anchor on the
tonal pillars first.

**Independent Test**: for each level, generate questions and confirm the pool.

**Acceptance Scenarios**:

- **AC-4.2.1** — Each scale-degree level draws from exactly its pool
  - **Given** a scale-degree level is active
  - **When** questions are generated
  - **Then** the pool is exactly:

  | Level | Pool |
  |---|---|
  | 1 | Do, Mi, Sol (major keys) |
  | 2 | + Re, La |
  | 3 | + Fa, Ti (all diatonic, major) |
  | 4 | all diatonic degrees, minor keys, minor cadence |
  | 5 | + chromatic degrees (movable-do chromatic syllables) |

  - **Cases**:
    - **AC-4.2.1/1** — Scale-degree level 1 pool is Do, Mi, Sol in major keys
    - **AC-4.2.1/2** — Scale-degree level 2 pool adds Re and La
    - **AC-4.2.1/3** — Scale-degree level 3 pool adds Fa and Ti for all diatonic major degrees
    - **AC-4.2.1/4** — Scale-degree level 4 uses all diatonic degrees in minor keys with a minor cadence
    - **AC-4.2.1/5** — Scale-degree level 5 adds chromatic degrees with movable-do chromatic syllables

- **AC-4.2.2** — Stable degrees are weighted higher before proficiency
  - **Given** level 3 and rolling accuracy below 75%
  - **When** 50 questions are generated
  - **Then** Do, Sol, and Mi appear more frequently than Fa and Ti

- **AC-4.2.3** — Tendency tones are weighted higher after proficiency
  - **Given** level 3 and rolling accuracy at or above 75%
  - **When** 50 questions are generated
  - **Then** Fa and Ti (and other confusables) appear with increased frequency

### User Story 4.3 - Degree answer input

*Traceability: `US-4.3` — Degree answer input*

As a learner, I want a solfège/degree button row so that I'm always thinking functionally.

**Independent Test**: set labels to "both" and confirm "Do · 1" style buttons; open level 1
and confirm only Do, Mi, Sol.

**Acceptance Scenarios**:

- **AC-4.3.1** — Degree buttons show syllable and number when the setting is "both"
  - **Given** the display setting is "both"
  - **When** the answer row renders
  - **Then** each button shows syllable and number (e.g., "Do · 1")

- **AC-4.3.2** — The degree answer row is scoped to the level pool
  - **Given** scale-degree level 1
  - **When** the answer row renders
  - **Then** only Do, Mi, Sol are shown

### User Story 4.4 - Scale reference scaffold for novices

*Traceability: `US-4.4` — Scale reference scaffold for novices*

As a learner at the first scale-degree levels, I want to hear the whole scale from Do before
the cadence and the target note, and to re-hear the scale, the cadence, or the note
independently, so that I have a concrete reference for every degree while I am still learning
what "home" sounds like. *(Added 2026-08-18: the maintainer, at level 1, found the bare
cadence uninterpretable — "a bunch of chords" with no stated reference — and asked for the
scale as a level-1 crutch that is withdrawn at higher levels.)*

**Independent Test**: start a level 1 question in G major and confirm the G major scale plays
up from G to G and back down, then I–IV–V–I in G, then the target note; confirm three
reference controls (hear scale, re-hear cadence, replay note) and that the first two leave the
replay count untouched; open level 3 and confirm the scale control is disabled with its hint.

**Acceptance Scenarios**:

- **AC-4.4.1** — A level-1 scale-degree question plays the scale, then the cadence, then the target
  - **Given** scale-degree level 1 and the cadence frequency setting is "every question"
  - **When** a question begins in the key of G major
  - **Then** the G major scale plays ascending from Do up to the Do an octave above and back
    down to the starting Do, one note at a time
  - **And** the I–IV–V–I cadence in G major then plays
  - **And** the target note then plays
  - **And** the scale, the cadence and the target belong to the one question, so a replay of
    the question reproduces the same sounds
  - **Cases**:
    - **AC-4.4.1/1** — The major scale plays ascending Do to Do and back down before the cadence at level 1
    - **AC-4.4.1/2** — The cadence follows the scale at level 1
    - **AC-4.4.1/3** — The target note follows the cadence at level 1
    - **AC-4.4.1/4** — The scale is part of the question's prelude, rendered by the one renderer

- **AC-4.4.2** — Which levels play or offer the scale is decided by level data
  - **Given** the scale-degree track's level definitions
  - **When** a question is generated at each level
  - **Then** the scale is auto-played and offered on demand at level 1, offered on demand only
    (not auto-played) at level 2, and neither played nor offered from level 3 onward, and this
    is read from the level definition rather than fixed in code
  - **Cases**:
    - **AC-4.4.2/1** — Level 1 auto-plays the scale and offers it on demand
    - **AC-4.4.2/2** — Level 2 does not auto-play the scale but offers it on demand
    - **AC-4.4.2/3** — Level 3 and above neither play nor offer the scale
    - **AC-4.4.2/4** — The scale scaffold policy is read from the level definition, not fixed in code

- **AC-4.4.3** — Three reference controls are available during a scale-degree question
  - **Given** an active scale-degree question at a level that offers the scale
  - **When** I view the question screen
  - **Then** I see three distinct controls: hear scale, re-hear cadence, and replay note
  - **And** tapping hear scale plays the scale of the question key alone
  - **And** tapping re-hear cadence plays the cadence alone (AC-4.1.3)
  - **And** tapping replay note plays the target note alone
  - **Cases**:
    - **AC-4.4.3/1** — Hear scale, re-hear cadence and replay note are three distinct controls
    - **AC-4.4.3/2** — Hear scale plays only the scale of the question key
    - **AC-4.4.3/3** — Re-hear cadence plays only the cadence
    - **AC-4.4.3/4** — Replay note plays only the target note

- **AC-4.4.4** — Hearing the scale costs nothing
  - **Given** an active scale-degree question at a level that offers the scale
  - **When** I tap hear scale any number of times
  - **Then** my replay count and score are unaffected
  - **And** replay note still counts against the replay limit as before

  - **Cases**:
    - **AC-4.4.4/1** — Tapping hear scale leaves the replay count and score unaffected
    - **AC-4.4.4/2** — Replay note still counts as a replay

- **AC-4.4.5** — At levels without the scale, its control is shown disabled with a hint
  - **Given** an active scale-degree question at level 3 or above
  - **When** I view the question screen
  - **Then** the hear-scale control is present but disabled
  - **And** a short hint beside it says the scale reference is a level 1–2 aid
  - **And** tapping it plays nothing
  - **Cases**:
    - **AC-4.4.5/1** — The hear-scale control is present but disabled from level 3
    - **AC-4.4.5/2** — A hint says the scale reference is a level 1–2 aid
    - **AC-4.4.5/3** — Tapping the disabled control plays nothing

- **AC-4.4.6** — The scale follows the cadence-frequency setting
  - **Given** scale-degree level 1
  - **When** the cadence frequency setting is "first question only" or "never"
  - **Then** the scale is auto-played exactly when the cadence is auto-played, and no more often
  - **And** hear scale and re-hear cadence remain available on demand

  - **Cases**:
    - **AC-4.4.6/1** — The scale auto-plays only when the cadence auto-plays
    - **AC-4.4.6/2** — Hear scale and re-hear cadence remain available on demand regardless of the setting

### User Story 4.5 - Scale-degree onboarding guidance

*Traceability: `US-4.5` — Scale-degree onboarding guidance*

As a first-time learner, I want the Scale Degrees track to tell me what the sounds before the
target note are for, so that I know the last chord is "home" and the question is which degree
the final note is, rather than guessing what the chords are.

**Independent Test**: reset progress, open Scale Degrees, confirm the guidance appears, dismiss
it, restart the app, reopen the track and confirm it does not reappear; open it again from the
help affordance; start level 1 and confirm the "scale → cadence → note" hint on the first
questions.

**Acceptance Scenarios**:

- **AC-4.5.1** — First-time guidance explains the tonal reference
  - **Given** I have never dismissed the Scale Degrees guidance
  - **When** I open the Scale Degrees track
  - **Then** a short guidance panel appears explaining that the chords set the key, the last
    chord is home (Do), the scale plays every degree up from Do and back, and the question is
    which degree the final note is
  - **Cases**:
    - **AC-4.5.1/1** — The guidance appears the first time the Scale Degrees track is opened
    - **AC-4.5.1/2** — The guidance says the chords set the key and the last chord is home (Do)
    - **AC-4.5.1/3** — The guidance says the scale plays every degree from Do and the question is which degree the final note is

- **AC-4.5.2** — Dismissed guidance stays dismissed but remains reachable
  - **Given** I have dismissed the guidance
  - **When** I restart the app and reopen the Scale Degrees track
  - **Then** the guidance does not appear automatically
  - **And** a help affordance on the track opens it again on demand
  - **Cases**:
    - **AC-4.5.2/1** — Dismissed guidance does not reappear after a restart
    - **AC-4.5.2/2** — A help affordance reopens the guidance on demand

- **AC-4.5.3** — Early level-1 questions name the order of sounds
  - **Given** scale-degree level 1 and fewer than 5 questions answered on the track
  - **When** a question begins
  - **Then** a one-line hint on the question screen names the order "scale → cadence → note"
  - **And** from the 5th answered question the hint is no longer shown
  - **Cases**:
    - **AC-4.5.3/1** — The first four level-1 questions show the "scale → cadence → note" hint
    - **AC-4.5.3/2** — The hint is not shown once 5 questions have been answered on the track

---

## Epic 5: Track 3 — Chord Qualities

### User Story 5.1 - Chord quality level progression

*Traceability: `US-5.1` — Chord quality level progression*

As a learner, I want qualities introduced from most-contrasting to most-confusable so that I
build discrimination progressively.

**Independent Test**: for each level, generate questions and confirm pool, voicing rules and
presentation.

**Acceptance Scenarios**:

- **AC-5.1.1** — Each chord-quality level draws from exactly its pool, voicing rules and presentation
  - **Given** a chord-quality level is active (2026-08-18: levels restructured from pool-major — every level cycling block → arpeggiated → varied sub-stages — to presentation-major; the presentation column is now part of the level)
  - **When** questions are generated
  - **Then** the pool, voicing rules and presentation are exactly:

  | Level | Presentation | Pool and voicing |
  |---|---|---|
  | 1 | block | maj, min — root position only |
  | 2 | block | + dim — root position only |
  | 3 | block | + aug — root position only |
  | 4 | block | maj, min — root, 1st, and 2nd inversions |
  | 5 | block | all triads (maj, min, dim, aug) — any inversion |
  | 6 | block | dom7, maj7, m7 — root position only |
  | 7 | block | + m7♭5, dim7 — root position only |
  | 8 | block | all 7th chords — any inversion (root through 3rd) |
  | 9 | block | all triads and 7ths + sus2, sus4 — root position |
  | 10 | arpeggiated | all triads — root position |
  | 11 | arpeggiated | all triads — any inversion |
  | 12 | arpeggiated | all 7th chords — root position |
  | 13 | arpeggiated | all qualities (triads, 7ths, sus) — any voicing |
  | 14 | varied | all triads — any inversion |
  | 15 | varied | all qualities, any voicing — mixed review |

  - **Cases**:
    - **AC-5.1.1/1** — Chord level 1 is block maj and min in root position only
    - **AC-5.1.1/2** — Chord level 2 is block and adds dim in root position only
    - **AC-5.1.1/3** — Chord level 3 is block and adds aug in root position only
    - **AC-5.1.1/4** — Chord level 4 is block maj and min in root, first and second inversions
    - **AC-5.1.1/5** — Chord level 5 is block all triads in any inversion
    - **AC-5.1.1/6** — Chord level 6 is block dom7, maj7 and m7 in root position only
    - **AC-5.1.1/7** — Chord level 7 is block and adds m7b5 and dim7 in root position only
    - **AC-5.1.1/8** — Chord level 8 is block all seventh chords in any inversion root through third
    - **AC-5.1.1/9** — Chord level 9 is block all triads and sevenths plus sus2 and sus4 in root position
    - **AC-5.1.1/10** — Chord level 10 is arpeggiated all triads in root position
    - **AC-5.1.1/11** — Chord level 11 is arpeggiated all triads in any inversion
    - **AC-5.1.1/12** — Chord level 12 is arpeggiated all seventh chords in root position
    - **AC-5.1.1/13** — Chord level 13 is arpeggiated all qualities in any voicing
    - **AC-5.1.1/14** — Chord level 14 is varied all triads in any inversion
    - **AC-5.1.1/15** — Chord level 15 is varied all qualities in any voicing as mixed review

- **AC-5.1.2** — The answer is the quality regardless of voicing
  - **Given** a level that includes inverted voicings
  - **When** a chord plays in any inversion
  - **Then** the correct answer is the chord quality alone
  - **And** the inversion serves only to vary the sound, not the answer
  - **Cases**:
    - **AC-5.1.2/1** — The correct answer for an inverted chord is the quality alone
    - **AC-5.1.2/2** — The inversion varies the sound without changing the answer options

- **AC-5.1.3** — Inversions are introduced only after root-position mastery of a quality group
  - **Given** the level progression above
  - **When** a quality group first appears (triads at level 1, 7ths at level 6)
  - **Then** it is drilled in root position only
  - **And** inverted voicings of that group are introduced in a later level after root-position mastery
  - **Cases**:
    - **AC-5.1.3/1** — A quality group is drilled in root position only when it first appears
    - **AC-5.1.3/2** — Inverted voicings of a group are introduced in a later level after root-position mastery

- **AC-5.1.4** — Voicing is a Leitner dimension for chord qualities
  - **Given** the quality "min" drilled in both root position and inversions
  - **When** I answer min-root correctly and min-inverted incorrectly
  - **Then** only the root-position item is promoted and only the inverted item is demoted

- **AC-5.1.5** — Chord roots are randomized across the register
  - **Given** any chord-quality question
  - **When** 20 consecutive questions play
  - **Then** chord roots vary across the register range with no fixed-pitch pattern

### User Story 5.2 - Chord presentation tiers

*Traceability: `US-5.2` — Chord presentation tiers*

As a learner, I want block chords before arpeggiated, and arpeggiated before varied
voicings, so that each level has one difficulty and I can't rely on one fixed sound by the
end. *(2026-08-18: was "Chord presentation sub-stages" — every level cycled block → arp →
varied; presentation now orders the levels, as for intervals.)*

**Independent Test**: confirm levels 1–9 are block, 10–13 arpeggiated, 14–15 varied; change
the arpeggiation tempo and confirm the next arpeggio uses it.

**Acceptance Scenarios**:

- **AC-5.2.1** — Chord levels are ordered block, arpeggiated, varied
  - **Given** the chord-quality track (2026-08-18: was "Chord sub-stages unlock in order block, arpeggiated, varied")
  - **When** I look at its levels
  - **Then** levels 1–9 are block (close voicing, fixed register), 10–13 arpeggiated, 14–15 varied register/voicing spread, and each level's presentation is fixed by its definition, never by progress
  - **Cases**:
    - **AC-5.2.1/1** — Levels 1 to 9 present block chords in close voicing and fixed register
    - **AC-5.2.1/2** — Levels 10 to 13 present arpeggiated chords
    - **AC-5.2.1/3** — Levels 14 to 15 present varied register and voicing spread

- **AC-5.2.2** — Each chord presentation is a separate Leitner item
  - **Given** the quality maj7
  - **When** I answer maj7-block correctly and maj7-arpeggiated incorrectly
  - **Then** only `chord:maj7:block` is promoted and only `chord:maj7:arp` is demoted

- **AC-5.2.3** — The arpeggiation tempo setting applies to the next arpeggiated question
  - **Given** I change the arpeggiation tempo setting
  - **When** the next arpeggiated question plays
  - **Then** the broken-chord playback uses the new tempo

### User Story 5.3 - Chord quality answer input

*Traceability: `US-5.3` — Chord quality answer input*

As a learner, I want quality buttons labeled with standard chord symbols so that answers map
to how I read charts.

**Independent Test**: open chord level 7 (where m7♭5 is in the pool) and confirm the label
and scoping.

**Acceptance Scenarios**:

- **AC-5.3.1** — Chord buttons show symbol plus name and are scoped to the pool
  - **Given** chord-quality level 7 (2026-08-18: the backlog said level 5, whose pool has no m7♭5; level 7 is the first level in which m7♭5 appears)
  - **When** the answer grid renders
  - **Then** the m7♭5 button reads "m7♭5 · half-diminished"
  - **And** only the level's pool is shown
  - **Cases**:
    - **AC-5.3.1/1** — The m7b5 button reads m7♭5 · half-diminished
    - **AC-5.3.1/2** — Only the chord level's pool is shown

---

## Epic 6: Track 4 — Inversions

Role: this track trains identifying *which* inversion is sounding. It complements the Chord
Qualities track, where inverted voicings appear from level 4 onward but the answer is always
the quality alone.

### User Story 6.1 - Inversion track unlock

*Traceability: `US-6.1` — Inversion track unlock*

As a learner, I want the inversion track to unlock after basic chord qualities so that I have
the prerequisite skill.

**Independent Test**: with Chord Qualities level 1 unmastered, confirm the lock message;
master it and confirm the track is available.

**Acceptance Scenarios**:

- **AC-6.1.1** — The Inversions track is locked until Chord Qualities level 1 is mastered
  - **Given** Chord Qualities level 1 (maj, min in root position) is not yet mastered
  - **When** I view the Inversions track on the home map
  - **Then** it is locked and displays "Master Chord Qualities Level 1 to unlock"

- **AC-6.1.2** — Mastering Chord Qualities level 1 unlocks the Inversions track
  - **Given** I have just mastered Chord Qualities level 1
  - **When** I return to the home map
  - **Then** the Inversions track is available

### User Story 6.2 - Inversion level progression

*Traceability: `US-6.2` — Inversion level progression*

As a learner, I want to learn inversions on familiar chord types first so that I isolate the
inversion variable.

**Independent Test**: for each level, generate questions and confirm the pool and
presentation; at levels 3 and 5 confirm both quality and inversion are required.

**Acceptance Scenarios**:

- **AC-6.2.1** — Each inversion level draws from exactly its pool and presentation
  - **Given** an inversion level is active (2026-08-18: levels restructured from pool-major — every level cycling block → arpeggiated sub-stages — to presentation-major; the presentation column is now part of the level)
  - **When** questions are generated
  - **Then** the pool and presentation are exactly:

  | Level | Presentation | Pool |
  |---|---|---|
  | 1 | block | major triad: root, 1st, 2nd inversion |
  | 2 | block | minor triad: root, 1st, 2nd inversion |
  | 3 | block | mixed maj + min inversions (answer = quality + inversion) |
  | 4 | block | 7th chords: root, 1st, 2nd, 3rd inversion |
  | 5 | arpeggiated | mixed maj + min inversions (answer = quality + inversion) |
  | 6 | arpeggiated | 7th chords: root, 1st, 2nd, 3rd inversion |

  - **Cases**:
    - **AC-6.2.1/1** — Inversion level 1 is block major triad in root, first and second inversion
    - **AC-6.2.1/2** — Inversion level 2 is block minor triad in root, first and second inversion
    - **AC-6.2.1/3** — Inversion level 3 is block mixed major and minor inversions
    - **AC-6.2.1/4** — Inversion level 4 is block seventh chords in root through third inversion
    - **AC-6.2.1/5** — Inversion level 5 is arpeggiated mixed major and minor inversions
    - **AC-6.2.1/6** — Inversion level 6 is arpeggiated seventh chords in root through third inversion

- **AC-6.2.2** — Levels 3 and 5 require both quality and inversion to be correct
  - **Given** inversion level 3 or 5 (2026-08-18: was "Level 3 requires…"; level 5 is the arpeggiated form of the same drill)
  - **When** I answer a question
  - **Then** I must select both the quality (maj/min) and the inversion
  - **And** the answer is correct only if both parts are correct
  - **Cases**:
    - **AC-6.2.2/1** — Inversion levels 3 and 5 require selecting both quality and inversion
    - **AC-6.2.2/2** — An inversion level 3 or 5 answer is correct only if both parts are correct

- **AC-6.2.3** — Inversion levels are ordered block, then arpeggiated
  - **Given** the inversions track (2026-08-18: was "Inversion sub-stages unlock in order block, arpeggiated")
  - **When** I look at its levels
  - **Then** levels 1–4 are block and 5–6 arpeggiated, each fixed by its definition
  - **Cases**:
    - **AC-6.2.3/1** — Levels 1 to 4 present block chords
    - **AC-6.2.3/2** — Levels 5 to 6 present arpeggiated chords

---

## Epic 7: Track 5 — Melodic Phrases

### User Story 7.1 - Melodic dictation levels

*Traceability: `US-7.1` — Melodic dictation levels*

As a learner, I want phrases that scale in length, contour, and interval content so that
dictation difficulty rises smoothly.

**Independent Test**: generate 100 phrases per level and confirm every one satisfies the
level's constraints.

**Acceptance Scenarios**:

- **AC-7.1.1** — Each melodic level generates phrases within its constraints
  - **Given** a melodic level is active
  - **When** a phrase is generated
  - **Then** it satisfies the level's constraints:

  | Level | Constraints |
  |---|---|
  | 1 | 3 notes, stepwise motion only, starts on Do, even eighths |
  | 2 | 4–5 notes, stepwise + 3rds, starts on Do |
  | 3 | 8 notes (one bar of eighths), diatonic leaps up to P5 |
  | 4 | starts on a degree other than Do |
  | 5 | leaps larger than P5 and non-scalar contours allowed |
  | 6 | rhythm varies (quarters + eighths, then simple syncopation) |

  - **Cases**:
    - **AC-7.1.1/1** — Melodic level 1 phrases are 3 stepwise notes starting on Do in even eighths
    - **AC-7.1.1/2** — Melodic level 2 phrases are 4 to 5 notes of steps and thirds starting on Do
    - **AC-7.1.1/3** — Melodic level 3 phrases are 8 eighth notes with diatonic leaps up to P5
    - **AC-7.1.1/4** — Melodic level 4 phrases start on a degree other than Do
    - **AC-7.1.1/5** — Melodic level 5 phrases allow leaps larger than P5 and non-scalar contours
    - **AC-7.1.1/6** — Melodic level 6 phrases vary rhythm with quarters, eighths and simple syncopation

- **AC-7.1.2** — A cadence and tonic reference precede every phrase
  - **Given** any melodic phrase question
  - **When** it begins
  - **Then** a cadence and a tonic reference note play before the phrase

### User Story 7.2 - Sequence answer input

*Traceability: `US-7.2` — Sequence answer input*

As a learner, I want to tap my answer on a scale-degree row so that I transcribe
functionally rather than hunting on a keyboard.

**Independent Test**: build an 8-note answer by tapping, edit it, submit with 6/8 correct and
confirm the marks and score.

**Acceptance Scenarios**:

- **AC-7.2.1** — Tapping a degree appends to the visible answer sequence
  - **Given** an active melodic question of 8 notes
  - **When** I tap degrees on the answer row
  - **Then** each tap appends to a visible answer sequence

- **AC-7.2.2** — The answer sequence can be edited before submission
  - **Given** a partially entered sequence
  - **When** I use delete-last, clear-all, or insert-at-cursor
  - **Then** the sequence updates accordingly before submission
  - **Cases**:
    - **AC-7.2.2/1** — Delete-last removes the final entry of the sequence
    - **AC-7.2.2/2** — Clear-all empties the sequence
    - **AC-7.2.2/3** — Insert-at-cursor places a new entry at the cursor position

- **AC-7.2.3** — Sequences are compared note by note with partial credit
  - **Given** I submit a sequence where 6 of 8 positions match the answer
  - **When** the comparison view displays
  - **Then** the comparison view marks each position correct or incorrect
  - **And** my score for the question is 6/8
  - **Cases**:
    - **AC-7.2.3/1** — The comparison view marks each sequence position correct or incorrect
    - **AC-7.2.3/2** — A sequence with 6 of 8 matching positions scores 6/8

### User Story 7.3 - Limited replays with replay scoring

*Traceability: `US-7.3` — Limited replays with replay scoring*

As a learner, I want a capped number of listens so that I train retention instead of replay
dependence.

**Independent Test**: use 3 replays and confirm the button disables; compare scores at 1 vs
3 replays; view session stats.

**Acceptance Scenarios**:

- **AC-7.3.1** — The replay button disables at the level's replay cap
  - **Given** the level's replay limit is 3
  - **When** I have used 3 replays
  - **Then** the replay button is disabled for that question

- **AC-7.3.2** — Fewer replays earn a higher score
  - **Given** two identical questions answered fully correctly
  - **When** one used 1 replay and the other used 3
  - **Then** the 1-replay answer receives a higher score

- **AC-7.3.3** — Session stats report average replays per question
  - **Given** a completed session
  - **When** I view session stats
  - **Then** average replays per question is reported

---

## Epic 8: Track 6 — Chord Progressions

### User Story 8.1 - Progression track unlock

*Traceability: `US-8.1` — Progression track unlock*

As a learner, I want the progression track gated on chord qualities and inversions so that I
arrive prepared.

**Independent Test**: with only one prerequisite mastered, confirm both are shown with
status; master both and confirm availability.

**Acceptance Scenarios**:

- **AC-8.1.1** — The Progressions track is locked showing both prerequisites and their status
  - **Given** Chord Qualities level 6 (7th chord qualities) is mastered but Inversions level 1 is not
  - **When** I view the Progressions track
  - **Then** it is locked and displays both prerequisites with their current status

- **AC-8.1.2** — Mastering both prerequisites unlocks the Progressions track
  - **Given** Chord Qualities level 6 and Inversions level 1 are both mastered
  - **When** I return to the home map
  - **Then** the Progressions track is available

### User Story 8.2 - Progression level design

*Traceability: `US-8.2` — Progression level design*

As a learner, I want progressions that grow in vocabulary and realism so that I end up
hearing real songs.

**Independent Test**: for each level, generate progressions and confirm vocabulary, texture,
catalog membership and random key; confirm names in feedback and rotation items.

**Acceptance Scenarios**:

- **AC-8.2.1** — Each progression level uses only its vocabulary and texture in a random key
  - **Given** a progression level is active (2026-08-18: levels restructured from pool-major — every level cycling block → voice-led → arpeggiated sub-stages — to presentation-major; texture is now a level property and the catalog is grouped into tiers, Appendix A, that levels draw on)
  - **When** a progression is generated from the level's catalog templates (Appendix A)
  - **Then** it uses only the level's vocabulary and texture and is played in a randomly selected key:

  | Level | Texture | Catalog tiers | Vocabulary |
  |---|---|---|---|
  | 1 | block | 1 | I, IV, V (3-chord progressions, root position) |
  | 2 | block | 1–2 | + vi (4-chord pop templates, e.g., I–V–vi–IV) |
  | 3 | block | 1–3 | + ii, iii |
  | 4 | block | 1–4 | minor keys: i, iv, v, V, VI, VII, III |
  | 5 | block | 1–5 | diatonic 7th qualities (ii7, V7, Imaj7, …) |
  | 6 | block | 1–6 | inversions in the bass (e.g., I, V⁶) |
  | 7 | block | 1–7 | 8-chord phrases + borrowed chords (♭VII, ♭VI, III, iv in major) |
  | 8 | voice-led | 1–3 | major diatonic triads |
  | 9 | voice-led | 1–5 | + minor keys and diatonic 7ths |
  | 10 | voice-led | 1–7 | + bass inversions and borrowed chords |
  | 11 | arpeggiated | 1–3 | major diatonic triads |
  | 12 | arpeggiated | 1–5 | + minor keys and diatonic 7ths |
  | 13 | arpeggiated | 1–7 | + bass inversions and borrowed chords |

  - **Cases**:
    - **AC-8.2.1/1** — Progression level 1 is block using only I, IV, V in root position
    - **AC-8.2.1/2** — Progression level 2 is block and adds vi with 4-chord pop templates
    - **AC-8.2.1/3** — Progression level 3 is block and adds ii and iii
    - **AC-8.2.1/4** — Progression level 4 is block using minor-key vocabulary i, iv, v, V, VI, VII, III
    - **AC-8.2.1/5** — Progression level 5 is block using diatonic seventh qualities
    - **AC-8.2.1/6** — Progression level 6 is block using inversions in the bass
    - **AC-8.2.1/7** — Progression level 7 is block using 8-chord phrases and borrowed chords
    - **AC-8.2.1/8** — Every generated progression is played in a randomly selected key
    - **AC-8.2.1/9** — Progression level 8 is voice-led over catalog tiers 1 to 3
    - **AC-8.2.1/10** — Progression level 9 is voice-led over catalog tiers 1 to 5
    - **AC-8.2.1/11** — Progression level 10 is voice-led over catalog tiers 1 to 7
    - **AC-8.2.1/12** — Progression level 11 is arpeggiated over catalog tiers 1 to 3
    - **AC-8.2.1/13** — Progression level 12 is arpeggiated over catalog tiers 1 to 5
    - **AC-8.2.1/14** — Progression level 13 is arpeggiated over catalog tiers 1 to 7

- **AC-8.2.2** — Progressions are drawn only from the built-in catalog at or below the level's catalog tier
  - **Given** any progression level (2026-08-18: was "at or below the level" — level number and catalog tier no longer coincide above level 7)
  - **When** questions are generated
  - **Then** every progression is an entry (or a rotation of an entry) from the catalog in Appendix A assigned to the level's highest catalog tier or a lower tier

- **AC-8.2.3** — Named progressions show their name in feedback
  - **Given** a catalog progression with a common name (e.g., Axis, 50s, Andalusian)
  - **When** the feedback screen shows the answer
  - **Then** the progression's name is displayed alongside the roman numerals

- **AC-8.2.4** — Each rotation of a rotation-marked family is a distinct Leitner item
  - **Given** the Axis progression family
  - **When** Leitner items are created
  - **Then** each rotation (I–V–vi–IV, vi–IV–I–V, IV–I–V–vi, V–vi–IV–I) is a separate item

- **AC-8.2.5** — A cadence establishes the key before every progression
  - **Given** any progression question
  - **When** it begins
  - **Then** a cadence establishes the key before the progression plays

### User Story 8.3 - Roman numeral answer input

*Traceability: `US-8.3` — Roman numeral answer input*

As a learner, I want to tap roman numeral buttons in sequence so that answering matches how
I analyze songs.

**Independent Test**: open level 2 and confirm four numeral buttons; build and edit a
sequence; submit 3/4 correct.

**Acceptance Scenarios**:

- **AC-8.3.1** — The numeral row is scoped to the level vocabulary
  - **Given** progression level 2
  - **When** the answer UI renders
  - **Then** only I, IV, V, vi buttons are shown

- **AC-8.3.2** — Numeral sequence entry and editing match melodic sequence input
  - **Given** an active progression question
  - **When** I build and edit my numeral sequence
  - **Then** entry and editing behave identically to melodic sequence input (US-7.2): tap appends, delete-last, clear-all and insert-at-cursor all work
  - **Cases**:
    - **AC-8.3.2/1** — Tapping a numeral appends to the visible numeral sequence
    - **AC-8.3.2/2** — Delete-last, clear-all and insert-at-cursor edit the numeral sequence

- **AC-8.3.3** — Progressions are scored chord by chord with partial credit
  - **Given** I submit a 4-chord answer with 3 correct positions
  - **When** the comparison view displays
  - **Then** each position is marked and the question scores 3/4
  - **Cases**:
    - **AC-8.3.3/1** — Each chord position is marked correct or incorrect
    - **AC-8.3.3/2** — A 4-chord answer with 3 correct positions scores 3/4

### User Story 8.4 - Bass-first sub-mode

*Traceability: `US-8.4` — Bass-first sub-mode*

As a learner, I want to identify the bass line first, then the qualities so that my method
matches how musicians transcribe.

**Independent Test**: enable bass-first on a level 2 question and confirm two scored steps;
confirm the toggle is absent at level 1.

**Acceptance Scenarios**:

- **AC-8.4.1** — Bass-first mode asks for bass degrees then numerals, scored separately
  - **Given** bass-first mode is enabled on a progression question
  - **When** the question begins
  - **Then** step 1 asks for the bass scale degrees
  - **And** step 2 asks for the full roman numerals
  - **And** each step is scored separately
  - **Cases**:
    - **AC-8.4.1/1** — Step 1 asks for the bass scale degrees
    - **AC-8.4.1/2** — Step 2 asks for the full roman numerals
    - **AC-8.4.1/3** — Each bass-first step is scored separately

- **AC-8.4.2** — Bass-first is unavailable at level 1 and available from level 2
  - **Given** progression level 1
  - **When** I look for the bass-first toggle
  - **Then** it is unavailable
  - **And** it becomes available from level 2 onward
  - **Cases**:
    - **AC-8.4.2/1** — The bass-first toggle is unavailable at progression level 1
    - **AC-8.4.2/2** — The bass-first toggle is available from progression level 2 onward

### User Story 8.5 - Voicing realism tiers

*Traceability: `US-8.5` — Voicing realism tiers*

As a learner, I want later progression levels to vary voicing and texture so that I can't
lean on fixed-voicing cues. *(2026-08-18: was "Voicing realism sub-stages" — every level
cycled block → voice-led → arp; texture now orders the levels, as for intervals.)*

**Independent Test**: confirm levels 1–7 are block, 8–10 voice-led, 11–13 arpeggiated;
answer a template right as blocks and wrong as arpeggiated and confirm independent boxes.

**Acceptance Scenarios**:

- **AC-8.5.1** — Progression levels are ordered block, voice-led, arpeggiated
  - **Given** the progressions track (2026-08-18: was "Progression texture sub-stages unlock in order block, voice-led, arpeggiated")
  - **When** I look at its levels
  - **Then** levels 1–7 use identical block voicings, 8–10 voice-led voicings with varied register, 11–13 arpeggiated/strummed texture, each fixed by its definition
  - **Cases**:
    - **AC-8.5.1/1** — Levels 1 to 7 use identical block voicings
    - **AC-8.5.1/2** — Levels 8 to 10 use voice-led voicings with varied register
    - **AC-8.5.1/3** — Levels 11 to 13 use arpeggiated or strummed texture

- **AC-8.5.2** — Texture is a Leitner dimension for progressions
  - **Given** the template "I–V–vi–IV"
  - **When** I answer it correctly as blocks but incorrectly as arpeggiated
  - **Then** only the block-texture item is promoted and only the arpeggiated item is demoted

---

## Epic 9: Gamification & Stats

### User Story 9.1 - Unlock map

*Traceability: `US-9.1` — Unlock map*

As a learner, I want a visual map of tracks and levels so that progression feels like a game
world.

**Independent Test**: open the home map and confirm every node shows a state, dependency
lines are drawn, and tapping behaves per node state.

**Acceptance Scenarios**:

- **AC-9.1.1** — Every level node displays one of four states
  - **Given** my current progress
  - **When** I view the home map
  - **Then** every level node displays one of: locked, available, in-progress, mastered

- **AC-9.1.2** — Cross-track dependency lines are drawn on the map
  - **Given** the home map
  - **When** it renders
  - **Then** connections are drawn from Chord Qualities L1 to Inversions and from Chord Qualities L6 + Inversions L1 to Progressions
  - **Cases**:
    - **AC-9.1.2/1** — A connection is drawn from Chord Qualities L1 to Inversions
    - **AC-9.1.2/2** — Connections are drawn from Chord Qualities L6 and Inversions L1 to Progressions

- **AC-9.1.3** — Tapping a node shows its unlock condition or starts a session
  - **Given** a locked node and an available node
  - **When** I tap each
  - **Then** the locked node shows its unlock condition
  - **And** the available node starts a session
  - **Cases**:
    - **AC-9.1.3/1** — Tapping a locked node shows its unlock condition
    - **AC-9.1.3/2** — Tapping an available node starts a session

### User Story 9.2 - Daily streak and session goal

*Traceability: `US-9.2` — Daily streak and session goal*

As a learner, I want a streak tied to a short daily session so that the app encourages
spaced daily practice.

**Independent Test**: answer 30 questions today and confirm the day completes and streak
increments; confirm the stopping-point message.

**Acceptance Scenarios**:

- **AC-9.2.1** — Reaching the daily goal completes the day and increments the streak
  - **Given** the daily goal is 10 minutes or 30 questions (whichever comes first)
  - **When** I reach either threshold today
  - **Then** today is marked complete and the streak increments
  - **Cases**:
    - **AC-9.2.1/1** — Reaching 30 questions marks today complete and increments the streak
    - **AC-9.2.1/2** — Reaching 10 minutes marks today complete and increments the streak

- **AC-9.2.2** — A dismissible stopping-point suggestion follows the goal
  - **Given** I have just met the daily goal mid-session
  - **When** the current question completes
  - **Then** a dismissible message suggests this is a good stopping point

- **AC-9.2.3** — An optional local reminder fires on the mobile build
  - **Given** notifications are enabled in settings on the Capacitor build
  - **When** my usual practice window passes without a session
  - **Then** a local notification reminder fires

- **AC-9.2.4** — Daily-goal progress is visible during a session
  - **Given** a practice session
  - **When** I view the session screen
  - **Then** it shows how many questions I have answered today against the daily goal's question target
  - **And** the stopping-point message says the daily goal was reached
  - **Cases**:
    - **AC-9.2.4/1** — Questions answered today are shown against the daily goal's question target during a session
    - **AC-9.2.4/2** — The stopping-point message names the daily goal as the reason

### User Story 9.3 - XP and level-up feedback

*Traceability: `US-9.3` — XP and level-up feedback*

As a learner, I want points and celebratory feedback so that sessions feel rewarding.

**Independent Test**: award XP under each multiplier and confirm; master a level and confirm
the celebration; confirm unlocks ignore XP.

**Acceptance Scenarios**:

- **AC-9.3.1** — XP multipliers apply for streaks, fewer replays and mixed review
  - **Given** a correct answer
  - **When** XP is awarded
  - **Then** multipliers apply for in-session answer streaks, fewer replays used, and mixed-review questions
  - **Cases**:
    - **AC-9.3.1/1** — An in-session answer streak multiplies XP
    - **AC-9.3.1/2** — Fewer replays used multiplies XP
    - **AC-9.3.1/3** — A mixed-review question multiplies XP

- **AC-9.3.2** — Mastering a level shows a celebration with level stats
  - **Given** I have just mastered a level
  - **When** the mastery condition is met
  - **Then** a celebration screen shows level stats (accuracy, time, weakest item conquered)

- **AC-9.3.3** — XP never gates content
  - **Given** any XP total
  - **When** level unlock conditions are evaluated
  - **Then** only mastery conditions are consulted

### User Story 9.4 - Weakness dashboard

*Traceability: `US-9.4` — Weakness dashboard*

As a learner, I want per-item stats so that I can see exactly which sounds I confuse.

**Independent Test**: open the stats screen and a track's detail; confirm per-item stats,
weakest-first ordering, confusion detail and the trend after 7 days of history.

**Acceptance Scenarios**:

- **AC-9.4.1** — Track detail shows accuracy, attempts and box for every item
  - **Given** the stats screen
  - **When** I open a track's detail
  - **Then** every item shows accuracy, attempts, and current Leitner box

- **AC-9.4.2** — The weakest items are listed first
  - **Given** items with at least 5 attempts
  - **When** the stats screen loads
  - **Then** the lowest-accuracy items are listed at the top

- **AC-9.4.3** — Item detail shows the most frequent wrong answers
  - **Given** the item `interval:P4:asc`
  - **When** I open its detail view
  - **Then** I see which wrong answers I most frequently chose for it

- **AC-9.4.4** — A track shows an accuracy trend after seven days of history
  - **Given** at least 7 days of practice history
  - **When** I view a track's stats
  - **Then** an accuracy trend over time is displayed

---

## Epic 10: Platform & Persistence

Platform strategy: built as a web app first, packaged for app stores with Capacitor. Primary
usage is on phones and tablets; the web version remains permanently functional as the testing
surface. Desktop renders the tablet experience. Release path: manual testing on desktop →
build, test, and release on app stores.

### User Story 10.1 - Form-factor–adaptive layout (mobile-first web app)

*Traceability: `US-10.1` — Form-factor–adaptive layout*

As a learner on a phone or tablet, I want the layout tailored to my device's form factor so
that the app feels native to whatever screen I'm practicing on.

**Independent Test**: render each screen at 375 px, 800 px and 1280 px wide and confirm the
phone/tablet/tablet layouts respectively; rotate and confirm state survives.

**Acceptance Scenarios**:

- **AC-10.1.1** — Phone viewports use the single-column phone layout
  - **Given** a viewport in the phone range (approx. 360–599 px wide)
  - **When** any screen renders
  - **Then** the phone layout is used (single-column, stacked controls)
  - **And** all controls are visible, touch-friendly, and require no hover interactions
  - **Cases**:
    - **AC-10.1.1/1** — A phone viewport renders the single-column stacked layout
    - **AC-10.1.1/2** — On a phone viewport all controls are visible and touch-friendly with no hover interactions

- **AC-10.1.2** — Tablet viewports use the wider tablet layout
  - **Given** a viewport in the tablet range (approx. 600 px and up)
  - **When** any screen renders
  - **Then** the tablet layout is used (wider grids, side-by-side panels where appropriate)

- **AC-10.1.3** — Desktop presents the tablet experience with no hover-dependent behavior
  - **Given** a desktop browser viewport
  - **When** any screen renders
  - **Then** the tablet layout is presented
  - **And** no desktop-only layout or hover-dependent behavior exists
  - **Cases**:
    - **AC-10.1.3/1** — A desktop viewport presents the tablet layout
    - **AC-10.1.3/2** — No desktop-only layout or hover-dependent behavior exists

- **AC-10.1.4** — Rotation reflows the layout without losing state or clipping controls
  - **Given** a phone or tablet
  - **When** the device rotates between portrait and landscape
  - **Then** the layout reflows without loss of state or clipped controls
  - **Cases**:
    - **AC-10.1.4/1** — Rotation preserves in-progress session state
    - **AC-10.1.4/2** — Rotation leaves no control clipped

- **AC-10.1.5** — The production build runs fully on a static host with feature parity
  - **Given** any production build
  - **When** it is deployed to a static host (e.g., GitHub Pages)
  - **Then** the full app is functional in the browser with no server-side components
  - **And** feature parity with the packaged app is maintained (excluding native-only capabilities such as local notifications)
  - **Cases**:
    - **AC-10.1.5/1** — The production build is fully functional from a static host with no server-side components
    - **AC-10.1.5/2** — The web build has feature parity with the packaged app excluding native-only capabilities

### User Story 10.2 - Capacitor mobile build

*Traceability: `US-10.2` — Capacitor mobile build*

As a learner, I want a native mobile build so that practice is one tap away with reliable
audio.

**Independent Test**: build with Capacitor, run a full session in airplane mode, and confirm
persistence schema matches web.

**Acceptance Scenarios**:

- **AC-10.2.1** — The Capacitor build wraps the single web codebase with identical features
  - **Given** the web codebase
  - **When** it is built with Capacitor for iOS and Android
  - **Then** all features function identically to the web version
  - **And** the phone/tablet layout rules from US-10.1 apply based on the device
  - **Cases**:
    - **AC-10.2.1/1** — All features function identically in the Capacitor build
    - **AC-10.2.1/2** — The Capacitor build applies the phone and tablet layout rules by device

- **AC-10.2.2** — Desktop-browser verification precedes any store release
  - **Given** a feature has been implemented
  - **When** it is verified by manual testing in a desktop browser (tablet experience)
  - **Then** and only then is it promoted to Capacitor build, device testing, and app store release

- **AC-10.2.3** — A full session works offline in the installed app
  - **Given** the installed mobile app with airplane mode enabled
  - **When** I complete a full session
  - **Then** all audio, exercises, and progress tracking work with no network

- **AC-10.2.4** — Native persistence uses the same schema as web storage
  - **Given** progress created on the mobile build
  - **When** it is stored via Capacitor Preferences
  - **Then** the schema is identical to web localStorage

### User Story 10.3 - Progress persistence and export

*Traceability: `US-10.3` — Progress persistence and export*

As a learner, I want my progress saved automatically and exportable so that I never lose my
history.

**Independent Test**: change progress, reload; export; import a file from "another device"
and confirm merge and rejection behaviour.

**Acceptance Scenarios**:

- **AC-10.3.1** — Progress changes are persisted under a versioned schema
  - **Given** any change to progress state
  - **When** it occurs
  - **Then** it is persisted locally under a versioned schema

- **AC-10.3.2** — Export produces a JSON file with all progress
  - **Given** my current progress
  - **When** I tap export
  - **Then** a JSON file containing all progress (Leitner state, mastery, streaks, XP, stats) is produced

- **AC-10.3.3** — Import validates, merges most-recent-per-item, and rejects invalid files
  - **Given** an export file from another device
  - **When** I import it
  - **Then** the schema version is validated
  - **And** conflicting items merge by most-recent-per-item
  - **And** an invalid file is rejected with a clear error
  - **Cases**:
    - **AC-10.3.3/1** — Import validates the schema version
    - **AC-10.3.3/2** — Conflicting items merge by most-recent-per-item on import
    - **AC-10.3.3/3** — An invalid import file is rejected with a clear error

- **AC-10.3.4** — Progress recorded before the level restructure is reset, not migrated
  - **Given** a stored progress document, or an export file, whose schema version predates the presentation-tier level restructure (2026-08-18: levels were renumbered in every sub-staged track and sub-stage state was removed; the maintainer chose a reset over a migration that could only guess which new level old answers belonged to)
  - **When** the app loads that document, or I import that file
  - **Then** on load the learning state (items, level mastery, streak and day log, XP, sessions, onboarding flags) is discarded and a fresh document is written, retaining only settings
  - **And** an import of the older file is rejected with a clear error naming its schema version and the supported one
  - **Cases**:
    - **AC-10.3.4/1** — Stored progress from before the restructure is discarded on load and settings are retained
    - **AC-10.3.4/2** — Importing an export file from before the restructure is rejected with an error naming both schema versions

### User Story 10.4 - Settings

*Traceability: `US-10.4` — Settings*

As a learner, I want core preferences configurable so that the app fits my practice.

**Independent Test**: open settings, confirm every listed control exists, change each,
restart, and confirm retention.

**Acceptance Scenarios**:

- **AC-10.4.1** — The settings screen offers every core preference
  - **Given** the settings screen
  - **When** it renders
  - **Then** I can configure each of:

  | Setting |
  |---|
  | cadence frequency |
  | replay limits |
  | arpeggiation tempo |
  | register range |
  | label display (solfège/numbers, symbol/name) |
  | session goal |
  | notification toggle (mobile) |

  - **Cases**:
    - **AC-10.4.1/1** — Cadence frequency is configurable
    - **AC-10.4.1/2** — Replay limits are configurable
    - **AC-10.4.1/3** — Arpeggiation tempo is configurable
    - **AC-10.4.1/4** — Register range is configurable
    - **AC-10.4.1/5** — Label display is configurable for solfège or numbers and symbol or name
    - **AC-10.4.1/6** — Session goal is configurable
    - **AC-10.4.1/7** — The notification toggle is configurable on mobile

- **AC-10.4.2** — Settings persist across a restart
  - **Given** I change any setting and restart the app
  - **When** I return to settings
  - **Then** my changes are retained

- **AC-10.4.3** — A Credits view reachable from Settings lists every bundled asset and its licence
  - **Given** the settings screen (2026-08-18: added under Constitution v1.1.0 Principle X — the piano samples are CC BY 3.0 and attribution is a condition of shipping them)
  - **When** I open Credits
  - **Then** every bundled third-party asset is listed with its author, source and licence

---

### Edge Cases

- AudioContext creation fails entirely (unsupported browser): the app shows a plain message
  and does not start a session.
- The sample set fails to decode: playback is refused with a visible error rather than
  silent.
- A learner answers before the stimulus has finished playing: the answer is accepted and the
  stimulus is stopped.
- Rolling accuracy with fewer than 20 answers: computed over what exists; mastery still
  requires the level's minimum answer count (max(10, 3 × items), AC-2.2.4) so a level cannot
  be mastered on 3 lucky answers.
- A level whose presentation list has several entries (interval levels 10 and 16): its items
  are the pool crossed with every listed presentation, and each question draws one at random
  by Leitner weight like any other item.
- A level whose entire pool sits in one Leitner box: weighting degenerates to uniform.
- Import of a file whose `schemaVersion` is newer than the app understands: rejected with a
  message naming the versions.
- Import of a file identical to local state: no change, no error.
- Daily goal reached across midnight: the day boundary is the device's local midnight.
- Progressions with fewer than 4 chords (2-chord vamps): partial credit is over the actual
  length.
- Sequence answer submitted shorter or longer than the target: positions beyond the shorter
  length count as incorrect.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render every note from the bundled piano sample set through one
  shared renderer that supports the eight exercise shapes in AC-1.3.1.
- **FR-002**: The system MUST schedule notes on the Web Audio clock and unlock/recover the
  AudioContext on the learner's gesture.
- **FR-003**: The system MUST maintain a Leitner box, attempts, correct count and last-seen
  timestamp per item, promote on correct, demote to box 1 on incorrect, and weight selection
  by box.
- **FR-004**: The system MUST decide level mastery from rolling accuracy over the last 20
  answers (≥ 90%), every item ≥ box 3, and at least max(10, 3 × items) answers, and unlock
  the next level on mastery.
- **FR-005**: The system MUST provide six tracks — Intervals, Scale Degrees, Chord Qualities,
  Inversions, Melodic Phrases, Chord Progressions — with the level pools, presentations,
  answer inputs and unlock dependencies specified in Epics 3–8; a level's presentation is
  part of its definition and levels are ordered by presentation difficulty.
- **FR-006**: The system MUST provide Mixed Review across mastered levels of at least two
  tracks.
- **FR-007**: The system MUST give feedback within 200 ms, offer comparison replay after an
  error, and offer stimulus replay with identical rendering.
- **FR-008**: The system MUST bias toward confusable pairs above 75% rolling accuracy and
  always include the confusable partner among options.
- **FR-009**: The system MUST show the home map, daily streak/goal, XP with multipliers,
  mastery celebrations and the weakness dashboard specified in Epic 9.
- **FR-010**: The system MUST adapt layout by form factor, run from a static host, wrap with
  Capacitor, persist under a versioned schema, and export/import progress as JSON.
- **FR-011**: The system MUST expose the settings in AC-10.4.1 and persist them.
- **FR-012**: Level definitions, the progression catalog (Appendix A) and anchor songs
  (Appendix B) MUST be bundled JSON data.

### Key Entities

- **Item**: `<track>:<thing>:<presentation>`; box (1–5), attempts, correct, lastSeen,
  confusion counts by wrong answer.
- **Level**: track, number, pool, presentation(s), prerequisites, confusable pairs, replay
  limit; for progressions, the highest catalog tier drawn on.
- **Question**: item, exercise object (notes, timing, presentation, key, voicing/register),
  options, replay count, answer, score.
- **Session**: track/level or mixed review, questions answered, start/end time, replays.
- **Progress**: items, level mastery, streak/day log, XP, sessions, settings; `schemaVersion`.
- **Catalog entry**: numerals, level, name, rotation flag, textures, active flag.
- **Anchor**: interval id, direction, title, cue, playsMotif flag, simpleEquivalent (compound).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can go from app open to hearing the first question in under 3 taps.
- **SC-002**: Verdict appears within 200 ms of answering in 100% of questions.
- **SC-003**: Every one of the 39 user stories has 100% AC coverage with verbatim-named tests
  (36 from the backlog, plus US-2.6 — in-session progress visibility, US-4.4 — scale
  reference scaffold, and US-4.5 — scale-degree onboarding guidance, all added 2026-08-18)
  and no CRITICAL/HIGH traceability gaps.
- **SC-004**: A full session completes in airplane mode with zero network requests.
- **SC-005**: Progress round-trips through export → import with no loss.

## Assumptions

- Rolling accuracy is over the last 20 answers within a level; the minimum answer count is
  max(10, 3 × the level's item count) (2026-08-18: was a flat 20 per level or sub-stage —
  the box floor already forces at least two correct answers per item, so a 3× multiplier
  keeps small levels short without letting large ones be mastered on a thin sample).
- Presentation tiers (2026-08-18): sub-stages within a level no longer exist. Presentation
  (interval direction, chord texture, progression texture) is a property of the level, and
  levels are ordered by presentation difficulty — ascending < descending < harmonic for
  intervals; block < arpeggiated < varied for chords; block < arpeggiated for inversions;
  block < voice-led < arpeggiated for progressions. The block-before-arpeggiated order for
  chords is kept from the original spec unchanged. Item ids keep their presentation segment,
  so per-presentation Leitner items (AC-3.2.2, AC-5.1.4, AC-5.2.2, AC-8.5.2) are unaffected.
- Progression catalog tiers (2026-08-18): Appendix A's groupings are catalog *tiers* 1–7;
  levels 1–7 draw on tiers 1–N as before, and levels 8–13 re-walk the tiers under the next
  texture.
- The stored-progress reset (AC-10.3.4) is a one-time consequence of renumbering; later
  schema changes should migrate where a faithful mapping exists.
- "Register range" defaults to C3–C5 for roots; the sample range is C2–C6.
- Default cadence frequency: every question for Scale Degrees, Melodic Phrases and
  Progressions; none for Intervals, Chord Qualities and Inversions.
- Scale reference scaffold (US-4.4, added 2026-08-18): the scale is played one note at a time
  at the arpeggiation tempo, ascending Do → Do (octave) and descending back to the starting
  Do, ending on Do without a separate held Do; it is auto-played at level 1 and on demand only
  at level 2, never at level 3+ (major) or in minor keys (level 4+); the policy is level data.
  It obeys the cadence-frequency setting (auto-plays exactly when the cadence does). "Replay"
  in the session already replays the target note only and continues to count against the
  replay limit; "hear scale" and "re-hear cadence" are free. Re-hear cadence keeps replaying
  the cadence alone (AC-4.1.3), not the scale.
- Scale-degree onboarding (US-4.5, added 2026-08-18): the dismissed flag is persisted with
  progress and cleared by a progress reset; the "scale → cadence → note" hint counts questions
  answered on the Scale Degrees track (not per level) and stops from the 5th.
- Default replay limit: 3 per question (Melodic Phrases and Progressions); unlimited for the
  single-stimulus tracks unless configured.
- Default arpeggiation tempo: 120 BPM eighth notes.
- The daily goal defaults to 10 minutes or 30 questions and is configurable (AC-10.4.1/6).
- The in-session daily-goal display shows progress against the question target only; the
  time threshold can still complete the day first, and the stopping-point message covers
  either case (2026-08-18, US-2.6/AC-9.2.4).
- Sing-back and sing-first (US-V2.x) are deferred and out of scope for this feature.
- The piano sample set is a CC-licensed multi-sample set trimmed to ≤ 5 MB; the licence is
  recorded in `research.md`.

## Appendix A: Built-in Progression Catalog

Data source for US-8.2; ships as a bundled data file. Groupings are catalog *tiers* (2026-08-18: headed "Level" until the presentation-tier restructure; a progression level now names the tiers it draws on, AC-8.2.1). Sources: the
common-progression canon (David Bennett Piano's progression videos), Hooktheory's TheoryTab
popularity data, and standard references. Each entry is a template; the engine transposes to
random keys and, where marked, generates rotations.

### Tier 1 — I, IV, V

| # | Progression | Name / notes |
|---|-------------|--------------|
| 1 | I–IV–V–I | Basic full cadence |
| 2 | I–IV–I–V | Alternating tonic |
| 3 | I–V–IV–V | Three-chord rock vamp |
| 4 | I–IV (2-chord vamp) | Plagal vamp |
| 5 | I–V (2-chord vamp) | Tonic–dominant vamp |
| 6 | 12-bar blues: I–I–I–I–IV–IV–I–I–V–IV–I–I(V) | 12-bar blues |
| 7 | 8-bar blues: I–V–IV–IV–I–V–I–V | 8-bar blues |

### Tier 2 — + vi

| # | Progression | Name / notes |
|---|-------------|--------------|
| 8 | I–V–vi–IV | Axis (the "4 chords" progression) — all 4 rotations generated |
| 9 | vi–IV–I–V | Axis rotation ("sensitive" ordering) |
| 10 | I–vi–IV–V | 50s / doo-wop |
| 11 | I–IV–vi–V | Pop variant |
| 12 | I–IV–vi–IV | Alternating plagal color |
| 13 | vi–V–IV–V | Descending-then-hover |
| 14 | vi–IV (2-chord vamp) | Minor-color vamp |

### Tier 3 — + ii, iii

| # | Progression | Name / notes |
|---|-------------|--------------|
| 15 | ii–V–I | The jazz cadence (triad form here) |
| 16 | I–vi–ii–V | Rhythm-changes turnaround / 50s variant |
| 17 | I–V–vi–iii–IV–I–IV–V | Pachelbel's Canon |
| 18 | IV–V–iii–vi | Royal Road (ōdo shinkō, J-pop staple) |
| 19 | vi–ii–V–I | Circle-of-fifths progression |
| 20 | I–iii–IV–V | Ascending pop |
| 21 | I–IV–ii–V | Montgomery-Ward bridge |
| 22 | iii–vi–ii–V | Extended circle turnaround |
| 23 | I–ii–iii–IV–V (stepwise ascent) | Ascending diatonic steps |

### Tier 4 — Minor keys

| # | Progression | Name / notes |
|---|-------------|--------------|
| 24 | i–VII–VI–VII | Aeolian vamp |
| 25 | i–VI–III–VII | Minor Axis (Axis rotation in relative minor) |
| 26 | i–VII–VI–V | Andalusian cadence |
| 27 | i–iv–V(7)–i | Harmonic-minor cadence |
| 28 | i–iv–v–i | Natural-minor cadence (v vs V discrimination) |
| 29 | i–VI–VII–i | Epic/rock minor |
| 30 | i–III–VII–VI | Minor pop |
| 31 | i–VII–i–V–III–VII–i–V–i | Passamezzo antico (classical) |
| 32 | i–V–i–VII–III–VII–i–V | La Folia (classical) |
| 33 | i–iv–VII–III | Minor circle-of-fifths |

### Tier 5 — Diatonic 7ths

| # | Progression | Name / notes |
|---|-------------|--------------|
| 34 | ii7–V7–Imaj7 | Jazz ii–V–I |
| 35 | Imaj7–vi7–ii7–V7 | Jazz turnaround |
| 36 | iii7–vi7–ii7–V7 | Extended turnaround |
| 37 | I7–IV7–I7–V7–IV7–I7 | Blues with dominant 7ths |
| 38 | Imaj7–IVmaj7 vamp | Neo-soul/lo-fi vamp |
| 39 | ii7–V7–iii7–vi7 | Royal Road with 7ths |

### Tier 6 — Inversions in the bass

| # | Progression | Name / notes |
|---|-------------|--------------|
| 40 | I–V⁶–vi–I⁶–IV–I⁶⁴–V | Descending/stepwise bass line |
| 41 | I–I⁶–IV–V | First-inversion approach |
| 42 | I–V⁶⁴–I⁶–IV | Passing 6-4 |
| 43 | i–i(maj7)/♯7 bass–i7/♭7 bass–i6/6 bass | Line cliché (descending chromatic inner/bass line) |
| 44 | IV–I⁶–ii | Stepwise bass ascent fragment |

### Tier 7 — Borrowed chords & 8-chord phrases

| # | Progression | Name / notes |
|---|-------------|--------------|
| 45 | I–III–IV–iv | "Creep" progression |
| 46 | I–♭VII–IV(–I) | Mixolydian ♭VII |
| 47 | ♭VI–♭VII–I | Mario cadence |
| 48 | I–V–♭VII–IV | Chromatic descending 5–6 |
| 49 | iv–I | Minor plagal cadence |
| 50 | ii–♭VII7–I | Backdoor cadence |
| 51 | I–vi–IV–iv–I | Doo-wop with minor plagal color |
| 52 | I–V–vi–IV–I–V–vi–IV (8-chord phrase form) | Extended Axis phrase |

**Catalog rules:**
- Rotations of rotation-marked families (Axis, 50s) are generated automatically and tracked as
  separate Leitner items
- Every entry is stored with: numerals, tier, name, rotation flag, and texture variants (per
  US-8.5)
- The catalog is data-driven (JSON), so new progressions can be added without code changes
- Entries can be flagged inactive per tier for tuning difficulty

## Appendix B: Interval Anchor-Song Reference

Static reference data for US-3.4; ships as a bundled data file. Direction is ascending
unless marked (desc).

### Simple intervals

**Minor 2nd (m2)**: *Jaws* theme — the two-note motif; *Für Elise* — opening E–D♯ (desc);
*White Christmas* — "I'm drea-ming…"; *The Pink Panther* theme — opening chromatic slide;
*Isn't She Lovely* — "Isn't she…"

**Major 2nd (M2)**: *Happy Birthday* — "Happy birth-…"; *Frère Jacques* — opening; *Silent
Night* — "Si-lent…" (desc); *Mary Had a Little Lamb* — opening (desc, then asc); *Do-Re-Mi*
(The Sound of Music) — "Doe, a deer"

**Minor 3rd (m3)**: *Greensleeves* — "A-las…"; *Smoke on the Water* — riff's first interval
(as commonly sung); *Brahms' Lullaby* — "Lul-la-by…"; *Georgia on My Mind* — "Geor-gia…";
*Hey Jude* — "Hey Jude" (desc)

**Major 3rd (M3)**: *Oh, When the Saints Go Marching In* — "Oh when…"; *Kumbaya* —
"Kum-ba…"; *Morning Has Broken* — opening; *Blue Danube Waltz* — opening arpeggio; *Swing
Low, Sweet Chariot* — "Swing low…" (desc)

**Perfect 4th (P4)**: *Here Comes the Bride* — "Here comes…"; *Amazing Grace* — "A-maz-…";
*We Wish You a Merry Christmas* — "We wish…"; *Hedwig's Theme* (Harry Potter) — after the
pickup note; *Auld Lang Syne* — "Should auld…"

**Tritone (TT)**: *The Simpsons* theme — "The Simp-sons"; *Maria* (West Side Story) —
"Ma-ri-a"; *Purple Haze* — opening riff; *Danse Macabre* — the violin's "devil's interval";
*YYZ* (Rush) — opening motif

**Perfect 5th (P5)**: *Twinkle, Twinkle, Little Star* — "Twin-kle twin-kle"; *Star Wars* main
theme — after the pickup; *Also Sprach Zarathustra* (2001) — second interval of the opening;
*Scarborough Fair* — "Are you…"; *Flintstones* theme — "Flint-stones" (desc)

**Minor 6th (m6)**: *Where Do I Begin* (Love Story theme) — opening; *Manhã de Carnaval*
(Black Orpheus) — opening; *In My Life* (The Beatles) — opening guitar (desc); *The Morning
After* — opening; *Go Down Moses* — "When Is-rael…" (desc)

**Major 6th (M6)**: NBC chimes — first two notes; *My Bonnie Lies Over the Ocean* — "My
Bon-nie"; *Jingle Bells* — "Dash-ing through the snow"; *It Came Upon a Midnight Clear* —
opening; *Take the "A" Train* — opening

**Minor 7th (m7)**: *Somewhere* (West Side Story) — "There's a place for us"; *Star Trek*
(original series theme) — opening leap; *Watermelon Man* — opening horn line; *An American in
Paris* — main theme leap; *The Winner Takes It All* — "The win-ner…" (desc)

**Major 7th (M7)**: *Take On Me* — the big chorus leap; *Don't Know Why* (Norah Jones) —
opening (desc); *Cast Your Fate to the Wind* — opening; *I Love You* (Cole Porter) — "I love
you" (desc); *Superman* theme — the leap in the main fanfare

**Octave (P8)**: *Somewhere Over the Rainbow* — "Some-where"; *Starman* (David Bowie) —
"Star-man" in the chorus; *Singin' in the Rain* — "I'm sing-in'"; *The Christmas Song* —
"Chest-nuts roast-ing"; *My Sharona* — the octave riff

### Compound intervals (levels 8–12)

Presented as **octave + simple interval** plus the known real-world examples:

| Interval | = Octave + | Known examples |
|---|---|---|
| m9 | m2 | Mostly heard harmonically in jazz voicings; *What Is This Thing Called Love* piano stab (some arrangements) |
| M9 | M2 | *La Traviata* Act 1 Prelude; *Somewhere in My Memory* (Home Alone) span |
| m10 | m3 | Ragtime stride left-hand leaps (*Maple Leaf Rag*) |
| M10 | M3 | Chopin *Étude Op. 10 No. 1*-style arpeggios; stride piano bass |
| P11 | P4 | *On the Trail* (Grofé) horn leap; rare melodically |
| P12 | P5 | *Rhapsody in Blue* opening clarinet span |
| m13 | m6 | Heard harmonically in jazz 13th chords |
| M13 | M6 | Jazz-harmony color, not a melodic leap |

**Data rules:**
- Each entry stores: interval id, direction, title, cue text, and an optional "plays the
  motif" flag for entries where the app can render the two-note motif on piano
- Compound entries additionally store the simple-equivalent id for the decomposition display

## Deferred (v2) — not in this feature

US-V2.1 (sing-back with mic pitch detection) and US-V2.2 (honor-system sing-first prompt)
remain in `specs/ear-training-backlog.md` and will be specified as a separate feature when
scheduled.

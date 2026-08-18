# Traceability Matrix

<!--
  GENERATED FILE — do not edit by hand.

  Regenerate with:  npm run trace:matrix
  It is checked by  npm run check:trace  (check T8), so an out-of-date matrix fails
  the build rather than sitting quietly out of step with the spec.

  The decisions live elsewhere. Which AC belongs to which plan item, and which tasks
  build and prove it, are authored in the plan's own Traceability Matrix. This file is
  that expanded one row per criterion, cross-referenced against the test suite, and
  marked with what is true right now.
-->

**Feature**: specs/001-ear-trainer/spec.md
**Criteria**: 207 across 36 User Stories

**Coverage**: 207 of 207 criteria proven (100.0%)

| | Criteria | Share |
|---|---|---|
| 🟢 Proven | 207 | 100.0% |

A row is one *criterion*: an Acceptance Criterion that asserts one thing, or one Case of
an AC that asserts several. 🖵 marks a criterion that describes something a person sees or
does, which cannot be proved by a test with no document to look at.

🟢 proven · 🔵 waived · and 🟡 → 🟠 → 🔴
as a gap gets more serious. The colour only repeats what the row already says in words, so
nothing is lost reading this in greyscale, in a plain diff, or by someone who cannot tell
the red from the green.

## How a gap is ranked

Severity comes from the kind of gap, not from a judgement recorded per criterion, so it
cannot be talked down when a deadline is close.

| Severity | Gap | Why it ranks there |
|---|---|---|
| 🔴 **CRITICAL** | NO TEST — nothing names this criterion | Nobody has looked. This is the state an unbuilt requirement sits in. |
| 🔴 **HIGH** | WRONG TEST — a test names it but proves something else | The claim is unproven while reporting as covered. This is what hid US-2.2 and US-11.1/11.2. |
| 🔴 **HIGH** | NOT PROVABLE — UI-level, but only a pure unit test | Same failure, arrived at differently: `core/` cannot see a screen, whatever the test is named. |
| 🟠 **MEDIUM** | NEEDS CASES — a compound AC not decomposed | Partly proven. One test stands in for several claims, so some of them are unchecked. |
| 🟡 **LOW** | MISNAMED — right test, named in its own words | Proven. Clerical: the name has drifted from the spec's wording. |

🔵 **WAIVED** marks a gap deliberately left open, with its reason shown in the row. Only LOW
and MEDIUM may be waived — CRITICAL and HIGH are exactly the states that let unbuilt work
report as complete, so no reason clears them (Constitution Principle IV).

ᵃ marks a gap accepted as pre-existing debt (0 rows). It is reported but does not
fail the build, and it is outstanding work — never a settled decision.

## Coverage by User Story

| User Story | Criteria | 🟢 Proven | 🔵 Waived | 🔴 CRITICAL | 🔴 HIGH | 🟠 MEDIUM | 🟡 LOW |
|---|---|---|---|---|---|---|---|
| 🟢 US-1.1 | 4 | **4** | · | · | · | · | · |
| 🟢 US-1.2 | 4 | **4** | · | · | · | · | · |
| 🟢 US-1.3 | 10 | **10** | · | · | · | · | · |
| 🟢 US-2.1 | 6 | **6** | · | · | · | · | · |
| 🟢 US-2.2 | 6 | **6** | · | · | · | · | · |
| 🟢 US-2.3 | 5 | **5** | · | · | · | · | · |
| 🟢 US-2.4 | 4 | **4** | · | · | · | · | · |
| 🟢 US-2.5 | 3 | **3** | · | · | · | · | · |
| 🟢 US-3.1 | 15 | **15** | · | · | · | · | · |
| 🟢 US-3.2 | 5 | **5** | · | · | · | · | · |
| 🟢 US-3.3 | 3 | **3** | · | · | · | · | · |
| 🟢 US-3.4 | 7 | **7** | · | · | · | · | · |
| 🟢 US-4.1 | 4 | **4** | · | · | · | · | · |
| 🟢 US-4.2 | 7 | **7** | · | · | · | · | · |
| 🟢 US-4.3 | 2 | **2** | · | · | · | · | · |
| 🟢 US-5.1 | 16 | **16** | · | · | · | · | · |
| 🟢 US-5.2 | 5 | **5** | · | · | · | · | · |
| 🟢 US-5.3 | 2 | **2** | · | · | · | · | · |
| 🟢 US-6.1 | 2 | **2** | · | · | · | · | · |
| 🟢 US-6.2 | 7 | **7** | · | · | · | · | · |
| 🟢 US-7.1 | 7 | **7** | · | · | · | · | · |
| 🟢 US-7.2 | 6 | **6** | · | · | · | · | · |
| 🟢 US-7.3 | 3 | **3** | · | · | · | · | · |
| 🟢 US-8.1 | 2 | **2** | · | · | · | · | · |
| 🟢 US-8.2 | 12 | **12** | · | · | · | · | · |
| 🟢 US-8.3 | 5 | **5** | · | · | · | · | · |
| 🟢 US-8.4 | 5 | **5** | · | · | · | · | · |
| 🟢 US-8.5 | 4 | **4** | · | · | · | · | · |
| 🟢 US-9.1 | 5 | **5** | · | · | · | · | · |
| 🟢 US-9.2 | 4 | **4** | · | · | · | · | · |
| 🟢 US-9.3 | 5 | **5** | · | · | · | · | · |
| 🟢 US-9.4 | 4 | **4** | · | · | · | · | · |
| 🟢 US-10.1 | 9 | **9** | · | · | · | · | · |
| 🟢 US-10.2 | 5 | **5** | · | · | · | · | · |
| 🟢 US-10.3 | 5 | **5** | · | · | · | · | · |
| 🟢 US-10.4 | 9 | **9** | · | · | · | · | · |

## Every criterion

| Story | Criterion | What it requires | Plan | Implementation tasks | Test tasks | Proving test | Status |
|---|---|---|---|---|---|---|---|
| US-1.1 | `AC-1.1.1/1` | The nearest sample is chosen and pitch-shifted to the target note | P-006 | T018 (1/1 done) | T019 (1/1 done) | `sampler.test.js` | 🟢 OK |
| US-1.1 | `AC-1.1.1/2` | No network request is made during playback | P-006 | T018 (1/1 done) | T019 (1/1 done) | `audio.spec.js` | 🟢 OK |
| US-1.1 | `AC-1.1.1/3` | The bundled sample set totals at most 5 MB | P-006 | T018 (1/1 done) | T019 (1/1 done) | `sampler.test.js` | 🟢 OK |
| US-1.1 | `AC-1.1.2` 🖵 | Adjacent pitches play without clicks, dropouts or mistuning | P-006 | T018 (1/1 done) | T019 (1/1 done) | `sampler.test.js`, `audio.spec.js` | 🟢 OK |
| US-1.2 | `AC-1.2.1` 🖵 | The AudioContext is resumed on the first tap | P-007 | T020 (1/1 done) | T021 (1/1 done) | `audioUnlock.test.js` | 🟢 OK |
| US-1.2 | `AC-1.2.2/1` | Every note is scheduled via the Web Audio clock, never a timer | P-007 | T020 (1/1 done) | T021 (1/1 done) | `scheduler.test.js` | 🟢 OK |
| US-1.2 | `AC-1.2.2/2` | Note onsets are accurate within 10 ms of the scheduled time | P-007 | T020 (1/1 done) | T021 (1/1 done) | `scheduler.test.js` | 🟢 OK |
| US-1.2 | `AC-1.2.3` 🖵 | Audio recovers after backgrounding without a reload | P-007 | T020 (1/1 done) | T021 (1/1 done) | `audioUnlock.test.js` | 🟢 OK |
| US-1.3 | `AC-1.3.1/1` | A single note renders as one note at its pitch and duration | P-008 | T022 (1/1 done) | T023 (1/1 done) | `renderer.test.js` | 🟢 OK |
| US-1.3 | `AC-1.3.1/2` | An ascending interval renders its two notes lower then higher | P-008 | T022 (1/1 done) | T023 (1/1 done) | `renderer.test.js` | 🟢 OK |
| US-1.3 | `AC-1.3.1/3` | A descending interval renders its two notes higher then lower | P-008 | T022 (1/1 done) | T023 (1/1 done) | `renderer.test.js` | 🟢 OK |
| US-1.3 | `AC-1.3.1/4` | A harmonic interval renders both notes at the same onset | P-008 | T022 (1/1 done) | T023 (1/1 done) | `renderer.test.js` | 🟢 OK |
| US-1.3 | `AC-1.3.1/5` | A block chord renders all chord tones at the same onset | P-008 | T022 (1/1 done) | T023 (1/1 done) | `renderer.test.js` | 🟢 OK |
| US-1.3 | `AC-1.3.1/6` | An arpeggiated chord renders its tones in sequence at the arpeggiation tempo | P-008 | T022 (1/1 done) | T023 (1/1 done) | `renderer.test.js` | 🟢 OK |
| US-1.3 | `AC-1.3.1/7` | A melodic sequence renders each note at its own onset and duration | P-008 | T022 (1/1 done) | T023 (1/1 done) | `renderer.test.js` | 🟢 OK |
| US-1.3 | `AC-1.3.1/8` | A chord progression renders each chord in order at its own onset | P-008 | T022 (1/1 done) | T023 (1/1 done) | `renderer.test.js` | 🟢 OK |
| US-1.3 | `AC-1.3.2` | A cadence prelude plays in the exercise key before the stimulus | P-008 | T022 (1/1 done) | T023 (1/1 done) | `renderer.test.js` | 🟢 OK |
| US-1.3 | `AC-1.3.3` 🖵 | Replay uses identical rendering | P-008 | T022 (1/1 done) | T023 (1/1 done) | `replay.test.js` | 🟢 OK |
| US-2.1 | `AC-2.1.1` | A correct answer promotes the item one box | P-009 | T024 (1/1 done) | T025 (1/1 done) | `leitner.test.js` | 🟢 OK |
| US-2.1 | `AC-2.1.2` | An incorrect answer demotes the item to box 1 | P-009 | T024 (1/1 done) | T025 (1/1 done) | `leitner.test.js` | 🟢 OK |
| US-2.1 | `AC-2.1.3` | Lower boxes are selected more often than higher boxes | P-009 | T024 (1/1 done) | T025 (1/1 done) | `leitner.test.js` | 🟢 OK |
| US-2.1 | `AC-2.1.4/1` | Every item's box is unchanged after reopening | P-009 | T024 (1/1 done) | T025 (1/1 done) | `leitnerPersistence.test.js` | 🟢 OK |
| US-2.1 | `AC-2.1.4/2` | Every item's attempts and correct count are unchanged after reopening | P-009 | T024 (1/1 done) | T025 (1/1 done) | `leitnerPersistence.test.js` | 🟢 OK |
| US-2.1 | `AC-2.1.4/3` | Every item's last-seen timestamp is unchanged after reopening | P-009 | T024 (1/1 done) | T025 (1/1 done) | `leitnerPersistence.test.js` | 🟢 OK |
| US-2.2 | `AC-2.2.1/1` | The level is marked mastered on the satisfying answer | P-010 | T026 (1/1 done) | T027 (1/1 done) | `mastery.test.js` | 🟢 OK |
| US-2.2 | `AC-2.2.1/2` | The next level unlocks when the level is mastered | P-010 | T026 (1/1 done) | T027 (1/1 done) | `mastery.test.js` | 🟢 OK |
| US-2.2 | `AC-2.2.2/1` 🖵 | The level is not mastered while an item is below box 3 | P-010 | T026 (1/1 done) | T027 (1/1 done) | `mastery.test.js`, `levelScreen.test.js` | 🟢 OK |
| US-2.2 | `AC-2.2.2/2` 🖵 | The level screen shows which mastery condition is unmet | P-010 | T026 (1/1 done) | T027 (1/1 done) | `levelScreen.test.js` | 🟢 OK |
| US-2.2 | `AC-2.2.3/1` | An incorrect answer in a mastered level decreases that item's box | P-010 | T026 (1/1 done) | T027 (1/1 done) | `mastery.test.js` | 🟢 OK |
| US-2.2 | `AC-2.2.3/2` | The mastered status is retained for unlock purposes after decay | P-010 | T026 (1/1 done) | T027 (1/1 done) | `mastery.test.js` | 🟢 OK |
| US-2.3 | `AC-2.3.1` 🖵 | Mixed Review is locked until two levels are mastered | P-011 | T028 (1/1 done) | T029 (1/1 done) | `mixedReview.spec.js` | 🟢 OK |
| US-2.3 | `AC-2.3.2/1` 🖵 | Mixed Review questions are drawn from multiple tracks | P-011 | T028 (1/1 done) | T029 (1/1 done) | `mixedReview.spec.js` | 🟢 OK |
| US-2.3 | `AC-2.3.2/2` 🖵 | Mixed Review selection is weighted by Leitner box | P-011 | T028 (1/1 done) | T029 (1/1 done) | `mixedReview.spec.js` | 🟢 OK |
| US-2.3 | `AC-2.3.2/3` 🖵 | Each Mixed Review feedback screen labels the question's track | P-011 | T028 (1/1 done) | T029 (1/1 done) | `mixedReview.spec.js` | 🟢 OK |
| US-2.3 | `AC-2.3.3` | Mixed Review questions count toward the daily goal and streak | P-011 | T028 (1/1 done) | T029 (1/1 done) | `mixedReview.test.js` | 🟢 OK |
| US-2.4 | `AC-2.4.1` 🖵 | The verdict is displayed within 200 ms of submitting | P-012 | T030 (1/1 done) | T031 (1/1 done) | `feedback.spec.js` | 🟢 OK |
| US-2.4 | `AC-2.4.2/1` 🖵 | Tapping comparison plays the correct answer then my chosen answer | P-012 | T030 (1/1 done) | T031 (1/1 done) | `feedback.spec.js` | 🟢 OK |
| US-2.4 | `AC-2.4.2/2` 🖵 | Both answers are labeled on screen during comparison playback | P-012 | T030 (1/1 done) | T031 (1/1 done) | `feedback.spec.js` | 🟢 OK |
| US-2.4 | `AC-2.4.3` 🖵 | Replay from the feedback screen uses identical rendering | P-012 | T030 (1/1 done) | T031 (1/1 done) | `feedback.spec.js` | 🟢 OK |
| US-2.5 | `AC-2.5.1` | A confused pair is re-asked within five questions once proficient | P-013 | T032 (1/1 done) | T033 (1/1 done) | `confusion.test.js` | 🟢 OK |
| US-2.5 | `AC-2.5.2` | Pair bias is inactive below the proficiency threshold | P-013 | T032 (1/1 done) | T033 (1/1 done) | `confusion.test.js` | 🟢 OK |
| US-2.5 | `AC-2.5.3` 🖵 | The confusable partner is always among the answer options | P-013 | T032 (1/1 done) | T033 (1/1 done) | `options.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/1` | Interval level 1 pool is exactly P8, P5 | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/2` | Interval level 2 pool is exactly P8, P5, M3, m3 | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/3` | Interval level 3 pool is exactly P8, P5, M3, m3, P4 | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/4` | Interval level 4 pool is exactly P8, P5, M3, m3, P4, M2, m2 | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/5` | Interval level 5 pool is exactly P8, P5, M3, m3, P4, M2, m2, M6, m6 | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/6` | Interval level 6 pool is all 12 simple intervals | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/7` | Interval level 7 pool is all 12 simple intervals as mixed review | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/8` | Interval level 8 pool adds m9 and M9 | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/9` | Interval level 9 pool adds m10 and M10 | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/10` | Interval level 10 pool adds P11 and P12 | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/11` | Interval level 11 pool adds m13 and M13 | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.1/12` | Interval level 12 pool is all simple and compound intervals as mixed review | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.2/1` | Intervals from all previous levels appear in the question stream | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.2/2` | Selection among cumulative intervals is weighted by Leitner box | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervals.test.js` | 🟢 OK |
| US-3.1 | `AC-3.1.3` 🖵 | Compound interval questions offer the simple equivalent as a distractor | P-014 | T034 (1/1 done) | T035 (1/1 done) | `intervalOptions.test.js` | 🟢 OK |
| US-3.2 | `AC-3.2.1/1` | Mastering the ascending sub-stage unlocks the descending sub-stage | P-015 | T036 (1/1 done) | T037 (1/1 done) | `subStages.test.js` | 🟢 OK |
| US-3.2 | `AC-3.2.1/2` | The harmonic sub-stage remains locked until descending is mastered | P-015 | T036 (1/1 done) | T037 (1/1 done) | `subStages.test.js` | 🟢 OK |
| US-3.2 | `AC-3.2.2` | Each interval presentation form is a separate Leitner item | P-015 | T036 (1/1 done) | T037 (1/1 done) | `intervalItems.test.js`, `intervals.test.js` | 🟢 OK |
| US-3.2 | `AC-3.2.3/1` | Root notes vary across the configured register range over 20 questions | P-015 | T036 (1/1 done) | T037 (1/1 done) | `intervalItems.test.js` | 🟢 OK |
| US-3.2 | `AC-3.2.3/2` | No fixed reference pitch recurs in a detectable pattern | P-015 | T036 (1/1 done) | T037 (1/1 done) | `intervalItems.test.js` | 🟢 OK |
| US-3.3 | `AC-3.3.1/1` 🖵 | Only the level 3 interval buttons P8, P5, M3, m3, P4 are shown | P-016 | T038 (1/1 done) | T039 (1/1 done) | `intervalGrid.spec.js` | 🟢 OK |
| US-3.3 | `AC-3.3.1/2` 🖵 | Each interval answer touch target is at least 44 px | P-016 | T038 (1/1 done) | T039 (1/1 done) | `intervalGrid.spec.js` | 🟢 OK |
| US-3.3 | `AC-3.3.2` 🖵 | The label setting switches interval buttons to full names | P-016 | T038 (1/1 done) | T039 (1/1 done) | `intervalGrid.spec.js` | 🟢 OK |
| US-3.4 | `AC-3.4.1/1` 🖵 | Up to five anchor songs for the correct interval are shown | P-017 | T040 (1/1 done) | T041 (1/1 done) | `anchors.test.js` | 🟢 OK |
| US-3.4 | `AC-3.4.1/2` 🖵 | Each anchor entry shows the song title and its lyric or motif cue | P-017 | T040 (1/1 done) | T041 (1/1 done) | `anchors.test.js` | 🟢 OK |
| US-3.4 | `AC-3.4.2` | Descending anchors are listed first for descending questions | P-017 | T040 (1/1 done) | T041 (1/1 done) | `anchors.test.js` | 🟢 OK |
| US-3.4 | `AC-3.4.3` 🖵 | Anchor songs are browsable without starting a session | P-017 | T040 (1/1 done) | T041 (1/1 done) | `reference.spec.js` | 🟢 OK |
| US-3.4 | `AC-3.4.4/1` 🖵 | Compound feedback shows the octave plus simple interval decomposition with the simple anchors | P-017 | T040 (1/1 done) | T041 (1/1 done) | `anchors.test.js` | 🟢 OK |
| US-3.4 | `AC-3.4.4/2` 🖵 | Compound feedback shows any known compound-specific examples | P-017 | T040 (1/1 done) | T041 (1/1 done) | `anchors.test.js` | 🟢 OK |
| US-3.4 | `AC-3.4.5` | Anchor-song data ships as bundled static JSON | P-017 | T040 (1/1 done) | T041 (1/1 done) | `anchorsBundled.test.js` | 🟢 OK |
| US-4.1 | `AC-4.1.1` | A cadence in the question key precedes each scale-degree question | P-018 | T042 (1/1 done) | T043 (1/1 done) | `scaleDegrees.test.js` | 🟢 OK |
| US-4.1 | `AC-4.1.2` | Keys rotate across a session | P-018 | T042 (1/1 done) | T043 (1/1 done) | `scaleDegrees.test.js` | 🟢 OK |
| US-4.1 | `AC-4.1.3/1` 🖵 | Tapping re-hear cadence replays the cadence | P-018 | T042 (1/1 done) | T043 (1/1 done) | `scaleDegrees.spec.js` | 🟢 OK |
| US-4.1 | `AC-4.1.3/2` 🖵 | Re-hearing the cadence leaves the replay count and score unaffected | P-018 | T042 (1/1 done) | T043 (1/1 done) | `scaleDegrees.spec.js` | 🟢 OK |
| US-4.2 | `AC-4.2.1/1` | Scale-degree level 1 pool is Do, Mi, Sol in major keys | P-019 | T044 (1/1 done) | T045 (1/1 done) | `scaleDegreeLevels.test.js` | 🟢 OK |
| US-4.2 | `AC-4.2.1/2` | Scale-degree level 2 pool adds Re and La | P-019 | T044 (1/1 done) | T045 (1/1 done) | `scaleDegreeLevels.test.js` | 🟢 OK |
| US-4.2 | `AC-4.2.1/3` | Scale-degree level 3 pool adds Fa and Ti for all diatonic major degrees | P-019 | T044 (1/1 done) | T045 (1/1 done) | `scaleDegreeLevels.test.js` | 🟢 OK |
| US-4.2 | `AC-4.2.1/4` | Scale-degree level 4 uses all diatonic degrees in minor keys with a minor cadence | P-019 | T044 (1/1 done) | T045 (1/1 done) | `scaleDegreeLevels.test.js` | 🟢 OK |
| US-4.2 | `AC-4.2.1/5` | Scale-degree level 5 adds chromatic degrees with movable-do chromatic syllables | P-019 | T044 (1/1 done) | T045 (1/1 done) | `scaleDegreeLevels.test.js` | 🟢 OK |
| US-4.2 | `AC-4.2.2` | Stable degrees are weighted higher before proficiency | P-019 | T044 (1/1 done) | T045 (1/1 done) | `scaleDegreeLevels.test.js` | 🟢 OK |
| US-4.2 | `AC-4.2.3` | Tendency tones are weighted higher after proficiency | P-019 | T044 (1/1 done) | T045 (1/1 done) | `scaleDegreeLevels.test.js` | 🟢 OK |
| US-4.3 | `AC-4.3.1` 🖵 | Degree buttons show syllable and number when the setting is "both" | P-020 | T046 (1/1 done) | T047 (1/1 done) | `degreeRow.spec.js` | 🟢 OK |
| US-4.3 | `AC-4.3.2` 🖵 | The degree answer row is scoped to the level pool | P-020 | T046 (1/1 done) | T047 (1/1 done) | `degreeRow.spec.js` | 🟢 OK |
| US-5.1 | `AC-5.1.1/1` | Chord level 1 pool is maj and min in root position only | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.1/2` | Chord level 2 pool adds dim in root position only | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.1/3` | Chord level 3 pool adds aug in root position only | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.1/4` | Chord level 4 pool is maj and min in root, first and second inversions | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.1/5` | Chord level 5 pool is all triads in any inversion | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.1/6` | Chord level 6 pool is dom7, maj7 and m7 in root position only | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.1/7` | Chord level 7 pool adds m7b5 and dim7 in root position only | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.1/8` | Chord level 8 pool is all seventh chords in any inversion root through third | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.1/9` | Chord level 9 pool adds sus2 and sus4 in root position | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.1/10` | Chord level 10 pool is all qualities in any voicing as mixed review | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.2/1` | The correct answer for an inverted chord is the quality alone | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.2/2` | The inversion varies the sound without changing the answer options | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordOptions.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.3/1` | A quality group is drilled in root position only when it first appears | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.3/2` | Inverted voicings of a group are introduced in a later level after root-position mastery | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.4` | Voicing is a Leitner dimension for chord qualities | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.1 | `AC-5.1.5` | Chord roots are randomized across the register | P-021 | T048 (1/1 done) | T049 (1/1 done) | `chordQualities.test.js` | 🟢 OK |
| US-5.2 | `AC-5.2.1/1` | A chord level starts in the block sub-stage with close voicing and fixed register | P-022 | T050 (1/1 done) | T051 (1/1 done) | `chordSubStages.test.js` | 🟢 OK |
| US-5.2 | `AC-5.2.1/2` | Mastering block unlocks arpeggiated | P-022 | T050 (1/1 done) | T051 (1/1 done) | `chordSubStages.test.js` | 🟢 OK |
| US-5.2 | `AC-5.2.1/3` | Mastering arpeggiated unlocks varied register and voicing spread | P-022 | T050 (1/1 done) | T051 (1/1 done) | `chordSubStages.test.js` | 🟢 OK |
| US-5.2 | `AC-5.2.2` | Each chord presentation is a separate Leitner item | P-022 | T050 (1/1 done) | T051 (1/1 done) | `chordSubStages.test.js` | 🟢 OK |
| US-5.2 | `AC-5.2.3` | The arpeggiation tempo setting applies to the next arpeggiated question | P-022 | T050 (1/1 done) | T051 (1/1 done) | `chordSubStages.test.js` | 🟢 OK |
| US-5.3 | `AC-5.3.1/1` 🖵 | The m7b5 button reads m7♭5 · half-diminished | P-023 | T052 (1/1 done) | T053 (1/1 done) | `chordGrid.spec.js` | 🟢 OK |
| US-5.3 | `AC-5.3.1/2` 🖵 | Only the chord level's pool is shown | P-023 | T052 (1/1 done) | T053 (1/1 done) | `chordGrid.spec.js` | 🟢 OK |
| US-6.1 | `AC-6.1.1` 🖵 | The Inversions track is locked until Chord Qualities level 1 is mastered | P-024 | T054 (1/1 done) | T055 (1/1 done) | `inversionsUnlock.spec.js` | 🟢 OK |
| US-6.1 | `AC-6.1.2` 🖵 | Mastering Chord Qualities level 1 unlocks the Inversions track | P-024 | T054 (1/1 done) | T055 (1/1 done) | `inversionsUnlock.spec.js` | 🟢 OK |
| US-6.2 | `AC-6.2.1/1` | Inversion level 1 pool is the major triad in root, first and second inversion | P-025 | T056 (1/1 done) | T057 (1/1 done) | `inversions.test.js` | 🟢 OK |
| US-6.2 | `AC-6.2.1/2` | Inversion level 2 pool is the minor triad in root, first and second inversion | P-025 | T056 (1/1 done) | T057 (1/1 done) | `inversions.test.js` | 🟢 OK |
| US-6.2 | `AC-6.2.1/3` | Inversion level 3 pool is mixed major and minor inversions | P-025 | T056 (1/1 done) | T057 (1/1 done) | `inversions.test.js` | 🟢 OK |
| US-6.2 | `AC-6.2.1/4` | Inversion level 4 pool is seventh chords in root through third inversion | P-025 | T056 (1/1 done) | T057 (1/1 done) | `inversions.test.js` | 🟢 OK |
| US-6.2 | `AC-6.2.2/1` | Inversion level 3 requires selecting both quality and inversion | P-025 | T056 (1/1 done) | T057 (1/1 done) | `inversionAnswer.spec.js` | 🟢 OK |
| US-6.2 | `AC-6.2.2/2` | An inversion level 3 answer is correct only if both parts are correct | P-025 | T056 (1/1 done) | T057 (1/1 done) | `inversions.test.js` | 🟢 OK |
| US-6.2 | `AC-6.2.3` | Inversion sub-stages unlock in order block, arpeggiated | P-025 | T056 (1/1 done) | T057 (1/1 done) | `inversions.test.js` | 🟢 OK |
| US-7.1 | `AC-7.1.1/1` | Melodic level 1 phrases are 3 stepwise notes starting on Do in even eighths | P-026 | T058 (1/1 done) | T059 (1/1 done) | `melodic.test.js` | 🟢 OK |
| US-7.1 | `AC-7.1.1/2` | Melodic level 2 phrases are 4 to 5 notes of steps and thirds starting on Do | P-026 | T058 (1/1 done) | T059 (1/1 done) | `melodic.test.js` | 🟢 OK |
| US-7.1 | `AC-7.1.1/3` | Melodic level 3 phrases are 8 eighth notes with diatonic leaps up to P5 | P-026 | T058 (1/1 done) | T059 (1/1 done) | `melodic.test.js` | 🟢 OK |
| US-7.1 | `AC-7.1.1/4` | Melodic level 4 phrases start on a degree other than Do | P-026 | T058 (1/1 done) | T059 (1/1 done) | `melodic.test.js` | 🟢 OK |
| US-7.1 | `AC-7.1.1/5` | Melodic level 5 phrases allow leaps larger than P5 and non-scalar contours | P-026 | T058 (1/1 done) | T059 (1/1 done) | `melodic.test.js` | 🟢 OK |
| US-7.1 | `AC-7.1.1/6` | Melodic level 6 phrases vary rhythm with quarters, eighths and simple syncopation | P-026 | T058 (1/1 done) | T059 (1/1 done) | `melodic.test.js` | 🟢 OK |
| US-7.1 | `AC-7.1.2` | A cadence and tonic reference precede every phrase | P-026 | T058 (1/1 done) | T059 (1/1 done) | `melodic.test.js` | 🟢 OK |
| US-7.2 | `AC-7.2.1` 🖵 | Tapping a degree appends to the visible answer sequence | P-027 | T060 (1/1 done) | T061 (1/1 done) | `sequenceInput.test.js` | 🟢 OK |
| US-7.2 | `AC-7.2.2/1` | Delete-last removes the final entry of the sequence | P-027 | T060 (1/1 done) | T061 (1/1 done) | `sequenceInput.test.js` | 🟢 OK |
| US-7.2 | `AC-7.2.2/2` | Clear-all empties the sequence | P-027 | T060 (1/1 done) | T061 (1/1 done) | `sequenceInput.test.js` | 🟢 OK |
| US-7.2 | `AC-7.2.2/3` | Insert-at-cursor places a new entry at the cursor position | P-027 | T060 (1/1 done) | T061 (1/1 done) | `sequenceInput.test.js` | 🟢 OK |
| US-7.2 | `AC-7.2.3/1` 🖵 | The comparison view marks each sequence position correct or incorrect | P-027 | T060 (1/1 done) | T061 (1/1 done) | `comparison.test.js` | 🟢 OK |
| US-7.2 | `AC-7.2.3/2` 🖵 | A sequence with 6 of 8 matching positions scores 6/8 | P-027 | T060 (1/1 done) | T061 (1/1 done) | `comparison.test.js` | 🟢 OK |
| US-7.3 | `AC-7.3.1` 🖵 | The replay button disables at the level's replay cap | P-028 | T062 (1/1 done) | T063 (1/1 done) | `replayCap.spec.js` | 🟢 OK |
| US-7.3 | `AC-7.3.2` | Fewer replays earn a higher score | P-028 | T062 (1/1 done) | T063 (1/1 done) | `replayScore.test.js` | 🟢 OK |
| US-7.3 | `AC-7.3.3` 🖵 | Session stats report average replays per question | P-028 | T062 (1/1 done) | T063 (1/1 done) | `replayCap.spec.js` | 🟢 OK |
| US-8.1 | `AC-8.1.1` 🖵 | The Progressions track is locked showing both prerequisites and their status | P-029 | T064 (1/1 done) | T065 (1/1 done) | `progressionsUnlock.spec.js` | 🟢 OK |
| US-8.1 | `AC-8.1.2` 🖵 | Mastering both prerequisites unlocks the Progressions track | P-029 | T064 (1/1 done) | T065 (1/1 done) | `progressionsUnlock.spec.js` | 🟢 OK |
| US-8.2 | `AC-8.2.1/1` | Progression level 1 uses only I, IV, V in root position | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.1/2` | Progression level 2 adds vi with 4-chord pop templates | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.1/3` | Progression level 3 adds ii and iii | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.1/4` | Progression level 4 uses minor-key vocabulary i, iv, v, V, VI, VII, III | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.1/5` | Progression level 5 uses diatonic seventh qualities | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.1/6` | Progression level 6 uses inversions in the bass | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.1/7` | Progression level 7 uses 8-chord phrases and borrowed chords | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.1/8` | Every generated progression is played in a randomly selected key | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.2` | Progressions are drawn only from the built-in catalog at or below the level | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.3` 🖵 | Named progressions show their name in feedback | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressionFeedback.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.4` | Each rotation of a rotation-marked family is a distinct Leitner item | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.2 | `AC-8.2.5` | A cadence establishes the key before every progression | P-030 | T066 (1/1 done) | T067 (1/1 done) | `progressions.test.js` | 🟢 OK |
| US-8.3 | `AC-8.3.1` 🖵 | The numeral row is scoped to the level vocabulary | P-031 | T068 (1/1 done) | T069 (1/1 done) | `numeralInput.spec.js` | 🟢 OK |
| US-8.3 | `AC-8.3.2/1` 🖵 | Tapping a numeral appends to the visible numeral sequence | P-031 | T068 (1/1 done) | T069 (1/1 done) | `numeralInput.spec.js` | 🟢 OK |
| US-8.3 | `AC-8.3.2/2` 🖵 | Delete-last, clear-all and insert-at-cursor edit the numeral sequence | P-031 | T068 (1/1 done) | T069 (1/1 done) | `numeralInput.spec.js` | 🟢 OK |
| US-8.3 | `AC-8.3.3/1` 🖵 | Each chord position is marked correct or incorrect | P-031 | T068 (1/1 done) | T069 (1/1 done) | `progressionComparison.test.js` | 🟢 OK |
| US-8.3 | `AC-8.3.3/2` 🖵 | A 4-chord answer with 3 correct positions scores 3/4 | P-031 | T068 (1/1 done) | T069 (1/1 done) | `progressionComparison.test.js` | 🟢 OK |
| US-8.4 | `AC-8.4.1/1` 🖵 | Step 1 asks for the bass scale degrees | P-032 | T070 (1/1 done) | T071 (1/1 done) | `bassFirst.spec.js` | 🟢 OK |
| US-8.4 | `AC-8.4.1/2` 🖵 | Step 2 asks for the full roman numerals | P-032 | T070 (1/1 done) | T071 (1/1 done) | `bassFirst.spec.js` | 🟢 OK |
| US-8.4 | `AC-8.4.1/3` 🖵 | Each bass-first step is scored separately | P-032 | T070 (1/1 done) | T071 (1/1 done) | `bassFirst.spec.js` | 🟢 OK |
| US-8.4 | `AC-8.4.2/1` 🖵 | The bass-first toggle is unavailable at progression level 1 | P-032 | T070 (1/1 done) | T071 (1/1 done) | `bassFirst.spec.js` | 🟢 OK |
| US-8.4 | `AC-8.4.2/2` 🖵 | The bass-first toggle is available from progression level 2 onward | P-032 | T070 (1/1 done) | T071 (1/1 done) | `bassFirst.spec.js` | 🟢 OK |
| US-8.5 | `AC-8.5.1/1` | A progression level starts in the identical block voicings sub-stage | P-033 | T072 (1/1 done) | T073 (1/1 done) | `progressionTextures.test.js` | 🟢 OK |
| US-8.5 | `AC-8.5.1/2` | Mastering block unlocks voice-led voicings with varied register | P-033 | T072 (1/1 done) | T073 (1/1 done) | `progressionTextures.test.js` | 🟢 OK |
| US-8.5 | `AC-8.5.1/3` | Mastering voice-led unlocks arpeggiated or strummed texture | P-033 | T072 (1/1 done) | T073 (1/1 done) | `progressionTextures.test.js` | 🟢 OK |
| US-8.5 | `AC-8.5.2` | Texture is a Leitner dimension for progressions | P-033 | T072 (1/1 done) | T073 (1/1 done) | `progressionTextures.test.js` | 🟢 OK |
| US-9.1 | `AC-9.1.1` 🖵 | Every level node displays one of four states | P-034 | T074 (1/1 done) | T075 (1/1 done) | `homeMap.spec.js` | 🟢 OK |
| US-9.1 | `AC-9.1.2/1` 🖵 | A connection is drawn from Chord Qualities L1 to Inversions | P-034 | T074 (1/1 done) | T075 (1/1 done) | `homeMap.spec.js` | 🟢 OK |
| US-9.1 | `AC-9.1.2/2` 🖵 | Connections are drawn from Chord Qualities L6 and Inversions L1 to Progressions | P-034 | T074 (1/1 done) | T075 (1/1 done) | `homeMap.spec.js` | 🟢 OK |
| US-9.1 | `AC-9.1.3/1` 🖵 | Tapping a locked node shows its unlock condition | P-034 | T074 (1/1 done) | T075 (1/1 done) | `homeMap.spec.js` | 🟢 OK |
| US-9.1 | `AC-9.1.3/2` 🖵 | Tapping an available node starts a session | P-034 | T074 (1/1 done) | T075 (1/1 done) | `homeMap.spec.js` | 🟢 OK |
| US-9.2 | `AC-9.2.1/1` | Reaching 30 questions marks today complete and increments the streak | P-035 | T076 (1/1 done) | T077 (1/1 done) | `streak.test.js` | 🟢 OK |
| US-9.2 | `AC-9.2.1/2` | Reaching 10 minutes marks today complete and increments the streak | P-035 | T076 (1/1 done) | T077 (1/1 done) | `streak.test.js` | 🟢 OK |
| US-9.2 | `AC-9.2.2` 🖵 | A dismissible stopping-point suggestion follows the goal | P-035 | T076 (1/1 done) | T077 (1/1 done) | `stoppingPoint.spec.js` | 🟢 OK |
| US-9.2 | `AC-9.2.3` 🖵 | An optional local reminder fires on the mobile build | P-035 | T076 (1/1 done) | T077 (1/1 done) | `notifications.test.js` | 🟢 OK |
| US-9.3 | `AC-9.3.1/1` | An in-session answer streak multiplies XP | P-036 | T078 (1/1 done) | T079 (1/1 done) | `xp.test.js` | 🟢 OK |
| US-9.3 | `AC-9.3.1/2` | Fewer replays used multiplies XP | P-036 | T078 (1/1 done) | T079 (1/1 done) | `xp.test.js` | 🟢 OK |
| US-9.3 | `AC-9.3.1/3` | A mixed-review question multiplies XP | P-036 | T078 (1/1 done) | T079 (1/1 done) | `xp.test.js` | 🟢 OK |
| US-9.3 | `AC-9.3.2` 🖵 | Mastering a level shows a celebration with level stats | P-036 | T078 (1/1 done) | T079 (1/1 done) | `celebration.spec.js` | 🟢 OK |
| US-9.3 | `AC-9.3.3` | XP never gates content | P-036 | T078 (1/1 done) | T079 (1/1 done) | `xp.test.js` | 🟢 OK |
| US-9.4 | `AC-9.4.1` 🖵 | Track detail shows accuracy, attempts and box for every item | P-037 | T080 (1/1 done) | T081 (1/1 done) | `stats.spec.js` | 🟢 OK |
| US-9.4 | `AC-9.4.2` 🖵 | The weakest items are listed first | P-037 | T080 (1/1 done) | T081 (1/1 done) | `stats.spec.js` | 🟢 OK |
| US-9.4 | `AC-9.4.3` 🖵 | Item detail shows the most frequent wrong answers | P-037 | T080 (1/1 done) | T081 (1/1 done) | `stats.spec.js` | 🟢 OK |
| US-9.4 | `AC-9.4.4` 🖵 | A track shows an accuracy trend after seven days of history | P-037 | T080 (1/1 done) | T081 (1/1 done) | `stats.spec.js` | 🟢 OK |
| US-10.1 | `AC-10.1.1/1` 🖵 | A phone viewport renders the single-column stacked layout | P-038 | T082 (1/1 done) | T083 (1/1 done) | `layout.spec.js` | 🟢 OK |
| US-10.1 | `AC-10.1.1/2` 🖵 | On a phone viewport all controls are visible and touch-friendly with no hover interactions | P-038 | T082 (1/1 done) | T083 (1/1 done) | `layout.spec.js` | 🟢 OK |
| US-10.1 | `AC-10.1.2` 🖵 | Tablet viewports use the wider tablet layout | P-038 | T082 (1/1 done) | T083 (1/1 done) | `layout.spec.js` | 🟢 OK |
| US-10.1 | `AC-10.1.3/1` 🖵 | A desktop viewport presents the tablet layout | P-038 | T082 (1/1 done) | T083 (1/1 done) | `layout.spec.js` | 🟢 OK |
| US-10.1 | `AC-10.1.3/2` 🖵 | No desktop-only layout or hover-dependent behavior exists | P-038 | T082 (1/1 done) | T083 (1/1 done) | `layout.spec.js` | 🟢 OK |
| US-10.1 | `AC-10.1.4/1` 🖵 | Rotation preserves in-progress session state | P-038 | T082 (1/1 done) | T083 (1/1 done) | `layout.spec.js` | 🟢 OK |
| US-10.1 | `AC-10.1.4/2` 🖵 | Rotation leaves no control clipped | P-038 | T082 (1/1 done) | T083 (1/1 done) | `layout.spec.js` | 🟢 OK |
| US-10.1 | `AC-10.1.5/1` | The production build is fully functional from a static host with no server-side components | P-038 | T082 (1/1 done) | T083 (1/1 done) | `layout.spec.js` | 🟢 OK |
| US-10.1 | `AC-10.1.5/2` | The web build has feature parity with the packaged app excluding native-only capabilities | P-038 | T082 (1/1 done) | T083 (1/1 done) | `parity.test.js` | 🟢 OK |
| US-10.2 | `AC-10.2.1/1` 🖵 | All features function identically in the Capacitor build | P-039 | T084 (1/1 done) | T085 (1/1 done) | `capacitor.test.js` | 🟢 OK |
| US-10.2 | `AC-10.2.1/2` 🖵 | The Capacitor build applies the phone and tablet layout rules by device | P-039 | T084 (1/1 done) | T085 (1/1 done) | `capacitor.test.js` | 🟢 OK |
| US-10.2 | `AC-10.2.2` | Desktop-browser verification precedes any store release | P-039 | T084 (1/1 done) | T085 (1/1 done) | `releaseGate.test.js` | 🟢 OK |
| US-10.2 | `AC-10.2.3` 🖵 | A full session works offline in the installed app | P-039 | T084 (1/1 done) | T085 (1/1 done) | `capacitor.test.js` | 🟢 OK |
| US-10.2 | `AC-10.2.4` | Native persistence uses the same schema as web storage | P-039 | T084 (1/1 done) | T085 (1/1 done) | `capacitor.test.js` | 🟢 OK |
| US-10.3 | `AC-10.3.1` | Progress changes are persisted under a versioned schema | P-040 | T086 (1/1 done) | T087 (1/1 done) | `exportImport.test.js` | 🟢 OK |
| US-10.3 | `AC-10.3.2` 🖵 | Export produces a JSON file with all progress | P-040 | T086 (1/1 done) | T087 (1/1 done) | `exportImport.spec.js` | 🟢 OK |
| US-10.3 | `AC-10.3.3/1` | Import validates the schema version | P-040 | T086 (1/1 done) | T087 (1/1 done) | `exportImport.test.js` | 🟢 OK |
| US-10.3 | `AC-10.3.3/2` | Conflicting items merge by most-recent-per-item on import | P-040 | T086 (1/1 done) | T087 (1/1 done) | `exportImport.test.js` | 🟢 OK |
| US-10.3 | `AC-10.3.3/3` | An invalid import file is rejected with a clear error | P-040 | T086 (1/1 done) | T087 (1/1 done) | `exportImport.test.js` | 🟢 OK |
| US-10.4 | `AC-10.4.1/1` 🖵 | Cadence frequency is configurable | P-041 | T088 (1/1 done) | T089 (1/1 done) | `settings.spec.js` | 🟢 OK |
| US-10.4 | `AC-10.4.1/2` 🖵 | Replay limits are configurable | P-041 | T088 (1/1 done) | T089 (1/1 done) | `settings.spec.js` | 🟢 OK |
| US-10.4 | `AC-10.4.1/3` 🖵 | Arpeggiation tempo is configurable | P-041 | T088 (1/1 done) | T089 (1/1 done) | `settings.spec.js` | 🟢 OK |
| US-10.4 | `AC-10.4.1/4` 🖵 | Register range is configurable | P-041 | T088 (1/1 done) | T089 (1/1 done) | `settings.spec.js` | 🟢 OK |
| US-10.4 | `AC-10.4.1/5` 🖵 | Label display is configurable for solfège or numbers and symbol or name | P-041 | T088 (1/1 done) | T089 (1/1 done) | `settings.spec.js` | 🟢 OK |
| US-10.4 | `AC-10.4.1/6` 🖵 | Session goal is configurable | P-041 | T088 (1/1 done) | T089 (1/1 done) | `settings.spec.js` | 🟢 OK |
| US-10.4 | `AC-10.4.1/7` 🖵 | The notification toggle is configurable on mobile | P-041 | T088 (1/1 done) | T089 (1/1 done) | `settings.spec.js` | 🟢 OK |
| US-10.4 | `AC-10.4.2` | Settings persist across a restart | P-041 | T088 (1/1 done) | T089 (1/1 done) | `settings.spec.js` | 🟢 OK |
| US-10.4 | `AC-10.4.3` 🖵 | A Credits view reachable from Settings lists every bundled asset and its licence | P-041 | T088 (1/1 done) | T089 (1/1 done) | `settings.spec.js` | 🟢 OK |

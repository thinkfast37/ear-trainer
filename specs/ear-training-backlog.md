# Ear Training App — Product Backlog

Format: user stories with Given/When/Then acceptance scenarios, organized by epic. Ordered roughly by build dependency. "Learner" = the end user.

---

## Epic 1: Audio Engine

### US-1.1 Piano playback
As a learner, I want all exercises to play back with a realistic piano sound so that what I hear resembles real music rather than synthetic tones.

**Acceptance criteria:**

```gherkin
Scenario: Notes render from bundled samples
  Given the app has loaded its bundled piano sample set (≤ 5 MB total)
  When any exercise plays a note between C2 and C6
  Then the note is rendered from the nearest sample, pitch-shifted as needed
  And no network request is made during playback

Scenario: Playback quality across the range
  Given any two adjacent chromatic pitches in the supported range
  When each is played
  Then there are no audible clicks, dropouts, or mistuning artifacts
```

### US-1.2 Mobile-safe audio initialization
As a learner on iOS or Android, I want audio to work reliably the first time I use the app so that I never hit a silent exercise.

**Acceptance criteria:**

```gherkin
Scenario: Audio unlock on first gesture
  Given the app has just loaded on iOS Safari or an iOS WebView
  And the AudioContext is suspended
  When I perform my first tap anywhere in the app
  Then the AudioContext is resumed before any exercise attempts playback

Scenario: Web Audio clock scheduling
  Given an exercise with multiple timed notes
  When it plays in the Capacitor WebView
  Then every note is scheduled via the Web Audio clock (not setTimeout/setInterval)
  And note onsets are accurate within ±10 ms of the scheduled time

Scenario: Recovery after backgrounding
  Given I background the app mid-session and the AudioContext becomes suspended
  When I return and tap any control
  Then the AudioContext resumes and the next playback works without reload
```

### US-1.3 Unified exercise renderer
As a developer, I want a single playback function that renders any exercise definition so that all tracks share one audio path.

**Acceptance criteria:**

```gherkin
Scenario Outline: Rendering all exercise shapes
  Given an exercise object of type <type>
  When the renderer plays it
  Then the audible result matches the object's notes, timing, and presentation mode

  Examples:
    | type                          |
    | single note                   |
    | interval (ascending)          |
    | interval (descending)         |
    | interval (harmonic)           |
    | chord (block)                 |
    | chord (arpeggiated)           |
    | melodic sequence              |
    | chord progression             |

Scenario: Cadence prelude
  Given a track configured with a cadence prelude
  And an exercise in the key of A major
  When the question plays
  Then a I–IV–V–I cadence in A major plays before the stimulus

Scenario: Replay uses identical rendering
  Given a question has been played with a particular voicing and register
  When I tap replay for that same question
  Then the identical voicing and register are used
```

---

## Epic 2: Learning Engine

### US-2.1 Per-item Leitner scheduling
As a learner, I want the app to quiz me more often on the items I get wrong so that my practice time targets my weaknesses.

**Acceptance criteria:**

```gherkin
Scenario: Item promotion on correct answer
  Given the item "interval:m6:desc" is in Leitner box 2
  When I answer a question on that item correctly
  Then the item moves to box 3

Scenario: Item demotion on incorrect answer
  Given the item "chord:m7b5:block" is in box 4
  When I answer a question on that item incorrectly
  Then the item moves to box 1

Scenario: Selection weighting
  Given a level whose items span boxes 1 through 5
  When the next 50 questions are generated
  Then items in lower boxes appear with measurably higher frequency than items in higher boxes

Scenario: Persistence
  Given I have answered questions and closed the app
  When I reopen the app
  Then every item's box, attempts, correct count, and last-seen timestamp are unchanged
```

### US-2.2 Mastery-gated level advancement
As a learner, I want levels to unlock only when I've genuinely mastered the current one so that the game mechanic enforces real learning.

**Acceptance criteria:**

```gherkin
Scenario: Mastery achieved
  Given my rolling accuracy over the last 20 answers in a level is ≥ 90%
  And every item in the level has reached at least box 3
  When I complete the answer that satisfies both conditions
  Then the level is marked mastered and the next level unlocks

Scenario: Mastery not achieved on accuracy alone
  Given my rolling accuracy is ≥ 90%
  But at least one item in the level is below box 3
  When I view the level screen
  Then the level is not mastered
  And the screen shows which condition is unmet

Scenario: Mastered levels stay reviewable with decay
  Given a mastered level
  When I replay it and answer an item incorrectly
  Then that item's box decreases
  And the level's mastered status is retained for unlock purposes
```

### US-2.3 Interleaved review mode
As a learner, I want a mixed review mode drawing from everything I've unlocked so that my recall survives outside blocked drills.

**Acceptance criteria:**

```gherkin
Scenario: Mixed review availability
  Given I have mastered fewer than 2 levels across all tracks
  When I view the home screen
  Then Mixed Review is locked with its unlock condition shown

Scenario: Cross-track question drawing
  Given I have mastered levels in at least two different tracks
  When I run a Mixed Review session of 30 questions
  Then questions are drawn from multiple tracks
  And selection is weighted by Leitner box
  And each feedback screen labels the question's track

Scenario: Review counts toward streaks
  Given today's session goal is not yet met
  When I complete Mixed Review questions
  Then they count toward the daily goal and streak
```

### US-2.4 Immediate feedback with comparison replay
As a learner, I want instant feedback that replays the sound with the correct answer so that I encode the correction while it's fresh.

**Acceptance criteria:**

```gherkin
Scenario: Instant verdict
  Given I have just submitted an answer
  When the app evaluates it
  Then correct/incorrect feedback is displayed within 200 ms

Scenario: Comparison replay after an error
  Given I answered "sus2" and the correct answer was "sus4"
  When I view the feedback screen
  Then I can tap to hear the correct chord and my chosen chord back-to-back
  And both are labeled on screen during playback

Scenario: Stimulus replay
  Given any feedback screen
  When I tap replay
  Then the original question stimulus plays with identical rendering
```

### US-2.5 Confusion-weighted question generation
As a learner, I want the app to bias questions toward known-confusable pairs as I improve so that I train the discriminations that matter.

**Acceptance criteria:**

```gherkin
Scenario: Pair bias activates with proficiency
  Given a level defines P4/P5 as a confusable pair
  And my rolling accuracy in the level exceeds 75%
  When I answer a P5 question incorrectly as "P4"
  Then a P4 or P5 question appears within the next 5 questions

Scenario: Pair bias inactive for beginners
  Given my rolling accuracy in the level is below 75%
  When questions are generated
  Then standard Leitner weighting applies without pair biasing

Scenario: Confusable distractors in answer options
  Given a question on an item with a defined confusable partner
  When answer buttons are displayed
  Then the confusable partner is among the options
```

---

## Epic 3: Track 1 — Intervals

### US-3.1 Interval level progression
As a learner, I want intervals introduced from most-contrasting to most-confusable so that early success builds a foundation for hard discriminations.

**Acceptance criteria:**

```gherkin
Scenario Outline: Level pools
  Given interval level <level> is active
  When questions are generated
  Then the question pool is exactly <pool>

  Examples:
    | level | pool                                              |
    | 1     | P8, P5                                            |
    | 2     | P8, P5, M3, m3                                    |
    | 3     | P8, P5, M3, m3, P4                                |
    | 4     | P8, P5, M3, m3, P4, M2, m2                        |
    | 5     | P8, P5, M3, m3, P4, M2, m2, M6, m6                |
    | 6     | all 12 simple intervals (adds M7, m7, TT)         |
    | 7     | all 12 simple intervals, mixed review             |
    | 8     | + m9, M9 (compound 2nds)                          |
    | 9     | + m10, M10 (compound 3rds)                        |
    | 10    | + P11, P12                                        |
    | 11    | + m13, M13                                        |
    | 12    | all simple + compound intervals, mixed review     |

Scenario: Pools are cumulative
  Given any interval level above 1 is active
  When 50 questions are generated
  Then intervals introduced in all previous levels also appear in the question stream
  And selection among them is weighted by each item's Leitner box (per US-2.1)

Scenario: Compound intervals train against their simple equivalents
  Given a compound-interval level (8 and above) is active
  When answer buttons are displayed for a compound interval question
  Then the corresponding simple interval is included among the options (e.g., M2 as a distractor for M9)
```

### US-3.2 Interval presentation sub-stages
As a learner, I want each level to progress through ascending, descending, and harmonic presentations so that I master each interval in every form.

**Acceptance criteria:**

```gherkin
Scenario: Sub-stage order and gating
  Given I am in the ascending sub-stage of interval level 2
  When the ascending sub-stage reaches its mastery threshold
  Then the descending sub-stage unlocks
  And the harmonic sub-stage remains locked until descending is mastered

Scenario: Presentation forms are separate Leitner items
  Given the interval m6
  When I answer m6-ascending correctly and m6-descending incorrectly
  Then only the "m6:asc" item is promoted and only "m6:desc" is demoted

Scenario: Randomized root notes
  Given any interval question
  When 20 consecutive questions play
  Then root notes vary across the configured register range
  And no fixed reference pitch is reused in a detectable pattern
```

### US-3.3 Interval answer input
As a learner, I want to answer by tapping interval buttons so that answering is fast on a phone.

**Acceptance criteria:**

```gherkin
Scenario: Scoped answer grid
  Given interval level 3 is active
  When the answer UI renders
  Then only P8, P5, M3, m3, P4 buttons are shown
  And each touch target is at least 44 px

Scenario: Label display setting
  Given the label setting is "full names"
  When the answer grid renders
  Then buttons show "minor 3rd" style labels instead of "m3"
```

### US-3.4 Anchor-song reference
As a learner, I want each interval linked to well-known songs that open with it so that I build memorable real-music anchors for every interval.

**Acceptance criteria:**

```gherkin
Scenario: Anchor songs on the feedback screen
  Given I have just answered an interval question (correctly or incorrectly)
  When the feedback screen displays
  Then it shows up to 5 anchor songs for the correct interval from Appendix B
  And each entry shows the song title and the lyric/motif cue where the interval occurs

Scenario: Direction-aware anchors
  Given the question was a descending interval
  When anchor songs display
  Then descending anchors are listed first, marked with their direction

Scenario: Browsable reference
  Given any interval level screen
  When I open the reference view
  Then I can browse all intervals in the level with their anchor songs without starting a session

Scenario: Compound intervals reference their simple equivalent
  Given feedback for a compound interval (level 8+)
  When anchor content displays
  Then it shows the "octave + simple interval" decomposition and the simple interval's anchors
  And any known compound-specific examples from Appendix B

Scenario: Static data-driven reference
  Given the anchor song data
  When the app is built
  Then the reference ships as static JSON bundled with the app (no network dependency)
```

---

## Epic 4: Track 2 — Scale Degrees

### US-4.1 Tonal context establishment
As a learner, I want scale-degree questions preceded by a cadence so that I identify function within a key, not absolute pitches.

**Acceptance criteria:**

```gherkin
Scenario: Cadence before questions
  Given the cadence frequency setting is "every question"
  When a scale-degree question begins in the key of E♭ major
  Then a I–IV–V–I cadence in E♭ major plays before the target note

Scenario: Key rotation
  Given a session of 24 scale-degree questions
  When the session completes
  Then multiple different keys were used, selected from all 12

Scenario: Re-hear cadence without penalty
  Given an active scale-degree question
  When I tap "re-hear cadence"
  Then the cadence replays
  And my replay count and score are unaffected
```

### US-4.2 Scale degree level progression
As a learner, I want degrees introduced by stability and frequency so that I anchor on the tonal pillars first.

**Acceptance criteria:**

```gherkin
Scenario Outline: Level pools
  Given scale-degree level <level> is active
  When questions are generated
  Then the pool is <pool>

  Examples:
    | level | pool                                          |
    | 1     | Do, Mi, Sol (major keys)                      |
    | 2     | + Re, La                                      |
    | 3     | + Fa, Ti (all diatonic, major)                |
    | 4     | all diatonic degrees, minor keys, minor cadence |
    | 5     | + chromatic degrees (movable-do chromatic syllables) |

Scenario: Prevalence weighting before proficiency
  Given level 3 and rolling accuracy below 75%
  When 50 questions are generated
  Then Do, Sol, and Mi appear more frequently than Fa and Ti

Scenario: Tendency-tone weighting after proficiency
  Given level 3 and rolling accuracy at or above 75%
  When 50 questions are generated
  Then Fa and Ti (and other confusables) appear with increased frequency
```

### US-4.3 Degree answer input
As a learner, I want a solfège/degree button row so that I'm always thinking functionally.

**Acceptance criteria:**

```gherkin
Scenario: Configurable labels
  Given the display setting is "both"
  When the answer row renders
  Then each button shows syllable and number (e.g., "Do · 1")

Scenario: Scoped pool
  Given scale-degree level 1
  When the answer row renders
  Then only Do, Mi, Sol are shown
```

---

## Epic 5: Track 3 — Chord Qualities

### US-5.1 Chord quality level progression
As a learner, I want qualities introduced from most-contrasting to most-confusable so that I build discrimination progressively.

**Acceptance criteria:**

```gherkin
Scenario Outline: Level pools
  Given chord-quality level <level> is active
  When questions are generated
  Then the pool and voicing rules are <pool_and_voicing>

  Examples:
    | level | pool_and_voicing                                            |
    | 1     | maj, min — root position only                               |
    | 2     | + dim — root position only                                  |
    | 3     | + aug — root position only                                  |
    | 4     | maj, min — root, 1st, and 2nd inversions                    |
    | 5     | all triads (maj, min, dim, aug) — any inversion             |
    | 6     | dom7, maj7, m7 — root position only                         |
    | 7     | + m7♭5, dim7 — root position only                           |
    | 8     | all 7th chords — any inversion (root through 3rd)           |
    | 9     | + sus2, sus4 — root position                                |
    | 10    | all qualities, any voicing — mixed review                   |

Scenario: Answer is quality regardless of voicing
  Given a level that includes inverted voicings
  When a chord plays in any inversion
  Then the correct answer is the chord quality alone
  And the inversion serves only to vary the sound, not the answer

Scenario: Inversion introduction follows root-position mastery
  Given the level progression above
  When a quality group first appears (triads at level 1, 7ths at level 6)
  Then it is drilled in root position only
  And inverted voicings of that group are introduced in a later level after root-position mastery

Scenario: Voicing is a Leitner dimension
  Given the quality "min" drilled in both root position and inversions
  When I answer min-root correctly and min-inverted incorrectly
  Then only the root-position item is promoted and only the inverted item is demoted

Scenario: Random roots and keys
  Given any chord-quality question
  When 20 consecutive questions play
  Then chord roots vary across the register range with no fixed-pitch pattern
```

### US-5.2 Chord presentation sub-stages
As a learner, I want each level to progress from block to arpeggiated to varied voicings so that I can't rely on one fixed sound.

**Acceptance criteria:**

```gherkin
Scenario: Sub-stage order
  Given a chord-quality level
  When I progress through it
  Then sub-stages unlock in the order: block (close voicing, fixed register) → arpeggiated → varied register/voicing spread

Scenario: Separate Leitner items per presentation
  Given the quality maj7
  When I answer maj7-block correctly and maj7-arpeggiated incorrectly
  Then only "maj7:block" is promoted and only "maj7:arp" is demoted

Scenario: Configurable arpeggiation tempo
  Given I change the arpeggiation tempo setting
  When the next arpeggiated question plays
  Then the broken-chord playback uses the new tempo
```

### US-5.3 Chord quality answer input
As a learner, I want quality buttons labeled with standard chord symbols so that answers map to how I read charts.

**Acceptance criteria:**

```gherkin
Scenario: Symbol plus name labels
  Given chord-quality level 5
  When the answer grid renders
  Then the m7♭5 button reads "m7♭5 · half-diminished"
  And only the level's pool is shown
```

---

## Epic 6: Track 4 — Inversions

Role: this track trains identifying *which* inversion is sounding. It complements the Chord Qualities track, where inverted voicings appear from level 4 onward but the answer is always the quality alone.

### US-6.1 Inversion track unlock
As a learner, I want the inversion track to unlock after basic chord qualities so that I have the prerequisite skill.

**Acceptance criteria:**

```gherkin
Scenario: Locked state
  Given Chord Qualities level 1 (maj, min in root position) is not yet mastered
  When I view the Inversions track on the home map
  Then it is locked and displays "Master Chord Qualities Level 1 to unlock"

Scenario: Unlock trigger
  Given I have just mastered Chord Qualities level 1
  When I return to the home map
  Then the Inversions track is available
```

### US-6.2 Inversion level progression
As a learner, I want to learn inversions on familiar chord types first so that I isolate the inversion variable.

**Acceptance criteria:**

```gherkin
Scenario Outline: Level pools
  Given inversion level <level> is active
  When questions are generated
  Then the pool is <pool>

  Examples:
    | level | pool                                            |
    | 1     | major triad: root, 1st, 2nd inversion           |
    | 2     | minor triad: root, 1st, 2nd inversion           |
    | 3     | mixed maj + min inversions (answer = quality + inversion) |
    | 4     | 7th chords: root, 1st, 2nd, 3rd inversion       |

Scenario: Combined answer at level 3
  Given inversion level 3
  When I answer a question
  Then I must select both the quality (maj/min) and the inversion
  And the answer is correct only if both parts are correct

Scenario: Block and arpeggiated sub-stages
  Given any inversion level
  When I progress through it
  Then sub-stages unlock in the order: block → arpeggiated
```

---

## Epic 7: Track 5 — Melodic Phrases

### US-7.1 Melodic dictation levels
As a learner, I want phrases that scale in length, contour, and interval content so that dictation difficulty rises smoothly.

**Acceptance criteria:**

```gherkin
Scenario Outline: Level generation constraints
  Given melodic level <level> is active
  When a phrase is generated
  Then it satisfies <constraints>

  Examples:
    | level | constraints                                              |
    | 1     | 3 notes, stepwise motion only, starts on Do, even eighths |
    | 2     | 4–5 notes, stepwise + 3rds, starts on Do                  |
    | 3     | 8 notes (one bar of eighths), diatonic leaps up to P5     |
    | 4     | starts on a degree other than Do                          |
    | 5     | leaps larger than P5 and non-scalar contours allowed      |
    | 6     | rhythm varies (quarters + eighths, then simple syncopation) |

Scenario: Tonal context before every phrase
  Given any melodic phrase question
  When it begins
  Then a cadence and a tonic reference note play before the phrase
```

### US-7.2 Sequence answer input
As a learner, I want to tap my answer on a scale-degree row so that I transcribe functionally rather than hunting on a keyboard.

**Acceptance criteria:**

```gherkin
Scenario: Building a sequence
  Given an active melodic question of 8 notes
  When I tap degrees on the answer row
  Then each tap appends to a visible answer sequence

Scenario: Editing the sequence
  Given a partially entered sequence
  When I use delete-last, clear-all, or insert-at-cursor
  Then the sequence updates accordingly before submission

Scenario: Note-by-note comparison with partial credit
  Given I submit a sequence where 6 of 8 positions match the answer
  Then the comparison view marks each position correct or incorrect
  And my score for the question is 6/8
```

### US-7.3 Limited replays with replay scoring
As a learner, I want a capped number of listens so that I train retention instead of replay dependence.

**Acceptance criteria:**

```gherkin
Scenario: Replay cap
  Given the level's replay limit is 3
  When I have used 3 replays
  Then the replay button is disabled for that question

Scenario: Replay bonus
  Given two identical questions answered fully correctly
  When one used 1 replay and the other used 3
  Then the 1-replay answer receives a higher score

Scenario: Replay count in stats
  Given a completed session
  When I view session stats
  Then average replays per question is reported
```

---

## Epic 8: Track 6 — Chord Progressions

### US-8.1 Progression track unlock
As a learner, I want the progression track gated on chord qualities and inversions so that I arrive prepared.

**Acceptance criteria:**

```gherkin
Scenario: Locked until prerequisites met
  Given Chord Qualities level 6 (7th chord qualities) is mastered but Inversions level 1 is not
  When I view the Progressions track
  Then it is locked and displays both prerequisites with their current status

Scenario: Unlock
  Given Chord Qualities level 6 and Inversions level 1 are both mastered
  When I return to the home map
  Then the Progressions track is available
```

### US-8.2 Progression level design
As a learner, I want progressions that grow in vocabulary and realism so that I end up hearing real songs.

**Acceptance criteria:**

```gherkin
Scenario Outline: Level vocabulary
  Given progression level <level> is active
  When a progression is generated from the level's catalog templates (see Appendix A)
  Then it uses only <vocabulary> and is played in a randomly selected key

  Examples:
    | level | vocabulary                                         |
    | 1     | I, IV, V (3-chord progressions, root position)     |
    | 2     | + vi (4-chord pop templates, e.g., I–V–vi–IV)      |
    | 3     | + ii, iii                                          |
    | 4     | minor keys: i, iv, v, V, VI, VII, III              |
    | 5     | diatonic 7th qualities (ii7, V7, Imaj7, …)          |
    | 6     | inversions in the bass (e.g., I, V⁶)               |
    | 7     | 8-chord phrases + borrowed chords (♭VII, ♭VI, III, iv in major) |

Scenario: Progressions are drawn from the built-in catalog
  Given any progression level
  When questions are generated
  Then every progression is an entry (or a rotation of an entry) from the catalog in Appendix A assigned to that level or a lower level

Scenario: Named progressions are surfaced in feedback
  Given a catalog progression with a common name (e.g., Axis, 50s, Andalusian)
  When the feedback screen shows the answer
  Then the progression's name is displayed alongside the roman numerals

Scenario: Rotations count as distinct items
  Given the Axis progression family
  When Leitner items are created
  Then each rotation (I–V–vi–IV, vi–IV–I–V, IV–I–V–vi, V–vi–IV–I) is a separate item

Scenario: Cadence prelude
  Given any progression question
  When it begins
  Then a cadence establishes the key before the progression plays
```

### US-8.3 Roman numeral answer input
As a learner, I want to tap roman numeral buttons in sequence so that answering matches how I analyze songs.

**Acceptance criteria:**

```gherkin
Scenario: Scoped numeral row
  Given progression level 2
  When the answer UI renders
  Then only I, IV, V, vi buttons are shown

Scenario: Sequence entry and editing
  Given an active progression question
  When I build and edit my numeral sequence
  Then entry and editing behave identically to melodic sequence input (US-7.2)

Scenario: Chord-by-chord partial credit
  Given I submit a 4-chord answer with 3 correct positions
  Then each position is marked and the question scores 3/4
```

### US-8.4 Bass-first sub-mode
As a learner, I want to identify the bass line first, then the qualities so that my method matches how musicians transcribe.

**Acceptance criteria:**

```gherkin
Scenario: Two-step answering
  Given bass-first mode is enabled on a progression question
  When the question begins
  Then step 1 asks for the bass scale degrees
  And step 2 asks for the full roman numerals
  And each step is scored separately

Scenario: Availability
  Given progression level 1
  When I look for the bass-first toggle
  Then it is unavailable
  And it becomes available from level 2 onward
```

### US-8.5 Voicing realism sub-stages
As a learner, I want later progression levels to vary voicing and texture so that I can't lean on fixed-voicing cues.

**Acceptance criteria:**

```gherkin
Scenario: Texture sub-stage order
  Given any progression level
  When I progress through it
  Then sub-stages unlock in the order: identical block voicings → voice-led voicings with varied register → arpeggiated/strummed texture

Scenario: Texture as a Leitner dimension
  Given the template "I–V–vi–IV"
  When I answer it correctly as blocks but incorrectly as arpeggiated
  Then only the block-texture item is promoted and only the arpeggiated item is demoted
```

---

## Epic 9: Gamification & Stats

### US-9.1 Unlock map
As a learner, I want a visual map of tracks and levels so that progression feels like a game world.

**Acceptance criteria:**

```gherkin
Scenario: Node states
  Given my current progress
  When I view the home map
  Then every level node displays one of: locked, available, in-progress, mastered

Scenario: Cross-track dependency lines
  Given the home map
  When it renders
  Then connections are drawn from Chord Qualities L1 to Inversions and from Chord Qualities L6 + Inversions L1 to Progressions

Scenario: Node interaction
  Given a locked node
  When I tap it
  Then its unlock condition is shown
  Given an available node
  When I tap it
  Then a session starts
```

### US-9.2 Daily streak and session goal
As a learner, I want a streak tied to a short daily session so that the app encourages spaced daily practice.

**Acceptance criteria:**

```gherkin
Scenario: Day counts toward streak
  Given the daily goal is 10 minutes or 30 questions (whichever comes first)
  When I reach either threshold today
  Then today is marked complete and the streak increments

Scenario: Stopping-point suggestion
  Given I have just met the daily goal mid-session
  When the current question completes
  Then a dismissible message suggests this is a good stopping point

Scenario: Optional reminder (mobile)
  Given notifications are enabled in settings on the Capacitor build
  When my usual practice window passes without a session
  Then a local notification reminder fires
```

### US-9.3 XP and level-up feedback
As a learner, I want points and celebratory feedback so that sessions feel rewarding.

**Acceptance criteria:**

```gherkin
Scenario: XP multipliers
  Given a correct answer
  When XP is awarded
  Then multipliers apply for in-session answer streaks, fewer replays used, and mixed-review questions

Scenario: Mastery celebration
  Given I have just mastered a level
  When the mastery condition is met
  Then a celebration screen shows level stats (accuracy, time, weakest item conquered)

Scenario: XP never gates content
  Given any XP total
  When level unlock conditions are evaluated
  Then only mastery conditions are consulted
```

### US-9.4 Weakness dashboard
As a learner, I want per-item stats so that I can see exactly which sounds I confuse.

**Acceptance criteria:**

```gherkin
Scenario: Item-level stats
  Given the stats screen
  When I open a track's detail
  Then every item shows accuracy, attempts, and current Leitner box

Scenario: Weakest items summary
  Given items with at least 5 attempts
  When the stats screen loads
  Then the lowest-accuracy items are listed at the top

Scenario: Confusion detail
  Given the item "interval:P4:asc"
  When I open its detail view
  Then I see which wrong answers I most frequently chose for it

Scenario: Trend view
  Given at least 7 days of practice history
  When I view a track's stats
  Then an accuracy trend over time is displayed
```

---

## Epic 10: Platform & Persistence

Platform strategy: built as a web app first, packaged for app stores with Capacitor. Primary usage is on phones and tablets; the web version remains permanently functional as the testing surface. Desktop renders the tablet experience. Release path: manual testing on desktop → build, test, and release on app stores.

### US-10.1 Form-factor–adaptive layout (mobile-first web app)
As a learner on a phone or tablet, I want the layout tailored to my device's form factor so that the app feels native to whatever screen I'm practicing on.

**Acceptance criteria:**

```gherkin
Scenario: Phone layout
  Given a viewport in the phone range (approx. 360–599 px wide)
  When any screen renders
  Then the phone layout is used (single-column, stacked controls)
  And all controls are visible, touch-friendly, and require no hover interactions

Scenario: Tablet layout
  Given a viewport in the tablet range (approx. 600 px and up)
  When any screen renders
  Then the tablet layout is used (wider grids, side-by-side panels where appropriate)

Scenario: Desktop uses the tablet experience
  Given a desktop browser viewport
  When any screen renders
  Then the tablet layout is presented
  And no desktop-only layout or hover-dependent behavior exists

Scenario: Orientation handling on mobile devices
  Given a phone or tablet
  When the device rotates between portrait and landscape
  Then the layout reflows without loss of state or clipped controls

Scenario: Web version always functional for testing
  Given any production build
  When it is deployed to a static host (e.g., GitHub Pages)
  Then the full app is functional in the browser with no server-side components
  And feature parity with the packaged app is maintained (excluding native-only capabilities such as local notifications)
```

### US-10.2 Capacitor mobile build
As a learner, I want a native mobile build so that practice is one tap away with reliable audio.

**Acceptance criteria:**

```gherkin
Scenario: Single codebase wrap
  Given the web codebase
  When it is built with Capacitor for iOS and Android
  Then all features function identically to the web version
  And the phone/tablet layout rules from US-10.1 apply based on the device

Scenario: Desktop-first testing precedes store release
  Given a feature has been implemented
  When it is verified by manual testing in a desktop browser (tablet experience)
  Then and only then is it promoted to Capacitor build, device testing, and app store release

Scenario: Offline operation
  Given the installed mobile app with airplane mode enabled
  When I complete a full session
  Then all audio, exercises, and progress tracking work with no network

Scenario: Native persistence parity
  Given progress created on the mobile build
  When it is stored via Capacitor Preferences
  Then the schema is identical to web localStorage
```

### US-10.3 Progress persistence and export
As a learner, I want my progress saved automatically and exportable so that I never lose my history.

**Acceptance criteria:**

```gherkin
Scenario: Automatic persistence with schema version
  Given any change to progress state
  When it occurs
  Then it is persisted locally under a versioned schema

Scenario: Export
  Given my current progress
  When I tap export
  Then a JSON file containing all progress (Leitner state, mastery, streaks, XP, stats) is produced

Scenario: Import with merge
  Given an export file from another device
  When I import it
  Then the schema version is validated
  And conflicting items merge by most-recent-per-item
  And an invalid file is rejected with a clear error
```

### US-10.4 Settings
As a learner, I want core preferences configurable so that the app fits my practice.

**Acceptance criteria:**

```gherkin
Scenario: Configurable options exist
  Given the settings screen
  When it renders
  Then I can configure: cadence frequency, replay limits, arpeggiation tempo, register range, label display (solfège/numbers, symbol/name), session goal, and notification toggle (mobile)

Scenario: Settings persist
  Given I change any setting and restart the app
  When I return to settings
  Then my changes are retained
```

---

## Deferred (v2)

### US-V2.1 Sing-back mode with mic pitch detection
As a learner, I want to sing the answer before identifying it so that production reinforces recognition.

**Acceptance criteria (draft):**

```gherkin
Scenario: Pitch capture
  Given mic permission is granted
  When I sing a sustained note during the sing-back step
  Then the app registers my pitch after ~300 ms of stability
  And displays my deviation from the target in cents

Scenario: Insertion into tracks
  Given sing-back mode is enabled
  When an Interval or Scale Degree question begins
  Then a sing step precedes the identification answer

Scenario: Mobile permission flow
  Given the Capacitor build without mic permission
  When sing-back mode is first enabled
  Then the native permission prompt is shown and denial falls back gracefully to identification-only
```

### US-V2.2 Honor-system sing-first prompt
As a learner, I want an optional "sing it first" prompt with no mic so that I can practice production before pitch detection ships.

**Acceptance criteria (draft):**

```gherkin
Scenario: Optional prompt
  Given the per-track "sing first" toggle is on
  When a question begins
  Then a "Sing it, then tap to reveal" step precedes the answer UI
  And it has no effect on scoring
```

---

## Appendix A: Built-in Progression Catalog

Sources: the common-progression canon covered by David Bennett Piano's progression videos, Hooktheory's TheoryTab popularity data, and standard references. Each entry is a template; the engine transposes to random keys and, where marked, generates rotations. Names are shown in feedback (US-8.2).

### Level 1 — I, IV, V

| # | Progression | Name / notes |
|---|-------------|--------------|
| 1 | I–IV–V–I | Basic full cadence |
| 2 | I–IV–I–V | Alternating tonic |
| 3 | I–V–IV–V | Three-chord rock vamp |
| 4 | I–IV (2-chord vamp) | Plagal vamp |
| 5 | I–V (2-chord vamp) | Tonic–dominant vamp |
| 6 | 12-bar blues: I–I–I–I–IV–IV–I–I–V–IV–I–I(V) | 12-bar blues |
| 7 | 8-bar blues: I–V–IV–IV–I–V–I–V | 8-bar blues |

### Level 2 — + vi

| # | Progression | Name / notes |
|---|-------------|--------------|
| 8 | I–V–vi–IV | Axis (the "4 chords" progression) — all 4 rotations generated |
| 9 | vi–IV–I–V | Axis rotation ("sensitive" ordering) |
| 10 | I–vi–IV–V | 50s / doo-wop |
| 11 | I–IV–vi–V | Pop variant |
| 12 | I–IV–vi–IV | Alternating plagal color |
| 13 | vi–V–IV–V | Descending-then-hover |
| 14 | vi–IV (2-chord vamp) | Minor-color vamp |

### Level 3 — + ii, iii

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

### Level 4 — Minor keys

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

### Level 5 — Diatonic 7ths

| # | Progression | Name / notes |
|---|-------------|--------------|
| 34 | ii7–V7–Imaj7 | Jazz ii–V–I |
| 35 | Imaj7–vi7–ii7–V7 | Jazz turnaround |
| 36 | iii7–vi7–ii7–V7 | Extended turnaround |
| 37 | I7–IV7–I7–V7–IV7–I7 | Blues with dominant 7ths |
| 38 | Imaj7–IVmaj7 vamp | Neo-soul/lo-fi vamp |
| 39 | ii7–V7–iii7–vi7 | Royal Road with 7ths |

### Level 6 — Inversions in the bass

| # | Progression | Name / notes |
|---|-------------|--------------|
| 40 | I–V⁶–vi–I⁶–IV–I⁶⁴–V | Descending/stepwise bass line (Bennett's "descending stepwise" family) |
| 41 | I–I⁶–IV–V | First-inversion approach |
| 42 | I–V⁶⁴–I⁶–IV | Passing 6-4 |
| 43 | i–i(maj7)/♯7 bass–i7/♭7 bass–i6/6 bass | Line cliché (descending chromatic inner/bass line) |
| 44 | IV–I⁶–ii | Stepwise bass ascent fragment |

### Level 7 — Borrowed chords & 8-chord phrases

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
- Rotations of rotation-marked families (Axis, 50s) are generated automatically and tracked as separate Leitner items
- Every entry is stored with: numerals, level, name, rotation flag, and texture variants (per US-8.5)
- The catalog is data-driven (JSON), so new progressions can be added without code changes
- Target: the catalog ships with the ~50 entries above; entries can be flagged inactive per level for tuning difficulty

---

## Appendix B: Interval Anchor-Song Reference

Static reference data for US-3.4. Direction is ascending unless marked (desc). Ships as bundled JSON.

### Simple intervals

**Minor 2nd (m2)**
1. *Jaws* theme — the two-note motif
2. *Für Elise* — opening E–D♯ (desc)
3. *White Christmas* — "I'm drea-ming…"
4. *The Pink Panther* theme — opening chromatic slide
5. *Isn't She Lovely* — "Isn't she…"

**Major 2nd (M2)**
1. *Happy Birthday* — "Happy birth-…"
2. *Frère Jacques* — opening
3. *Silent Night* — "Si-lent…" (desc)
4. *Mary Had a Little Lamb* — opening (desc, then asc)
5. *Do-Re-Mi* (The Sound of Music) — "Doe, a deer"

**Minor 3rd (m3)**
1. *Greensleeves* — "A-las…"
2. *Smoke on the Water* — riff's first interval (as commonly sung)
3. *Brahms' Lullaby* — "Lul-la-by…"
4. *Georgia on My Mind* — "Geor-gia…"
5. *Hey Jude* — "Hey Jude" (desc)

**Major 3rd (M3)**
1. *Oh, When the Saints Go Marching In* — "Oh when…"
2. *Kumbaya* — "Kum-ba…"
3. *Morning Has Broken* — opening
4. *Blue Danube Waltz* — opening arpeggio
5. *Swing Low, Sweet Chariot* — "Swing low…" (desc)

**Perfect 4th (P4)**
1. *Here Comes the Bride* — "Here comes…"
2. *Amazing Grace* — "A-maz-…"
3. *We Wish You a Merry Christmas* — "We wish…"
4. *Hedwig's Theme* (Harry Potter) — after the pickup note
5. *Auld Lang Syne* — "Should auld…"

**Tritone (TT)**
1. *The Simpsons* theme — "The Simp-sons"
2. *Maria* (West Side Story) — "Ma-ri-a"
3. *Purple Haze* — opening riff
4. *Danse Macabre* — the violin's "devil's interval"
5. *YYZ* (Rush) — opening motif

**Perfect 5th (P5)**
1. *Twinkle, Twinkle, Little Star* — "Twin-kle twin-kle"
2. *Star Wars* main theme — after the pickup
3. *Also Sprach Zarathustra* (2001) — second interval of the opening
4. *Scarborough Fair* — "Are you…"
5. *Flintstones* theme — "Flint-stones" (desc)

**Minor 6th (m6)**
1. *Where Do I Begin* (Love Story theme) — opening
2. *Manhã de Carnaval* (Black Orpheus) — opening
3. *In My Life* (The Beatles) — opening guitar (desc)
4. *The Morning After* — opening
5. *Go Down Moses* — "When Is-rael…" (desc)

**Major 6th (M6)**
1. NBC chimes — first two notes
2. *My Bonnie Lies Over the Ocean* — "My Bon-nie"
3. *Jingle Bells* — "Dash-ing through the snow"
4. *It Came Upon a Midnight Clear* — opening
5. *Take the "A" Train* — opening

**Minor 7th (m7)**
1. *Somewhere* (West Side Story) — "There's a place for us"
2. *Star Trek* (original series theme) — opening leap
3. *Watermelon Man* — opening horn line
4. *An American in Paris* — main theme leap
5. *The Winner Takes It All* — "The win-ner…" (desc)

**Major 7th (M7)**
1. *Take On Me* — the big chorus leap
2. *Don't Know Why* (Norah Jones) — opening (desc)
3. *Cast Your Fate to the Wind* — opening
4. *I Love You* (Cole Porter) — "I love you" (desc)
5. *Superman* theme — the leap in the main fanfare

**Octave (P8)**
1. *Somewhere Over the Rainbow* — "Some-where"
2. *Starman* (David Bowie) — "Star-man" in the chorus
3. *Singin' in the Rain* — "I'm sing-in'"
4. *The Christmas Song* — "Chest-nuts roast-ing"
5. *My Sharona* — the octave riff

### Compound intervals (levels 8–12)

Melodic leaps beyond the octave are genuinely rare in popular melody, so the reference presents compounds as **octave + simple interval** (which matches how the ear processes them) plus the known real-world examples:

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
- Each entry stores: interval id, direction, title, cue text, and an optional "plays the motif" flag for entries where the app can render the two-note motif on piano
- Compound entries additionally store the simple-equivalent id for the decomposition display (US-3.4)

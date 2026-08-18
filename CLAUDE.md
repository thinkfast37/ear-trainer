# Ear Trainer — working agreement

Ear Trainer is a mobile-first, offline ear-training web app (plain ES-module JS + Vite,
Web Audio with bundled Salamander piano samples, Vitest + Playwright, Capacitor for iOS and
Android): six tracks — intervals, scale degrees, chord qualities, inversions, melodic
phrases, chord progressions — driven by per-item Leitner scheduling and mastery-gated
unlocks. The maintainer is Steve Sanyal; they describe what they want in their own words,
and you pick the right workflow for it from §2. **Ask before overriding anything they have
set** — spec text, D-00x decisions, gate configuration, the plan — even when §2 would allow
an amend-and-proceed. The spec-kit workflow runs through the `/speckit-*` skills, never
hand-authored substitutes.

Read this before starting any change.

---

## 1. The blast-radius rule (the important one)

**Before implementing anything, work out what it touches beyond the literal
request.** Ask, in order:

1. Which Acceptance Criteria would have to change?
2. Which *other* User Stories' behaviour changes as a side effect?
3. Does it contradict a research decision (`research.md`, D-00x)?
4. Does it contradict a Constitution principle?

Then:

| Blast radius | What to do |
|---|---|
| Confined to what was asked | **Announce the type in one line and proceed.** |
| Reaches behaviour that was not asked about | **Stop. Present what else changes, and get approval for the spill before writing code.** |

The reason this rule exists: a request that sounds like a small tweak can reverse
an entire User Story, delete infrastructure, or retire a standing Constitution
exception. That must be surfaced *before* the work, not reported after it.

Classify by what a change **contradicts**, never by how big it feels. A one-line
edit can be a governance change; a thousand-line refactor can be a bug fix.

---

## 2. Choosing the workflow

| The change… | Type | Required path |
|---|---|---|
| Code doesn't do what an AC already says | **Bug** | Write the failing test first → fix → verify. No spec edit. |
| A test fails | **See §2a** | Fix the *code*. Changing the test is a separate, named decision. |
| An AC is wrong, impossible, or ambiguous | **Spec defect** | Revise the AC **first**, with a dated parenthetical saying what changed and why → then fix. |
| Nothing in the spec covers it | **New capability** | `/speckit-specify` → `/speckit-tasks` → `/speckit-implement`. Add `/speckit-plan` only when technical assumptions change. |
| Contradicts a research decision | **Approach change** | Amend the D-00x entry in `research.md` with the reversal and its reasoning → then whatever the row above implies. |
| Contradicts a Constitution principle | **Governance** | `/speckit-constitution` amendment with a version bump → then the rest. |
| Only seed data, tags, or content | **Data** | No spec pass. Edit the file, validate, test. |

**Spec before code, never after.** If an AC has to change, change it in the same
change *before* the implementation, so the intent can be objected to rather than
the finished work. Backfilling ACs to match what was already built keeps the spec
truthful but defeats the point of having one.

---

## 2a. When a test fails, the code is wrong

This is a Constitution non-negotiable, not a preference.

**A failing test is evidence about the code.** The default conclusion is that the
implementation is wrong, and the implementation is what changes. Work the failure
until the code satisfies the test as written.

A test may be changed **only** when the test itself is the defect — it asserted
something the AC never said, or encoded an assumption the AC contradicts. When
that is genuinely the case:

1. Say so explicitly, naming the AC that settles it.
2. Log it in the task and cite it in the commit.
3. Fix the test to match the AC — not to match the code.

If the *AC* is what's wrong, that is a **spec defect**: revise the AC first, in the
same change, before touching the test (§2).

**Never** relax an assertion, narrow a case, delete a test, or mark it skipped in
order to turn a build green. The cheapest way to make a red suite green is to lower
what it asks, and that converts a caught defect into a shipped one. If you cannot
make a test pass, say so and stop — a reported failure is worth more than a
green build that means nothing.

---

## 2b. Traceability: what stops a requirement being half-built

`npm run check:trace` enforces the chain below. It exists because a green
per-AC coverage check can hide an entire unbuilt User Story: an AC ID present in
a test name proves nothing about whether the test has anything to do with it.

```text
AC  →  Case (if the AC asserts more than one thing)
    →  plan item (P-0xx, plan.md's Traceability Matrix)
    →  implementation task  +  test task  (tasks.md)
    →  a test named for the criterion, verbatim
```

Nine checks, each failing on its own:

| | Rule |
|---|---|
| **T1** | Every AC traces to a numbered plan item in `plan.md`. |
| **T2** | Every plan item carrying ACs has an implementation task **and** a test task. |
| **T3** | Every file path a *completed* task names exists. (Open tasks may name files that are the work.) |
| **T4** | An AC asserting more than one thing declares numbered **Cases**. |
| **T5** | Every criterion has a test whose **name is its title, verbatim**. |
| **T6** | A UI-level criterion has a test that can reach the DOM (`tests/e2e/` or `tests/unit/ui/`). |
| **T7** | No test names an AC or Case ID the spec does not declare. |
| **T8** | The committed traceability matrix is up to date. |
| **T9** | Every waiver is valid, reasoned, and still needed. |

Three consequences worth stating outright:

- **A test name is not a claim, it is the criterion.** Write
  `it('AC-1.1.9 — <the AC's title, copied verbatim>', …)`. Append a qualifier
  after it when a criterion needs several tests:
  `'AC-1.1.9 — <title>: from six down to one'`. If the AC's wording changes, T5
  fails until you open the test and confirm it still proves the new wording.
  That failure is the point.
- **A compound AC must be decomposed, not summarised.** An AC with several
  `Then`/`And` clauses or a table gets numbered Cases (`AC-1.2.2/1`, `/2`, …), one
  test each. One test standing in for twelve table rows proves one and claims twelve.
- **A pure unit test cannot prove a UI criterion.** An AC that names a control,
  view, panel, prompt, gesture, or viewport needs an e2e or `tests/unit/ui/`
  test. An AC whose only proof is a pure unit test is the exact shape of an
  unbuilt feature reporting as covered.

**Adding a new AC means adding its plan item row and both tasks in the same
change.** Not afterwards — T1 and T2 fail until they exist, which is what stops an
AC being written down and quietly never scheduled.

### The matrix

`specs/traceability-matrix.md` is the chain as a document: one row
per criterion, carrying its User Story, the criterion's own words, its plan item, its
implementation tasks, its test tasks (listed **separately**, because "who builds it" and
"who proves it" are different questions), the test that proves it, and a status.

**It is generated. Never edit it by hand.**

```bash
npm run trace:matrix     # regenerate; commit the result
npm run trace:changed    # the rows this change touches — paste into the PR body
```

T8 fails when it is stale, so a change that alters the chain cannot land without the
matrix being regenerated and the diff reviewed. That diff is the point: it is where a
criterion silently losing its test becomes visible.

The matrix reports **coverage as well as gaps** — the proportion proven, overall and per
User Story — because a list of only what is wrong cannot say whether the work is fit to
ship.

Every row, User Story and headline count is colour-marked — 🟢 proven, 🔵 waived, and
🟡 → 🟠 → 🔴 as a gap gets more serious — so hundreds of rows can be scanned rather than
read. A User Story takes the colour of its **worst** criterion. The colour sits beside the
words it repeats and never replaces them, since red and green are the one pair a
colour-blind reader cannot separate.

`trace:changed` splits its rows by how the criterion was reached. **Direct** means a test
naming that criterion changed in the diff; that is the near-certain set and it is listed
in full. **Indirect** means the change touched a file some task mentions, which in a
codebase with a composition root is most of the application — collapsed to a count, since
it is a blast radius rather than a finding.

### Gap severity

Derived from the kind of gap, never assigned per criterion — an assigned severity is a
judgement made under whatever pressure applied at the time, and gets revised downward by
whoever is in a hurry.

| | Gap | Why |
|---|---|---|
| 🔴 **CRITICAL** | No test names the criterion | Nobody has looked. The state an unbuilt requirement sits in. |
| 🔴 **HIGH** | A test names it but proves something else | Unproven while reporting as covered. |
| 🔴 **HIGH** | UI-level, but only a pure unit test | Same failure, reached differently: a pure unit test cannot see a screen. |
| 🟠 **MEDIUM** | Compound AC not decomposed | Partly proven; one test stands in for several claims. |
| 🟡 **LOW** | Right test, named in its own words | Proven. Clerical. |

### Waivers

A **LOW or MEDIUM** gap may be signed off in `traceability-waivers.json` with a written
reason, which shows in its matrix row. Use it when a gap is genuinely not worth closing —
a criterion checked by hand each release, a case outside the realm of the possible.

**CRITICAL and HIGH can never be waived, by anyone, for any reason.** Those are exactly
the states in which a specified requirement sits while unbuilt and reporting as complete.
T9 fails a waiver that reaches above MEDIUM, names a criterion the spec does not declare,
gives no real reason, or covers a gap that has since been fixed — so the file cannot rot
into a blanket pass.

### The tooling

`npm run check:trace` and the matrix come from `.claude/skills/spec-trace/` — a
self-contained, dependency-free skill, portable to any spec-kit project. Its own tests
live beside it and run under `npm test`. **Changing the checker means changing its
tests**: it is the one place where a false PASS is invisible, since a gate that never
fires looks exactly like a gate with nothing to find.

A `Stop` hook (`.claude/settings.json`) runs the check when a session ends and surfaces
new findings. It never blocks — a hook that halts a session over a documentation gap gets
switched off, and a gate that is off enforces nothing.

### The baseline

This project starts with an **empty baseline** — the gates were here before the code.
Keep it that way: `specs/traceability-baseline.json` exists for a project adopting the
gates late, holding the debt that existed the day they landed, reported but not
build-failing. **The baseline may only shrink.** `npm run check:trace -- --prune-baseline`
strikes off entries that are no longer findings, and nothing writes new ones. Taking on
new debt means hand-editing a checked-in file, which shows up in a diff and has to be
argued for. A baselined finding is outstanding work, not a settled decision.

---

## 2c. Reachability: code the application cannot reach

`npm run check:unwired` fails when an export in `src/` is mentioned by nothing anywhere
in `src/`.

It exists because a function can be specified, written, exported, unit-tested, and called
by nothing for the entire life of a project — while every gate stays green. Per-AC
coverage sees an AC ID in a test name; lint guards import direction, never whether
anything imports back.

Three things follow:

- **The rule is deliberately narrow.** A helper used by its own module, or by one other
  module, is wired. This is not a dead-code detector and does not care how deep the call
  sits — a noisy gate gets switched off, and the one shape worth failing on is code the
  application literally cannot reach.
- **Tests are not uses.** An export whose only consumer is a test is exactly the shape
  being hunted, so `tests/` is not scanned. Genuine test seams go in
  `tools/unwired-baseline.json` **with a written reason** — the checker's own tests fail a
  reason too short to be one.
- **It cannot see partial reachability.** A capability wired up in one place and
  reachable nowhere else is still a gap this gate will not find.

Same baseline rules as §2b: reported but not build-failing, may only shrink
(`npm run check:unwired -- --prune`), and an entry is outstanding work unless its reason
says it is a permanent test seam.

---

## 3. Every change gets a task

`specs/001-ear-trainer/tasks.md` carries a **Post-MVP** section (create it when the MVP
ships). Every change — bug, data fix, feature, anything — gets a numbered task there,
checked off when done, naming the files it touched and the US/AC IDs it implements or
revises.

The MVP section is a historical record once built. Do not renumber it.

---

## 4. Non-negotiable gates

Run before every commit. All must pass:

```bash
npm run lint          # eslint + tools/lint-extras.mjs (no :hover, data validation, licence files)
npm test              # unit suites, plus the spec-trace skill's own tests
npm run test:e2e      # playwright, phone + tablet, against vite preview of dist/
npm run coverage:ac   # every AC has a test naming it — must be 100%
npm run trace:matrix  # regenerate the matrix, and commit it (§2b)
npm run check:trace   # the AC → plan → task → test chain (§2b)
npm run check:unwired # every export in src/ is reachable from src/ (§2c)
```

Project-specific gates live inside `npm run lint` (`tools/lint-extras.mjs`): no `:hover`
anywhere in CSS (Constitution VI), `tools/validate-data.mjs` over `src/data/*.json`
(Constitution IX), and a `LICENSE.md` beside every media directory under `public/`
(Constitution X). ESLint additionally forbids `setTimeout`/`setInterval` in `src/audio/`
(Constitution VII).

`npm run check:trace --silent -- --summary` prints one line per check when you only
need to know which are red.

**AC coverage must stay at 100%, and `check:trace` must report no new findings.**
A new AC without a test is an incomplete change, not a passing one — and a new AC
whose test does not prove it is the same thing wearing a green badge. Commit
messages cite the US/AC IDs they touch.

**A gate that fails stops the change.** Not "is noted and worked around": §2a
governs what to do next, and the answer is never to make the gate ask for less.

---

## 5. Landing the work: every change becomes a PR

Work is not delivered when it is committed, and it is not delivered when it is
pushed. `main` is the source of truth. A push to `main` triggers
`.github/workflows/deploy.yml`, which builds and deploys the static site to GitHub Pages
at https://thinkfast37.github.io/ear-trainer/ — that deploy, not the merge, is what makes
a web change live; check `gh run list --workflow=deploy.yml` (or the Actions tab) and
confirm the deploy succeeded before calling a web change delivered. Store builds are
produced locally with `npx cap sync` after the desktop verification described in
`specs/001-ear-trainer/quickstart.md`. "Delivered" for a web change means merged to
`main` with all §4 gates green **and** the resulting Pages deploy green; for a store
change it means the manual device checklist in quickstart.md has been run and the build
submitted.

Every change lands the same way:

1. **Ask what §1 requires** and get the spill approved, if there is one.
2. **Ask how this one should land.** Once the plan is settled and you are about
   to write code, put one `AskUserQuestion` with two options:
   - **Auto** — you open the PR and merge it yourself once the gates pass.
     **This is always the default, and always listed first.**
   - **Review** — you open the PR, report the gate results, and stop. The
     maintainer merges.

   Ask it **once per change**, at that point. Not again later in the same change.
3. **Implement**, then run all the gates in §4.
4. **Open the PR either way.** The PR is the *record*, not the approval step: it
   carries the spec revisions, the AC IDs and the gate results in one place, so
   the reasoning outlives a compaction and lives somewhere a commit message
   cannot. Open it even in Auto mode, even for a one-line data fix.

   **Include the change matrix.** Paste `npm run trace:changed` into the body, so
   the PR states which criteria this change could have affected rather than
   leaving the maintainer to infer it from a file list. If it comes back empty,
   say so — a change touching no criterion is a fine thing to be told.
5. **Auto: merge it.** Review: hand over the link and stop.
6. **Watch the deploy, and report what is actually live** (if this project
   deploys on merge). Merging is not landing. If the deploy is red, say so, name
   the failure, and do not describe the change as delivered.

**A failing or skipped gate stops the merge in either mode.** Auto is permission
to merge *passing* work without waiting; it is never permission to merge red work
or to decide a gate did not apply.

**If the blast radius changes mid-implementation, the mode is void.** Stop, say
so, and ask again. The mode chosen at step 2 was chosen against a different
change from the one you now have.

Two things worth naming in the step-2 question when they apply, because no gate
can catch either:

- **It cannot be undone by a follow-up commit.** Storage migrations, deletions
  that orphan other data, anything that rewrites user state on load.
- **Taste is the deliverable.** Layout, spacing, colour, control placement. The
  gates prove it works, not that it is right, and the maintainer is the one
  using it daily.

Say so in the option text and let them choose. Do not change the default.

---

## 6. Architecture rules that are enforced, not suggested

- **The audio path uses the AudioContext clock only.** ESLint fails the build on
  `setTimeout`/`setInterval` anywhere in `src/audio/`; the scheduler computes absolute
  `currentTime` offsets (D-004). Tests use `tests/unit/audio/fakeAudioContext.js`.
- **One renderer.** Every track produces an `Exercise` object; `src/audio/renderer.js` is
  the only code that turns events into sound, and the same object always renders the same
  way (D-003) — replay and comparison depend on it.
- **Content is data.** Level pools, sub-stages, prerequisites, confusables, the progression
  catalog and anchor songs live in `src/data/*.json`; `tools/validate-data.mjs` fails lint
  on a malformed entry (D-011). Code never hard-codes a pool.
- **Unlocks never read XP.** `src/learning/unlocks.js` and `mastery.js` contain no `xp`
  reference — a test greps for it (AC-9.3.3).
- **No hover, no desktop layout.** `tools/lint-extras.mjs` fails on `:hover`; layout is by
  viewport width only (`src/ui/layout.js`), never by platform (D-008).
- **Every export reachable.** `npm run check:unwired` — `src/main.js` is the composition
  root; a module that nothing wires is unbuilt work.
- **Every deployed build is stamped.** `vite.config.js` injects a
  `<meta name="build-version">` tag — UTC build time to the second, plus the commit —
  into `index.html` at build time. View-source on the live site (or the Capacitor
  bundle) answers "which version is running?"; nothing is rendered on screen. Do not
  remove the stamp, and any replacement build pipeline must keep it.

---

## 7. Where things live

| Path | What |
|---|---|
| `.specify/memory/constitution.md` | Principles and quality bars. Amending needs a version bump. |
| `specs/001-ear-trainer/spec.md` | User Stories and Acceptance Criteria — the contract. |
| `specs/001-ear-trainer/research.md` | Technical decisions (D-00x) with rejected alternatives. |
| `specs/001-ear-trainer/data-model.md` | Data shapes, storage schema, validation rules. |
| `specs/001-ear-trainer/tasks.md` | Build plan, plus the post-ship task log. |
| `specs/traceability-matrix.md` | Generated. The AC → plan → task → test chain, whole-application. |
| `src/` | The application. |
| `tests/ac-coverage.js` | The gate that makes per-AC testing real. |

---

## 8. Check the record before asking

**Long sessions get compacted: earlier turns are summarised and specifics are
dropped.** Anything decided a while ago may be missing from working context even
though it is already done and committed. Treat your own memory of this project
as the least reliable source available.

So, before asking the maintainer *anything* — and before reporting work as
outstanding:

```bash
git log --oneline -20                  # what has actually been done
git log --oneline -- <the file>        # and to this file specifically
git log --all --grep='<topic>'         # was this decided already?
```

Then check the durable records: the post-ship log in `tasks.md`, the AC text in
`spec.md`, the D-00x entries in `research.md`, and the data files themselves.

**The repository is the source of truth. Your context is not.** If the two
disagree, the repository is right.

Three habits that follow from this:

- **Write the outcome down when the work lands, not when you plan it.** A task
  logged as "in progress" after it was finished and pushed is worse than no
  log — it actively misleads the next session.
- **Verify state from the files, not from a commit message.** Messages describe
  intent; the files carry what actually happened.
- **If you find yourself about to ask something that feels familiar, it probably
  is.** Search first.

---

## 9. Working style

- Surface decisions rather than making them quietly. When a choice would change
  what the maintainer gets, ask — with the trade-offs named, not just the options.
- Be concise. State the finding, not the journey.
- Report failures plainly, with the output.
- When the maintainer challenges something, check whether they are right before
  defending it.

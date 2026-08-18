# Setting up a project from this template

A checklist for a new repository created from `spec-kit-base`. Open the new repo in
Claude Code and say "do the template setup" — or work through it by hand. Delete this
file when everything is checked.

## 1. Identity

- [ ] `package.json` — set `name` (it says `CHANGE-ME`).
- [ ] `CLAUDE.md` — fill in the title line and every `TODO(new project)` comment:
      the opening paragraph, §4's project-specific gates, §5's deployment story,
      §6's enforced architecture rules, and the `001-CHANGE-ME` paths in §3 and §7.

## 2. Spec-kit scaffolding

- [ ] Install [spec-kit](https://github.com/github/spec-kit) and run `specify init`
      (or `specify init --here` in an existing directory). This creates `.specify/`
      with the templates, scripts, and slash commands the workflow table in
      CLAUDE.md §2 refers to.
- [ ] Write the constitution: `/speckit-constitution`. If you want the
      test-integrity and traceability principles this template assumes (CLAUDE.md
      §2a, §2b), state them there as non-negotiables.
- [ ] Specify the first feature: `/speckit-specify`. Note the feature folder it
      creates (e.g. `specs/001-my-feature/`).
- [ ] Write ACs in the shape the tooling reads (see the skill's `README.md`,
      "Document conventions"): `- **AC-1.1.2** — <title>` headings, Given/When/Then
      bodies, and numbered **Cases** for any AC asserting more than one thing.
- [ ] Optionally tighten the spec with `/speckit-clarify` before planning.
- [ ] Plan: `/speckit-plan`. **The plan must contain the Traceability Matrix
      table** — `| Plan item | Covers | Acceptance Criteria | Implementation tasks
      | Test tasks |` with `P-0xx` rows — because that table is where a human
      decides which AC belongs to which plan item, and `check:trace` T1/T2 read
      it. Spec-kit's stock plan template does not produce it; add it deliberately.
- [ ] Tasks: `/speckit-tasks`, then make sure every plan item carrying ACs has
      both an implementation task and a test task (T2), and that tasks name the
      files they touch in backticks (T3 checks completed tasks' paths exist).
- [ ] Implement: `/speckit-implement`, running the §4 gates as you go. Tests are
      named for their criterion verbatim: `it('AC-1.1.2 — <the AC title>', …)`.

## 3. Point the tooling at the feature

- [ ] `spec-trace.config.json` — replace the three `001-CHANGE-ME` paths with the
      real feature folder. `tests/ac-coverage.js` reads the same file, so this is
      the only place paths live.
- [ ] If the project has no UI, remove `tests/e2e` from `testDirs` and the
      `domCapable` entries; T6 then has nothing to insist on.
- [ ] Consider `uiVocabulary` and `synonyms` (see the skill's `README.md`) once
      the domain's words are known.

## 4. Verify the gates run

```bash
npm install
npm test              # the spec-trace skill's self-tests must pass
npm run coverage:ac   # errors until the spec exists; 0/0 once it does
npm run check:trace   # all nine checks against the real documents
npm run check:unwired # passes trivially until src/ has exports
```

- [ ] All four commands behave as described.
- [ ] Both baselines are empty and stay that way — this project has the gates
      from day one, so there is no pre-existing debt to accept.

## 5. Project-specific gates

- [ ] Add lint (`eslint` plus any architecture-boundary rules CLAUDE.md §6
      promises), e2e tooling if there is a UI, and any data-validation scripts.
      List every gate in CLAUDE.md §4 — that list is the contract.

## 6. Housekeeping

- [ ] Replace `README.md` (it describes the template, not your project).
- [ ] Delete this file.

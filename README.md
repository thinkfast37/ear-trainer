# spec-kit-base

A template repository for spec-driven projects with enforced traceability. Extracted
from [rhythm-master](https://github.com/thinkfast37/rhythm-master), where the approach
was developed the hard way — each gate here exists because of a specific failure the
previous gates could not see.

## What you get

| Artefact | What it does |
|---|---|
| `CLAUDE.md` | The working agreement: blast-radius rule, workflow table, test-integrity rules, gate list, PR protocol. Generic sections ready to use; project-specific sections marked `TODO`. |
| `.claude/skills/spec-trace/` | Dependency-free traceability checker and matrix generator. Nine checks over the AC → plan → task → test chain, with severity-ranked gaps, waivers, and a shrink-only baseline. Self-tested. |
| `.claude/settings.json` | A `Stop` hook that surfaces new traceability findings at session end (never blocks). |
| `tests/ac-coverage.js` | Fails the build when an Acceptance Criterion has no test naming it. |
| `tools/check-unwired.mjs` | Fails the build when `src/` exports something nothing in `src/` reaches — the shape of a specified, written, tested feature the app cannot use. |
| `spec-trace.config.json` | The one place document and test paths live; both tools read it. |
| Empty baselines | A new project starts with zero accepted debt. Keep it that way. |

## What you don't get

The spec-kit scaffolding itself (`.specify/`, slash commands, templates) — install
that with [`specify init`](https://github.com/github/spec-kit) in the new project, so
it stays current with upstream. And everything project-specific: the spec, the
constitution's principles, lint rules, e2e tooling, deployment.

## Using it

```bash
gh repo create my-new-project --template thinkfast37/spec-kit-base --private --clone
cd my-new-project
```

Then follow `SETUP.md` — or open the repo in Claude Code and say "do the template
setup". It walks through both halves: wiring this template's tooling (config paths,
gate verification), and the spec-kit flow for the first feature (`specify init` →
`/speckit-constitution` → `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement`), including the document conventions the traceability checks
expect the spec and plan to follow.

## Updating projects created from this template

Template copies are snapshots; fixes here do not propagate. The spec-trace skill is
self-contained, so updating a project is a verbatim overwrite of
`.claude/skills/spec-trace/` (plus `tools/check-unwired.mjs` and
`tests/ac-coverage.js` if they changed). Nothing project-specific lives in those
paths.

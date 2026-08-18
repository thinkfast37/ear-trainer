# Ear Trainer

A mobile-first, offline ear-training app: intervals, scale degrees, chord qualities,
inversions, melodic phrases and chord progressions, drilled with a real (sampled) piano,
per-item Leitner scheduling and mastery-gated levels. Built as a web app first; packaged for
iOS and Android with Capacitor.

- **Stack**: plain ES-module JavaScript, Vite, Web Audio, Vitest + Playwright, Capacitor 6.
- **Content is data**: `src/data/levels.json`, `progressions.json` (52-entry catalog),
  `anchors.json` (anchor songs), `credits.json`.
- **Samples**: Salamander Grand Piano (CC BY 3.0) via tonejs-instruments — 17 files, 3.5 MB,
  `public/samples/LICENSE.md`; credited in-app under Settings → Credits.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # static site → dist/
npm run preview      # serve dist/ (what the e2e suite tests)
```

## Gates (all must pass before a commit — see CLAUDE.md §4)

```bash
npm run lint && npm test && npm run test:e2e && npm run coverage:ac && \
npm run trace:matrix && npm run check:trace && npm run check:unwired
```

## Where things live

| Path | What |
|---|---|
| `CLAUDE.md` | The working agreement: blast-radius rule, workflow table, gates, PR protocol |
| `.specify/memory/constitution.md` | Principles (v1.1.0) |
| `specs/001-ear-trainer/` | spec.md (36 stories, 109 ACs, 207 criteria), plan.md, research.md (D-001–D-012), data-model.md, tasks.md, quickstart.md |
| `specs/traceability-matrix.md` | Generated: every criterion → plan item → tasks → test |
| `src/` | `audio/` `theory/` `learning/` `tracks/` `ui/` `storage/` `platform/` `data/`, `main.js` composition root |
| `tests/` | `unit/` (Vitest; `unit/ui/` runs under jsdom), `e2e/` (Playwright, phone + tablet) |

Store builds: `npm run build && npx cap add ios|android && npx cap sync` after the desktop
verification in `specs/001-ear-trainer/quickstart.md`.

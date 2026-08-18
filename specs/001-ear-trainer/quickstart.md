# Quickstart: Ear Trainer

## Prerequisites

- Node 20+ (developed on 24), npm
- For e2e: `npx playwright install chromium` once
- For device builds only: Xcode / Android Studio and `npx cap add ios|android` (native
  projects are generated locally, not committed)

## Run

```bash
npm install
npm run dev            # Vite dev server → http://localhost:5173
npm run build          # production build → dist/
npm run preview        # serve dist/ (what e2e runs against)
```

## Gates (all must pass before a commit — CLAUDE.md §4)

```bash
npm run lint           # eslint + data validation + no-hover check
npm test               # vitest: unit + tests/unit/ui (jsdom) + spec-trace self-tests
npm run test:e2e       # playwright, phone + tablet projects, against vite preview
npm run coverage:ac    # every AC has a test naming it — 100%
npm run trace:matrix   # regenerate specs/traceability-matrix.md and commit it
npm run check:trace    # T1–T9, no new findings
npm run check:unwired  # every export in src/ reachable from src/
```

## Validation scenarios (end-to-end proof the feature works)

| # | Scenario | Expected |
|---|---|---|
| 1 | Open the app, tap once, tap Intervals L1 | A cadence-free interval plays from bundled samples; no network request after load (DevTools → Network) |
| 2 | Answer wrong | Verdict < 200 ms; comparison button plays correct then chosen, both labelled; anchor songs listed |
| 3 | Answer 20+ questions at ≥ 90% with all items ≥ box 3 | Level marked mastered, celebration screen, next level node available |
| 4 | Master Chord Qualities L1 | Inversions track unlocks; map draws the dependency line |
| 5 | Reload the page | Boxes, streak, XP unchanged |
| 6 | Settings → Export; clear storage; Import | Progress restored; importing a garbage file shows a clear error |
| 7 | Resize 375 → 800 → 1280 px | Phone layout, tablet layout, tablet layout; no hover effects anywhere |
| 8 | 30 questions in a day | Day complete, streak +1, dismissible stopping-point message |

## Manual device checklist (AC-10.2.x — before any store release)

1. `npm run build && npx cap sync`
2. Run on a device in airplane mode: complete a full session (audio, answers, progress).
3. Kill and relaunch: progress present (Capacitor Preferences).
4. Background mid-session, return, tap: audio resumes without reload.
5. Enable notifications; let the practice window pass; a local reminder fires.
6. Rotate portrait ↔ landscape mid-question: state and controls intact.

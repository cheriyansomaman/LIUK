# Plan: Life in the UK Practice Test

A pure static, client-side multiple-choice quiz app deployable on GitHub Pages.

## Files

- `index.html` — single page: header (title, progress text, progress bar, score), quiz card (category badge, question, options A–D, feedback + explanation, Next button), summary screen, error screen, restart button.
- `styles.css` — modern responsive styling, CSS custom properties, light/dark via `prefers-color-scheme`, 16px gutters at phone width.
- `app.js` — vanilla JS, no dependencies:
  - RFC-4180-style CSV parser (quoted fields, `""` escapes, commas/newlines inside quotes).
  - Fetch `data/questions.csv` (relative path — works under `/LIUK/` subpath).
  - Session state in `localStorage` (`liuk-session-v1`): Fisher–Yates-shuffled array of question ids, pointer, score, per-question results (`{id, correct, chosen}`).
  - Resume on return visit; if stored ids don't match loaded bank, offer fresh start.
  - Per-question option shuffle (display labels A–D follow display order; correct index tracked).
  - Answer flow: pick → lock options, mark correct/incorrect, show explanation → Next.
  - Summary screen at end: score, %, per-category breakdown, restart.
  - Restart button with `confirm()`.
  - Keyboard: 1–4 / A–D to answer, Enter/Space for next.
  - Friendly error UI for fetch/parse failures (file:// hint → `python3 -m http.server`).
- `data/sample-questions.csv` — 10 made-up rows for local testing only (real `data/questions.csv` is produced separately and never touched here).
- `README.md` — usage, local run, GitHub Pages setup, privacy note.
- `.nojekyll` — empty, so Pages serves files as-is.

## Verification

Serve with `python3 -m http.server`, point the CSV path at the sample via a temporary override, drive the page with Playwright/Chromium: answer questions, reload to confirm resume, capture `.screenshots/app.png`. Final `app.js` fetches `data/questions.csv`.

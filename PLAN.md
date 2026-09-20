# Plan: Life in the UK Practice Test

A pure static, client-side multiple-choice quiz app deployable on GitHub Pages, backed by a
generated bank of original practice questions. This records the design as built; see
`README.md` for how to run and deploy it.

## Constraints

- No backend, no accounts, no database — GitHub Pages serves static files only.
- Progress must survive closing the tab, so it lives in the browser's `localStorage`.
- Questions must not repeat within a session until the whole bank is exhausted.
- All paths relative, so the site works from a project subpath like `/LIUK/`.

## Files

- `index.html` — one page with five screens: loading, error, bank-changed prompt, quiz
  (category badge, question, options A–D, feedback and explanation, Next) and summary.
- `styles.css` — responsive, light/dark via `prefers-color-scheme`, 16px gutters at phone
  width, tokens on `:root`.
- `app.js` — vanilla JS, no dependencies:
  - RFC 4180-style CSV parser handling quoted fields, `""` escapes, and commas or newlines
    inside quotes.
  - Fetches `data/questions.csv` at runtime.
  - Session state in `localStorage` under `liuk-session-v1`: a Fisher–Yates-shuffled array
    of question ids, a position pointer, and a map of id to correct/incorrect.
  - An answer is recorded and the pointer advanced *immediately* on selection, so a reload
    mid-question never re-serves it.
  - On return visits the session resumes; if the bank has changed, the user chooses between
    carrying answers across (ids are merged, new ones appended) and starting fresh.
  - Options are shuffled per question at render time, so positions are not memorisable.
  - Summary screen at the end: score, percentage and a per-category breakdown.
  - Keyboard: 1–4 or A–D to answer, Enter or Space for next.
  - Friendly error screen for fetch failures, with the `file://` hint.
- `data/questions.csv` — 1,058 generated questions.
- `data/src/` — question source batches plus `build.py`, which generates and validates the
  CSV. Sources store the correct option first; the build shuffles options under a fixed seed
  so the answer letter is evenly distributed without hand-balancing.
- `.nojekyll` — stops GitHub Pages running Jekyll.

## Question bank

Original questions covering the five chapters of the official syllabus, deliberately not
copied from the official handbook or commercial question banks. Distribution reflects the
weight of each chapter: History 402, Modern Society 258, Government and Law 250, Values and
Principles 80, What is the UK 68.

`build.py` fails the build unless every row has nine fields, every answer is A–D, every
explanation is 100–150 words, options within a question are distinct and no two questions
duplicate each other.

## Verification

Driven with Playwright against Chromium over `python3 -m http.server`, checking: the full
bank loads; answering shows feedback, the correct option and a 100–150 word explanation;
the score tracks; a reload resumes at the same question with the score intact; 45
consecutive questions contain no repeat; order differs between fresh sessions; keyboard
input works; the summary screen renders with a five-category breakdown; and no JavaScript
errors occur on any screen.

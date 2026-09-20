# Plan: Life in the UK Mock Tests

A pure static, client-side app deployable on GitHub Pages, backed by a generated bank of
original practice questions. It offers timed 24-question mock tests in the shape of the real
exam, plus a continuous practice mode over the whole bank. This records the design as built;
see `README.md` for how to run and deploy it.

## Constraints

- No backend, no accounts, no database — GitHub Pages serves static files only.
- Progress must survive closing the tab, so it lives in the browser's `localStorage`.
- No question may appear in two different mock tests until the bank is exhausted.
- All paths relative, so the site works from a project subpath like `/LIUK/`.

## Files

- `index.html` — one page with seven screens: loading, error, home, quiz (shared by both
  modes), mock-test result, review of a finished test, and the practice summary.
- `styles.css` — responsive, light/dark via `prefers-color-scheme`, 16px gutters at phone
  width, tokens on `:root`.
- `app.js` — vanilla JS, no dependencies.
- `data/questions.csv` — 1,058 generated questions.
- `data/src/` — question source batches plus `build.py`, which generates and validates the
  CSV. Sources store the correct option first; the build shuffles options under a fixed seed
  so the answer letter is evenly distributed without hand-balancing.
- `.nojekyll` — stops GitHub Pages running Jekyll.

## Mock tests

A mock test is 24 questions, 45 minutes, pass mark 18 — the parameters of the real test.

**Uniqueness across tests.** State holds a `pool` of ids never yet served. Starting a test
removes its 24 ids from the pool, so the guarantee holds even if the tab is closed mid-test.
Abandoning a test returns its ids to the pool; resetting refills it. 1,058 questions give 44
full tests, with 2 left over.

**Spread across topics.** The 24 slots are shared out by Sainte-Laguë highest averages over
what is *left in the pool*, with one slot guaranteed to every topic that still has questions.
On the full bank that is History 9, Modern Society 6, Government and Law 6, Values and
Principles 2, What is the UK 1. Because the share-out is recomputed from the remaining pool
each time, the small topics thin out gracefully instead of running dry — every one of the 44
tests still spans all five.

**During the test.** No explanations, exactly like the real thing. Answers can be changed and
questions revisited via Back and a numbered grid that marks which are answered. Each
question's option order is drawn once and stored, so a reload — or a review months later —
shows the same layout that was answered. Finishing with blanks asks for confirmation. A timed
test carries an absolute `endsAt`, so the clock keeps running while the tab is closed and the
test auto-submits when it expires.

**Afterwards.** The result screen gives the score, pass/fail against 18/24, time taken and a
per-topic breakdown. Review then walks all 24 questions with the chosen answer, the correct
answer and the explanation. Every finished test is kept and can be re-opened from the history
table on the home screen.

## Practice mode

The original continuous mode: the whole bank in a random order, explanation straight after
each answer, its own score and progress. The answer is recorded and the pointer advanced
*immediately* on selection, so a reload mid-question never re-serves it. It draws from the
bank independently and does not consume the mock-test pool.

## State

`localStorage` key `liuk-session-v1`, version 2:

```
{ v: 2, timed: bool,
  mock: { pool: [id], tests: [{n, ids, order, answers, score, timed, timedOut,
                               startedAt, finishedAt}], active: {…} | null },
  practice: { order: [id], pos: int, results: {id: bool} } }
```

Loading tolerates anything: a version-1 session (a single `{order, pos, results}` run) is
adopted as practice progress, ids the bank no longer has are dropped, newly-added ids are
folded into the pool, and an in-flight test whose questions have changed is discarded rather
than shown broken. Every read and write is wrapped, so private mode and blocked storage
degrade to a session that simply does not resume.

## Question bank

Original questions covering the five chapters of the official syllabus, deliberately not
copied from the official handbook or commercial question banks. Distribution reflects the
weight of each chapter: History 402, Modern Society 258, Government and Law 250, Values and
Principles 80, What is the UK 68.

`build.py` fails the build unless every row has nine fields, every answer is A–D, every
explanation is 100–150 words, options within a question are distinct and no two questions
duplicate each other.

## Verification

Driven with Playwright against Chromium over `python3 -m http.server`. It runs all 44 mock
tests back to back and checks: each test holds 24 questions spanning all five topics; the
1,056 questions served are every one of them unique; the pool drains to exactly the 2
leftovers and never overlaps what was used. Within a test it checks the 45-minute clock, that
no explanation is shown, that a chosen answer is highlighted, that Back keeps it, that a
reload resumes at the same question with answers intact, and that the last question offers
Finish. Afterwards it checks the score line, the pass/fail badge, the five-row breakdown, and
that all 24 review items mark exactly one correct answer and explain it in 100–150 words. It
also covers the history table, re-opening an earlier test, reset, abandon, untimed mode,
practice mode with its immediate explanations and keyboard entry, and that no JavaScript
error occurs on any screen. A second script plants a version-1 session and checks it is
upgraded with its progress intact.

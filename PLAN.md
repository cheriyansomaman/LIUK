# Plan: Life in the UK Mock Tests

A pure static, client-side app deployable on GitHub Pages: 45 mock tests of 24 questions each,
backed by a generated bank of 1,080 original questions. This records the design as built; see
`README.md` for how to run and deploy it.

## Constraints

- No backend, no accounts, no database — GitHub Pages serves static files only.
- Progress must survive closing the tab, so it lives in the browser's `localStorage`.
- No question may appear in more than one mock test.
- Any test can be taken, resumed or reset at any time, independently of the others.
- All paths relative, so the site works from a project subpath like `/LIUK/`.

## Files

- `index.html` — one page with six screens: loading, error, home (the list of tests), the test
  itself, the result, and the review of a finished test.
- `styles.css` — responsive, light/dark via `prefers-color-scheme`, 16px gutters at phone
  width, tokens on `:root`.
- `app.js` — vanilla JS, no dependencies.
- `data/questions.csv` — 1,080 generated questions, each carrying its test number.
- `data/src/` — question source batches plus `build.py`, which generates and validates the CSV
  and deals the questions into the tests.
- `.nojekyll` — stops GitHub Pages running Jekyll.

## The tests

A mock test is 24 questions, 45 minutes and a pass mark of 18 — the parameters of the real test.

**Fixed membership.** The split lives in the data, not in the app: `build.py` writes a `test`
column assigning every question to exactly one of the 45 tests, so no question can appear in two
of them and test 12 always means the same 24 questions. 1,080 = 45 × 24 exactly, so nothing is
left over. The deal gives each test its proportional share of every category — History 9, Modern
Society 6, Government and Law 6, Values and Principles 2, What is the UK 1 — with each category's
remainder dealt round-robin from a position that carries on between categories, which is what
makes every test come out at exactly 24. Because a category's remainder is smaller than the
number of tests, no test is handed two extras from the same category. It is deterministic, so
rebuilding from unchanged sources reproduces the same tests and a saved score keeps its meaning.

**Independent progress.** The home screen lists all 45. Each is not started, in progress (with a
count of answers given) or finished (with a score and pass/fail), each can be started, resumed,
reviewed, retaken or reset on its own, and there is a reset-everything button. Starting a test
draws its presentation order and its per-question option order once and stores them, so a reload —
or a review months later — shows exactly the layout that was answered.

**During the test.** No explanations, exactly like the real thing. Answers can be changed and
questions revisited via Back and a numbered grid that marks which are answered. Finishing with
blanks asks for confirmation.

**The clock.** Time is accumulated rather than absolute: each test stores the milliseconds it has
used, and the ticker only runs while that test is on screen and the tab is visible. That suits an
app where several tests may be half-finished at once — leaving a test does not burn its
allowance. It is written back every five seconds and whenever the test is left, and the test
auto-submits when the 45 minutes are gone. The timer can be switched off.

**Afterwards.** The result screen gives the score, pass/fail against 18/24, time used and a
per-topic breakdown. Review then walks all 24 questions with the chosen answer, the correct
answer and the explanation.

## State

`localStorage` key `liuk-session-v1`, version 3:

```
{ v: 3, timed: bool, open: <test number or 0>,
  tests: { "<n>": { qorder: [id], order: {id: [perm]}, answers: {id: int},
                    pos: int, used: ms, timed: bool, done: bool,
                    score: int, timedOut: bool, startedAt, finishedAt } } }
```

`open` is the test to drop back into when the app is reopened, so closing the tab mid-test does
not dump the user back on the list. On load, a stored attempt is kept only if the set of ids it
holds still matches what the CSV assigns to that test; otherwise that test starts clean. Earlier
versions of the saved state cannot be mapped onto fixed tests and are replaced. Every read and
write is wrapped, so private mode and blocked storage degrade to a session that simply does not
resume.

## Question bank

Original questions covering the five chapters of the official syllabus, deliberately not copied
from the official handbook or commercial question banks. Distribution reflects the weight of each
chapter: History 402, Modern Society 264, Government and Law 261, Values and Principles 82, What
is the UK 71.

`build.py` fails the build unless every row has ten fields, every answer is A–D, every explanation
is 100–150 words, options within a question are distinct, no two questions duplicate each other,
the bank holds exactly 45 × 24 questions, every category can supply at least one question per
test, and every test ends up with 24 questions spanning all five categories.

## Verification

Driven with Playwright against Chromium over `python3 -m http.server`. It checks the data
independently of the app — 45 tests of 24, every test spanning all five topics, no question in two
tests — then drives the app: starting a test other than the first, that the questions served are
exactly the ones the file assigns to it, the 45-minute clock, that no explanation is shown, that a
chosen answer is highlighted, that Back keeps it, that a reload resumes at the same question with
answers intact, and that the last question offers Finish. Afterwards it checks the score line, the
pass mark, the pass/fail badge, the five-row breakdown, and that all 24 review items mark exactly
one correct answer and explain it in 100–150 words. It then checks the per-test model: a part-done
test showing its own progress while the others keep theirs, resume, that the clock pauses when a
test is left, reset of a part-done test, reset of a finished test, retake, untimed mode, reset-all,
and that no JavaScript error occurs on any screen.

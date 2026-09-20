# Life in the UK — Mock Tests & Practice

A free practice app for the UK citizenship test, built around **1,058 original multiple-choice
questions**. It runs mock tests in the shape of the real exam and keeps track of which questions
you have already seen — all in the browser, with no accounts and no server.

## Mock tests

Each mock test mirrors the real one:

- **24 questions**, drawn from **all five topics** of the syllabus.
- **45 minutes** on the clock (switch the timer off if you would rather not race it).
- **Pass mark 18 out of 24**, the same 75% the Home Office uses.
- **No explanations until you finish** — you answer, then review.

Within a test you can move back and forth, change an answer, and jump straight to any question
from the numbered grid underneath. Unanswered questions are marked so nothing is left behind by
accident.

### Every test is a fresh set of questions

The app keeps a **pool of questions you have never been served**. Starting a test takes its 24
questions out of that pool, so no question can appear in two mock tests. With 1,058 questions
that is **44 full tests** before anything repeats. The home screen always shows how many unused
questions are left and how many more tests they cover.

Each test's questions, your answers and your score are stored, so finished tests can be reviewed
any time from the history table — with the correct answer and a 100–150 word explanation for
every question. Abandoning a test in progress puts its questions back in the pool; resetting the
mock tests clears the history and makes the whole bank available again.

Each question's four options are shuffled per test and that order is stored too, so coming back
to a test — or reviewing an old one — shows exactly the layout you answered.

## Practice mode

Alongside the mock tests, practice mode runs the **whole bank** in a random order with the
explanation shown straight after each answer. It has its own progress and score, and it does
**not** consume the mock-test pool.

## How your progress is kept

Everything — the unused pool, finished tests, the test in progress and its clock, and practice
progress — lives in the browser's `localStorage`. Closing the tab and coming back later resumes
exactly where you left off, including mid-test. **Nothing is uploaded**: there is no backend, no
database and no tracking.

## Running it locally

The app fetches `data/questions.csv`, which browsers block when a page is opened directly
from disk, so serve the folder over HTTP:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Publishing on GitHub Pages

The site is plain static files with relative paths, so it deploys as-is. **Pages has to be
switched on once by hand** — a repository's own Actions token is not allowed to create a
Pages site, so this cannot be automated from inside the repo.

Go to **Settings → Pages → Build and deployment → Source** and pick one of:

**GitHub Actions** (recommended). `.github/workflows/pages.yml` then publishes on every push
to the default branch. The job regenerates `data/questions.csv` from `data/src/` and fails if
the committed CSV differs or fails validation, so a stale or broken question bank cannot go
live. After switching the source, re-run the workflow from the **Actions** tab.

**Deploy from a branch.** Choose the branch and the **`/ (root)`** folder, then **Save**. This
serves the files directly and needs no Actions run, but skips the validation guard above.

Either way the site appears at `https://<user>.github.io/<repo>/` within a minute or two. The
empty `.nojekyll` file stops GitHub running Jekyll over the files.

Until Pages is switched to the **GitHub Actions** source, the workflow still runs and still
validates the question bank, but skips the deploy and leaves a warning saying so. It does not
fail. This is deliberate, so that using the **Deploy from a branch** source does not leave a
permanently red workflow.

## The question bank

`data/questions.csv` has one row per question:

| column | meaning |
| --- | --- |
| `id` | sequential integer |
| `category` | one of the five syllabus chapters |
| `question` | the question text |
| `option_a` … `option_d` | the four options |
| `answer` | `A`, `B`, `C` or `D` |
| `explanation` | 100–150 words on why the answer is correct |

Coverage follows the five chapters of the official syllabus:

| category | questions |
| --- | --- |
| History | 402 |
| Modern Society | 258 |
| Government and Law | 250 |
| Values and Principles | 80 |
| What is the UK | 68 |

### Regenerating the CSV

The CSV is generated, not hand-edited. Question sources live in `data/src/batch_*.py` as
tuples of `(category, question, [correct, wrong, wrong, wrong], explanation)` — the correct
option is always written first. `data/src/build.py` shuffles the four options with a fixed
seed (so the correct letter is spread evenly across A–D), assigns ids, writes the CSV and
validates it:

```sh
python3 data/src/build.py
```

Validation checks the row shape, the answer letter distribution, that every explanation is
100–150 words, that no two questions are duplicates and that options within a question are
distinct. It exits non-zero if anything fails.

Because options are shuffled, questions must not use answers like "all of the above".

## About the questions

These questions are **original**, written to cover the topics of the official
*Life in the United Kingdom* syllabus. They are not copied from the official handbook or
from any commercial question bank, and this app is not affiliated with or endorsed by the
Home Office. It is study practice, not a substitute for reading the official handbook.

Facts current as of 2026; the real test is based on the current edition of the handbook.

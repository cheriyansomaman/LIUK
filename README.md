# Life in the UK — Mock Tests

A free practice app for the UK citizenship test: **45 mock tests of 24 questions**, built from a
bank of **1,080 original questions**. It runs entirely in the browser, with no accounts and no
server.

## The tests

Each mock test mirrors the real one:

- **24 questions**, covering **all five topics** of the syllabus.
- **45 minutes** on the clock (switch the timer off if you would rather not race it).
- **Pass mark 18 out of 24**, the same 75% the Home Office uses.
- **No explanations until you finish** — you answer, then review.

Within a test you can move back and forth, change an answer, and jump straight to any question
from the numbered grid underneath. Unanswered questions are marked so nothing is left behind by
accident.

## Take them in any order

The home screen lists all 45 tests. Every one can be started at any time, and each keeps its own
progress:

- **not started** — shows how many questions it holds;
- **in progress** — shows how many of the 24 are answered, and offers **Resume**;
- **finished** — shows the score and whether it was a pass, and offers **Review**.

**Reset** clears a test back to untouched, whether it is half done or finished, and **Take again**
restarts a finished one straight away. **Reset all tests** clears the lot. Nothing you do to one
test touches another.

The clock only runs while a test is open, so leaving a test and coming back later does not eat
the 45 minutes. Closing the tab in the middle of a test and reopening the app drops you back into
that test.

## Every test has its own questions

The split is fixed in the data, not drawn at random: `data/questions.csv` carries a `test` column
that assigns each of the 1,080 questions to exactly one of the 45 tests, so **no question appears
in two tests**. The share-out is proportional to the size of each topic, and every test contains
at least one question from each of the five, so test 12 always means the same 24 questions and a
saved score keeps its meaning.

Reviewing a finished test walks all 24 questions with the answer you chose, the correct answer and
a 100–150 word explanation.

## How your progress is kept

Every test's answers, option order, score and remaining time live in the browser's
`localStorage`. Closing the tab and coming back later resumes exactly where you left off,
including mid-test. **Nothing is uploaded**: there is no backend, no database and no tracking.

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
| `test` | which of the 45 mock tests the question belongs to, 1–45 |
| `category` | one of the five syllabus chapters |
| `question` | the question text |
| `option_a` … `option_d` | the four options |
| `answer` | `A`, `B`, `C` or `D` |
| `explanation` | 100–150 words on why the answer is correct |

Coverage follows the five chapters of the official syllabus:

| category | questions | per test |
| --- | --- | --- |
| History | 402 | 9 |
| Modern Society | 264 | 6 |
| Government and Law | 261 | 6 |
| Values and Principles | 82 | 2 |
| What is the UK | 71 | 1 |

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
distinct. It then deals the questions into the 45 tests — each category hands every test its
proportional share, and the remainders are dealt round-robin — and checks that every test ends up
with exactly 24 questions covering all five categories. It exits non-zero if anything fails.

The deal is deterministic, so rebuilding from unchanged sources produces the same tests. Adding
questions changes the make-up of the tests, and the app then discards saved progress for any test
whose questions no longer match.

Because options are shuffled, questions must not use answers like "all of the above".

## About the questions

These questions are **original**, written to cover the topics of the official
*Life in the United Kingdom* syllabus. They are not copied from the official handbook or
from any commercial question bank, and this app is not affiliated with or endorsed by the
Home Office. It is study practice, not a substitute for reading the official handbook.

Facts current as of 2026; the real test is based on the current edition of the handbook.

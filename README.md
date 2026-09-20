# Life in the UK — Practice Test

A free practice-test app for the UK citizenship test. It serves **1,058 multiple-choice
questions** in a random order, shows a 100–150 word explanation after every answer, and
remembers where you got to — all in the browser, with no accounts and no server.

## How it works

- Questions are shuffled once per session and served with **no repeats** until the whole
  bank has been answered.
- Your shuffled order, position, score and per-question results are saved in the browser's
  `localStorage`, so closing the tab and coming back later resumes exactly where you left off.
- Each answer immediately reveals the correct option and an explanation of why it is right.
- A summary screen at the end gives your score, percentage and a breakdown by topic.
- **Nothing is uploaded.** There is no backend, no database and no tracking; your progress
  never leaves your device.

## Running it locally

The app fetches `data/questions.csv`, which browsers block when a page is opened directly
from disk, so serve the folder over HTTP:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Publishing on GitHub Pages

The site is plain static files with relative paths, so it deploys as-is:

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick the branch and the **`/ (root)`** folder, then **Save**.

The site appears at `https://<user>.github.io/<repo>/` within a minute or two. The empty
`.nojekyll` file stops GitHub from running Jekyll over the files.

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

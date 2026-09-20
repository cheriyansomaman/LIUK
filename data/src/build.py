#!/usr/bin/env python3
"""Build data/questions.csv from the batch modules in this folder.

Each batch module exposes QUESTIONS: a list of tuples

    (category, question, [correct, wrong, wrong, wrong], explanation)

The correct option is always written first; this script shuffles the four
options with a fixed seed, so the correct letter is evenly spread across
A-D without anyone having to balance it by hand.
"""

import csv
import importlib
import pathlib
import random
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "questions.csv"
SEED = 20260919
LETTERS = "ABCD"
HEADER = ["id", "category", "question", "option_a", "option_b",
          "option_c", "option_d", "answer", "explanation"]

MIN_WORDS, MAX_WORDS = 100, 150
TARGET_TOTAL = 1050

CATEGORIES = {
    "Values and Principles",
    "What is the UK",
    "History",
    "Modern Society",
    "Government and Law",
}


def load_batches():
    sys.path.insert(0, str(HERE))
    items = []
    for path in sorted(HERE.glob("batch_*.py")):
        module = importlib.import_module(path.stem)
        items.extend(module.QUESTIONS)
    return items


def normalise(text):
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def build(items):
    rng = random.Random(SEED)
    rows, problems = [], []
    seen_questions = {}

    for n, item in enumerate(items, start=1):
        if len(item) != 4:
            problems.append(f"#{n}: expected 4 fields, got {len(item)}")
            continue
        category, question, options, explanation = item

        if category not in CATEGORIES:
            problems.append(f"#{n}: unknown category {category!r}")
        if len(options) != 4:
            problems.append(f"#{n}: expected 4 options, got {len(options)}")
            continue
        if len({o.strip().lower() for o in options}) != 4:
            problems.append(f"#{n}: duplicate options in {question[:60]!r}")

        words = len(explanation.split())
        if not MIN_WORDS <= words <= MAX_WORDS:
            problems.append(f"#{n}: explanation is {words} words — {question[:60]!r}")

        key = normalise(question)
        if key in seen_questions:
            problems.append(f"#{n}: duplicates question #{seen_questions[key]} — {question[:60]!r}")
        else:
            seen_questions[key] = n

        correct = options[0]
        shuffled = list(options)
        rng.shuffle(shuffled)
        answer = LETTERS[shuffled.index(correct)]

        rows.append([n, category, question.strip(), *[o.strip() for o in shuffled],
                     answer, explanation.strip()])

    return rows, problems


def report(rows, problems):
    print(f"questions: {len(rows)}")

    by_category = {}
    by_letter = {letter: 0 for letter in LETTERS}
    for row in rows:
        by_category[row[1]] = by_category.get(row[1], 0) + 1
        by_letter[row[7]] += 1

    print("\nby category")
    for name in sorted(by_category, key=lambda k: -by_category[k]):
        n = by_category[name]
        print(f"  {name:<22} {n:>5}  {n / len(rows):6.1%}")

    print("\nanswer letters")
    for letter in LETTERS:
        n = by_letter[letter]
        print(f"  {letter} {n:>5}  {n / len(rows):6.1%}")

    if rows:
        counts = [len(row[8].split()) for row in rows]
        print(f"\nexplanation words: min {min(counts)}, max {max(counts)}, "
              f"mean {sum(counts) / len(counts):.0f}")

    if problems:
        print(f"\n{len(problems)} PROBLEM(S):")
        for line in problems[:60]:
            print("  " + line)
        if len(problems) > 60:
            print(f"  … and {len(problems) - 60} more")
    else:
        print("\nvalidation: clean")

    if len(rows) < TARGET_TOTAL:
        print(f"\nSHORT: {len(rows)} of {TARGET_TOTAL} target questions")


def main():
    rows, problems = build(load_batches())

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(HEADER)
        writer.writerows(rows)

    print(f"wrote {OUT}")
    report(rows, problems)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

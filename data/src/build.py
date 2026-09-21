#!/usr/bin/env python3
"""Build data/questions.csv from the batch modules in this folder.

Each batch module exposes QUESTIONS: a list of tuples

    (category, question, [correct, wrong, wrong, wrong], explanation)

The correct option is always written first; this script shuffles the four
options with a fixed seed, so the correct letter is evenly spread across
A-D without anyone having to balance it by hand.

It also deals every question into one of the fixed mock tests and writes
that number in the `test` column. The deal is deterministic: the same
sources always produce the same tests, so a saved score keeps its meaning.
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
HEADER = ["id", "test", "category", "question", "option_a", "option_b",
          "option_c", "option_d", "answer", "explanation"]

MIN_WORDS, MAX_WORDS = 100, 150

TESTS = 45
TEST_SIZE = 24
TARGET_TOTAL = TESTS * TEST_SIZE

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

        rows.append([n, 0, category, question.strip(), *[o.strip() for o in shuffled],
                     answer, explanation.strip()])

    return rows, problems


def deal_tests(rows):
    """Number every question 1..TESTS so each test holds TEST_SIZE questions
    spanning every category, in proportion to the size of the bank.

    Each category hands every test floor(n / TESTS) questions, and its
    remainder is dealt round-robin from a running position that carries on
    between categories. Because the remainders add up to a whole multiple of
    TESTS, every test ends up with the same total.
    """
    problems = []
    if len(rows) != TARGET_TOTAL:
        problems.append(f"bank holds {len(rows)}, needs exactly {TARGET_TOTAL} "
                        f"({TESTS} tests of {TEST_SIZE})")
        return problems

    by_category = {}
    for row in rows:
        by_category.setdefault(row[2], []).append(row)

    quota = {}
    cursor = 0
    for category in sorted(by_category):
        supply = len(by_category[category])
        if supply < TESTS:
            problems.append(f"{category}: {supply} questions cannot cover {TESTS} tests")
            return problems
        quota[category] = [supply // TESTS] * TESTS
        for _ in range(supply % TESTS):
            quota[category][cursor % TESTS] += 1
            cursor += 1

    rng = random.Random(SEED + 1)
    for category in sorted(by_category):
        pool = list(by_category[category])
        rng.shuffle(pool)
        at = 0
        for test in range(TESTS):
            for _ in range(quota[category][test]):
                pool[at][1] = test + 1
                at += 1

    sizes = {}
    spread = {}
    for row in rows:
        sizes[row[1]] = sizes.get(row[1], 0) + 1
        spread.setdefault(row[1], set()).add(row[2])

    for test in range(1, TESTS + 1):
        if sizes.get(test) != TEST_SIZE:
            problems.append(f"test {test} holds {sizes.get(test, 0)} questions, not {TEST_SIZE}")
        if spread.get(test, set()) != CATEGORIES:
            missing = sorted(CATEGORIES - spread.get(test, set()))
            problems.append(f"test {test} is missing {', '.join(missing)}")

    return problems


def report(rows, problems):
    print(f"questions: {len(rows)}")

    by_category = {}
    by_letter = {letter: 0 for letter in LETTERS}
    for row in rows:
        by_category[row[2]] = by_category.get(row[2], 0) + 1
        by_letter[row[8]] += 1

    print("\nby category")
    for name in sorted(by_category, key=lambda k: -by_category[k]):
        n = by_category[name]
        per_test = n / TESTS
        print(f"  {name:<22} {n:>5}  {n / len(rows):6.1%}   {per_test:4.1f} per test")

    print("\nanswer letters")
    for letter in LETTERS:
        n = by_letter[letter]
        print(f"  {letter} {n:>5}  {n / len(rows):6.1%}")

    if rows:
        counts = [len(row[9].split()) for row in rows]
        print(f"\nexplanation words: min {min(counts)}, max {max(counts)}, "
              f"mean {sum(counts) / len(counts):.0f}")

    numbered = [row for row in rows if row[1]]
    print(f"\nmock tests: {len({row[1] for row in numbered})} of {TESTS}, "
          f"{len(numbered)} questions dealt")

    if problems:
        print(f"\n{len(problems)} PROBLEM(S):")
        for line in problems[:60]:
            print("  " + line)
        if len(problems) > 60:
            print(f"  … and {len(problems) - 60} more")
    else:
        print("\nvalidation: clean")


def main():
    rows, problems = build(load_batches())
    problems += deal_tests(rows)

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

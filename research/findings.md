# Fact-check and coverage review of the question bank

Reviewed 20 September 2026 against `data/questions.csv` (1,058 questions).

Research was carried out by a delegated agent; the corrections were then re-checked and
applied by the main session. This file records what was actually established, and how
strongly, so that a later reader can tell verified fact from unverified inference.

## How much confidence to place in this

**No primary source was read.** `WebFetch` returns `EGRESS_BLOCKED` for every domain in
this environment, and direct `curl` to gov.uk, parliament.uk and senedd.wales is refused by
the egress proxy under organisation policy. `WebSearch` works, because it runs server-side,
and returns result titles, URLs and a synthesised summary.

Everything below therefore rests on search summaries rather than on documents anyone
opened. URLs in `corrections.json` are provenance for the claim, **not pages that were
read**. Before publishing, someone with unrestricted network access should re-verify the
corrections against the primary sources.

Evidence grades used below:

- **Verified** — confirmed by the main session in its own independent search, separate from
  the research agent's.
- **Corroborated** — two or more independently worded searches by the research agent agreed,
  and the claim is consistent with the main session's own knowledge.
- **Unverified** — plausible and directionally supported, but not independently confirmed.

Scale of the pass: 31 searches, 118 distinct claims checked, all 1,058 questions and their
answer keys read, roughly 60 explanations read in full.

## Corrections applied

Seven changes, covering five distinct false claims. **No wrong answer key was found** — every
question's designated correct answer was and remains correct. All errors were in
explanations, except one answer option that had gone stale.

| id | What was wrong | Now says | Evidence |
| --- | --- | --- | --- |
| 811 | "the Scottish Parliament and the Senedd use an additional member system" | Scotland still uses AMS; the Senedd "has been elected by a closed-list proportional system since 2026" | Corroborated |
| 818 | "a limited number of hereditary peers remain following reform" (present tense) | "The remaining hereditary peers lost the right to sit under an Act of 2026" | **Verified** |
| 819 | "hereditary peers retained seats after reform in 1999" (reads as current) | "retained seats after the reform of 1999 but lost them under an Act of 2026" | **Verified** |
| 131 | option "About 67 million" | "About 69 million" | Unverified |
| 131 | explanation "in the region of 67 million people" | "in the region of 69 million people" | Unverified |
| 111 | explanation "in the region of 67 million" | "in the region of 69 million" | Unverified |
| 707 | England prescription exemption for "people over sixty" | "people aged sixty or over" | Corroborated |

A fourth population claim the research agent missed — `batch_11`, "from around fifty million
to roughly sixty-seven million" — was found during application and changed to
"sixty-nine million" so the bank stays internally consistent.

### The two that mattered

Both are **2026 constitutional changes that post-date the model's knowledge**, which is
precisely the class of error that writing from model knowledge alone cannot catch.

**House of Lords.** The House of Lords (Hereditary Peers) Act 2026 received Royal Assent on
18 March 2026, and hereditary peers ceased to sit at the end of the 2024–26 session on
29 April 2026, ending more than 700 years of hereditary membership. Of the 92 excepted
hereditary peers, eight already held life peerages and 26 more were subsequently granted
them. The House is now life peers plus the 26 Lords Spiritual. Confirmed by the main
session against House of Lords Library, House of Commons Library and legislation.gov.uk
results. This made q819's *answer* ("They are appointed as life peers") more strongly
correct, not less — only the surrounding gloss was wrong.

**The Senedd.** The Senedd Cymru (Members and Elections) Act 2024 replaced the additional
member system with a closed-list proportional system (D'Hondt), 16 constituencies returning
six members each, and increased membership from 60 to 96, effective at the election of
7 May 2026. Not independently re-verified by the main session because the session's search
quota was exhausted, but consistent with its own knowledge of the 2024 Act.

Worth recording: the Senedd's **size** was flagged in advance as the likeliest error in the
bank. It turned out the bank never states a Senedd size anywhere — greps for "sixty
members", "96", "ninety-six" and similar found nothing. The only legislature sizes stated
are 650 MPs, 129 MSPs and 90 MLAs, all correct. The real Senedd error was the *voting
system*, which nobody had flagged. The predicted error did not exist; an unpredicted one did.

## Checked and confirmed correct

Test administration: 24 questions, 45 minutes, 75% pass mark (18/24), booking at least three
days ahead, registered test centre, photo ID and proof of address, non-refundable fee, age
exemptions under 18 and 65+, B1 CEFR for naturalisation.

Institutions and numbers: 650 MPs, 129 MSPs elected by AMS, 90 MLAs elected by STV, 26 Lords
Spiritual, juries of 12 in England/Wales/Northern Ireland and 15 in Scotland, 14 British
overseas territories, 15 national parks (10 England, 3 Wales, 2 Scotland, none in Northern
Ireland), "more than thirty" World Heritage Sites, and the 84/8/5/3 per cent population
split between the four nations.

The overseas-territories count was specifically re-checked against the Chagos/BIOT question:
the implementing bill fell at the April 2026 prorogation and the treaty is not in force, so
14 stands.

**History appears clean.** Every History question containing a year, century or era marker —
142 questions — was reviewed, and no date error was found. Every error in the bank was in
contemporary civics, not history.

No abolished or renamed body appears in the bank. Roughly 35 defunct organisations were
searched for (Public Health England, the IPCC, the Criminal Records Bureau, the UK Border
Agency, the Audit Commission and others); none is mentioned.

## Could not verify

- Everything, at primary-source level — see the caveat at the top.
- Whether the Representation of the People Bill received Royal Assent in the days before
  20 September 2026. Lords second reading was 14 September 2026; no assent found. Treated as
  not law. **Re-check before publishing.**
- The exact commencement date of the Tobacco and Vapes Act generational ban (reported as
  1 January 2027, secondary sources only).
- The precise UK-only World Heritage Site count; sources disagree on whether overseas
  territories are included. Immaterial, because the bank says "more than thirty", which is
  true on any count.

## Time bombs: correct today, wrong soon

These are **not** errors and were deliberately left alone. Diarise them.

1. **Voting age** (q49, q71, q851, q865). "18 or over" is correct today. The Representation
   of the People Bill would lower it to 16. If it passes, four questions need rewriting.
2. **English language level** (q31, q57). B1 is correct for naturalisation now, and q13 asks
   specifically about naturalisation so it is safe. The **settlement** requirement is
   reported to rise to B2 on 26 March 2027, at which point the two questions that say
   "settlement or naturalisation" become half-wrong.
3. **Tobacco age** (q591). "18" holds until 1 January 2027, when the first cohort covered by
   the generational ban turns 18 and the flat answer "18" stops being complete.
4. **The official handbook is frozen in 2013.** It still refers to the Queen and to the
   National Citizen Service, which ceased delivery on 31 March 2025. Our bank is deliberately
   more current than the study material candidates are tested against. The recommendation is
   to keep it factually current rather than regress it to match the handbook — and, notably,
   **not** to add National Citizen Service questions despite the handbook covering it.

## Wording worth revisiting

Not errors; judgement calls.

- **q196**, "last successful invasion of England from abroad" → 1066. Historians commonly
  describe William of Orange's 1688 landing as the last successful invasion. The handbook
  supports 1066, so it is defensible for test purposes, but a well-read candidate could object.
- **q518**, "Which British scientists helped discover the structure of DNA" → Crick and
  Watson. Watson is American. "Scientists working in Britain" would be tighter.
- **q695, q758, q759, q147** use Snowdonia, Brecon Beacons and Snowdon. These were officially
  renamed Eryri (2022), Bannau Brycheiniog (2023) and Yr Wyddfa. The handbook still uses the
  English names, so these are not errors, but the Welsh names could be given alongside.
- **q94**, Scottish banknotes "valid across the UK", matches the handbook's own formulation.
  Strictly they are not legal tender in England and Wales and no trader must accept them.
  Defensible as it stands; do not tighten it into a legal-tender claim.
- **q131**, the population option. "About 69 million" tracks the current estimate; "About 70
  million" would age more slowly. Either keeps the answer key at C.

## Coverage gaps

The bank is 38% History. In the handbook, chapter 3 is the longest, but chapters 4 and 5
generate most test questions and chapter 4 has the widest factual surface. The bank is
over-weighted to history and thin on chapters 2 and 4. **Accuracy is not the weakness;
balance is.**

Roughly 60–65 further questions are suggested, concentrated in Modern Society and Government
and Law:

| Topic | Now | Suggested |
| --- | --- | --- |
| Senedd size and electoral system | 0 | 6 |
| House of Lords after the 2026 Act | 0 | 4 |
| Devolution detail | 16 | +8 |
| Money, banking and tax administration | 3 | 6 |
| Currency: notes and coins | 1 | 5 |
| Leisure: pubs, licensing, TV licence | 3 | 5 |
| Legal aid, small claims, ombudsmen, Citizens Advice | 7 | 5 |
| Benefits, Jobcentre Plus, employment support | 2 | 4 |
| Police and Crime Commissioners, Hansard, visiting Parliament | 5 | 4 |
| Six Nations, the Ashes, London 2012 | 7 | 4 |
| The Commonwealth as an institution (56 members) | 0 numeric | 3 |
| Gambling and betting | 0 | 3 |
| Eisteddfod, Notting Hill Carnival, Burns Night | 6 | 3 |
| Money laundering and proceeds of crime | 0 | 2 |

The two at the top are the strongest candidates: they are freshly verified, currently absent,
and the Senedd's new system is among the most commonly mis-stated facts in UK civics.

## Follow-up pass: questions that were wrong or unsound (20 September 2026)

A second review fixed the items flagged above as doubtful, plus defects found by a
structural scan of the bank that the build validator does not catch.

**Factually wrong**

- **q518** asked for "British scientists" who discovered the structure of DNA, but James
  Watson is American. Reworded to "scientists working in Britain", and the explanation now
  names Crick as English and Watson as an American working in Britain.
- **q196** claimed 1066 was "the last successful invasion of England from abroad". Many
  historians describe William of Orange's 1688 landing the same way. The question now asks
  for the last occasion a foreign army conquered England **and replaced its ruling class**,
  which selects 1066 unambiguously, and the explanation acknowledges 1688. The same absolute
  claim in the Battle of Hastings explanation was softened to "last conquest of England by a
  foreign army".

**Duplicate**

- **q27 and q985** were the same question about the good character requirement, differing
  only by "for" versus "in" — close enough to escape the duplicate check, which normalises
  punctuation but not wording. q985 was rewritten to ask which conduct counts *against* an
  applicant, with the explanation rewritten to match.

**Guessable without knowing the answer**

A scan compared the length of each correct option against the mean of its three distractors.
267 questions had a correct option more than 1.9 times longer, which lets a test-wise
candidate pick the longest option. The worst was q631, where the correct answer was a full
sentence and all three distractors were single words — a ratio of 10.2.

Twelve of the worst were rebalanced (q631, q925, q926, q911, q951, q934, q520, q774, q863,
q865, q151, q418), either by shortening the correct option and moving the detail into the
explanation, or by lengthening the distractors. Nothing now exceeds a ratio of 3.0.

**253 questions remain in the mild 1.9–2.5 band and were left alone.** That is a soft signal
rather than a defect, and rewriting them all in bulk would risk introducing errors for
little gain. Worth revisiting selectively if the bank is ever expanded.

**Advisory**

- The national parks explanation now gives Eryri and Bannau Brycheiniog alongside Snowdonia
  and the Brecon Beacons, which have been their official names since 2022 and 2023. The
  English names are kept because the handbook and the test still use them.

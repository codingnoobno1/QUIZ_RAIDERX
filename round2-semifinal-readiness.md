# PIXEL QuizQuest — Round 2 & Semi-Final readiness

Required features versus what the platform supports today.
Written 18 September 2026. Every "supported" claim below was checked in the code or probed against the live site; nothing is taken from a status report.

---

## Legend

| Mark | Meaning |
|:--:|---|
| ✅ | Built **and deployed** to `pixelquizraiderx.netlify.app` |
| 🟡 | Built, **not deployed** (in a branch, or in an app nobody has installed) |
| 🟠 | Partly there — usable with manual work or a workaround |
| ❌ | Not built |

## Where the three pieces actually stand

| Piece | State | Consequence |
|---|---|---|
| **Engine** (QUIZ_RAIDERX) | Live | The rules, scoring and APIs are running |
| **Admin console** (std) | **No git remote, never deployed** | **There is no organiser portal in existence right now.** Everything in the admin matrices is local-only |
| **Mobile app** (Flutter) | Branch pushed, no PR merged, **no APK built** (disk full) | Nobody can install it yet |
| **Web portal** (participant, on RAIDERX) | Live, **but on the old v1 contract** | Laptops get every correct answer sent to them (see R2-14) |

---

## A. Round 2 — participant experience

| # | Required | Status | Where it stands |
|---|---|:--:|---|
| R2-1 | Team login | ✅ | Registration + login exist on web and app |
| R2-2 | Question display with 4 options | ✅ | Both clients |
| R2-3 | Next / previous navigation | 🟠 | The self-paced quiz shows every question in one scrolling list, so teams can move freely and change answers. There are no explicit Next/Prev buttons |
| R2-4 | **30-minute round timer** | ❌ | No round-level deadline exists. Timers are **per question** (rapid fire) or absent (self-paced). Nothing stops a team at 30:00 |
| R2-5 | Submit button | ✅ | Blocked until every question is answered |
| R2-6 | Submission confirmation | ✅ | Result screen with the server's score |
| R2-7 | **Power-question unlock status** | ❌ | No concept of power questions anywhere |

## B. Round 2 — question engine and scoring

| # | Required | Status | Where it stands |
|---|---|:--:|---|
| R2-8 | 60-question master bank | 🟠 | Questions live **inside one activity**, not in a reusable bank. 60 can be stored; they can't be drawn from |
| R2-9 | **Difficulty tags (Easy / Medium / Hard)** | ❌ | A question has text, options, answer, points, image. **No difficulty field** |
| R2-10 | **Per-team generation: 23 from 60 (8E / 10M / 5H)** | ❌ | Every participant receives the **same** question list. No selection logic exists |
| R2-11 | **Randomised question order per team** | ❌ | A `shuffle` flag is stored and read into the app, then **never used**. Everyone sees identical order |
| R2-12 | **Randomised option order per team** | ❌ | Not implemented |
| R2-13 | Scoring +5 / +11 / +20 | 🟠 | Points are **per question**, so the three values can be entered by hand. They can't follow difficulty automatically, because difficulty doesn't exist |
| R2-14 | Answers hidden from participants | 🟠 | **Mobile app: yes** (v2 withholds them). **Web/laptop: no** — the web client still requests v1, receives every `correctAnswer`, and grades locally. Anyone who opens the network tab, or the console, can see the answer key |
| R2-15 | One attempt per team | 🟠 | Enforced for the app (v2). The web client still uses v1, which keeps the **best of unlimited retries** |
| R2-16 | Team-level scoring (not per person) | 🟡 | Built: team scope with one attempt per team, enforced by a database constraint. Needs the v2 client, so web can't use it yet |
| R2-17 | **Power questions: +25 if submitted before cutoff** | ❌ | Not built. The raw material exists — `submittedAt` and `timeTakenSeconds` are stored per submission |
| R2-18 | 250-point regular maximum | ✅ | Falls out of per-question points |

## C. Round 2 — admin portal

| # | Required | Status | Where it stands |
|---|---|:--:|---|
| R2-19 | Team list | 🟡 | `admin/events/teams` is live on the engine; the console that shows it is undeployed |
| R2-20 | Team login / status | 🟠 | Registration and door check-in are visible. **No "who is online now"** |
| R2-21 | Start round | 🟡 | Activate/stop exists, one activity at a time |
| R2-22 | Round timer control | ❌ | Same gap as R2-4 |
| R2-23 | Question-bank management | 🟠 | Questions can be created and edited on an activity. No bank, no difficulty, no import (the importer was not ported) |
| R2-24 | Automatic scoring | ✅ | Server-side, against the stored answer |
| R2-25 | Submission timestamps | ✅ | Stored and shown in the submissions report |
| R2-26 | Power-question eligibility | ❌ | Depends on R2-17 |
| R2-27 | Individual team scores | 🟡 | Submissions report, ranked, with the per-question breakdown |
| R2-28 | Final ranking | 🟡 | Leaderboard endpoint, team or individual |
| R2-29 | Tie-break ranking | 🟠 | Ties break on **accumulated answer time**, measured server-side. That is a rule, not the PDF's tie-break round |
| R2-30 | **Top-6 identification / advancement** | ❌ | No notion of advancing. The organiser can read the top 6 off the board manually |

---

## D. Semi-final — participant devices and projector

| # | Required | Status | Where it stands |
|---|---|:--:|---|
| SF-1 | Question + options on the team device | 🟡 | The host-paced round screen, in the app |
| SF-2 | Live timer on the device | 🟡 | Counts down to a **server instant**, corrected for each phone's clock |
| SF-3 | Answer controls | 🟡 | One tap, locked once sent |
| SF-4 | **Projector: title card, current team, value, live timer, leaderboard, next team** | ❌ | **No projector view exists at all.** Designed in `buzzer-round.md`, not built |

## E. Semi-final — admin control

| # | Required | Status | Where it stands |
|---|---|:--:|---|
| SF-5 | Select which team is up | 🟡 | Questions can be targeted at chosen teams; everyone else watches |
| SF-6 | **Team chooses its difficulty; host locks the choice** | ❌ | No difficulty-selection flow |
| SF-7 | Serve question | 🟡 | `OPEN_QUESTION` |
| SF-8 | Start timer | 🟡 | The deadline is written when the question opens |
| SF-9 | Stop timer | 🟡 | `LOCK_QUESTION`; it also **auto-closes** at the deadline with no host action |
| SF-10 | **Mark answer correct / wrong by hand** | ❌ | Grading is automatic from the tapped option. There is no spoken-answer mode and no host verdict |
| SF-11 | **Mark skip** | ❌ | Not built |
| SF-12 | Scoring +100 / +150 / +200 | 🟠 | Achievable by setting per-question points by hand |
| SF-13 | **Wrong answer −50** | ❌ | A wrong answer scores **0**. Negative scoring does not exist |
| SF-14 | Skip = 0 | 🟠 | Not answering scores 0, but "skip" isn't a recorded decision |
| SF-15 | Live ranking after every turn | 🟡 | Leaderboard updates as answers land |

## F. Semi-final — tie-break and Impossible Challenge

| # | Required | Status | Where it stands |
|---|---|:--:|---|
| SF-16 | Tie-break mode | 🟠 | The same question can be re-opened to two chosen teams, and each opening is a clean round. There is **no tie-break mode, no automatic detection of a tied 4th place, and no reserve question pool** |
| SF-17 | Same question to tied teams, same timer, simultaneous | 🟡 | Targeting several teams at once already does this |
| SF-18 | Repeat until resolved | 🟠 | The host repeats it manually |
| SF-19 | Reserve tie-break question pool | ❌ | Not built |
| SF-20 | **Impossible Challenge: one question, all six teams, 300 points** | 🟡 | A question opened to everyone with 300 points does exactly this |
| SF-21 | Synchronised timer across devices | 🟠 | The design is sound — one absolute deadline, clock-skew corrected. **The live site's response times undermine it** (see X-3) |
| SF-22 | Simultaneous submit, reveal, final leaderboard | 🟡 | Reveal is a host command; correctness is withheld until then |

---

## G. Cross-cutting

| # | Concern | Status | Notes |
|---|---|:--:|---|
| X-1 | 12 teams at once | ✅ | Well within limits |
| X-2 | Session length | ❌ | **The login token lasts 15 minutes.** A 30-minute round outlives it, and teams will start being refused mid-quiz |
| X-3 | **Response time** | ❌ | Status polling measured **2–8 seconds** in production, and a cold request took **17.5 s**. The semi-final's synchronised timing assumes well under a second |
| X-4 | Participant data exposure | ❌ | `GET /api/events/register?email=` needs **no login** and returns full registration records — emails, enrolment numbers, semesters — for any address |
| X-5 | Laptop support | 🟠 | Laptops use the **web portal**, which is the v1 client: it gets the answers and grades locally. **Your preferred hardware is the weaker path today** |
| X-6 | Spare devices | — | Logistics: 12 + 2 spares is right. Put every device on the same venue Wi-Fi |

---

## Summary

| Area | ✅ Live | 🟡 Built, undeployed | 🟠 Partial | ❌ Missing |
|---|:--:|:--:|:--:|:--:|
| Round 2 participant | 4 | 0 | 1 | 2 |
| Round 2 engine & scoring | 1 | 1 | 5 | 4 |
| Round 2 admin | 2 | 4 | 4 | 2 |
| Semi-final devices & projector | 0 | 3 | 0 | 1 |
| Semi-final admin | 0 | 5 | 3 | 3 |
| Tie-break & Impossible | 0 | 3 | 3 | 1 |
| Cross-cutting | 1 | 0 | 2 | 3 |
| **Total** | **8** | **16** | **18** | **16** |

**The headline:** the semi-final is mostly *built but undeployed*, while Round 2 has genuine *missing engine features* — difficulty, per-team generation, randomisation, the round timer and power questions. Round 2 is the larger build, even though it looks like the simpler round.

---

## What blocks each round

### Round 2 cannot run today without

| Gap | Why it blocks | Size |
|---|---|:--:|
| R2-9, R2-10, R2-11, R2-12 — difficulty, per-team generation, both randomisations | The PDF's core requirement. Right now every team gets an identical, identically ordered paper | L |
| R2-4 — 30-minute round timer | The round has no end | M |
| R2-17, R2-7 — power questions and their unlock state | A scoring rule with no implementation | M |
| X-2 — 15-minute token | Teams get signed out mid-round | S |
| R2-14, R2-15 — web client on v1 | Answers are delivered to the laptops, and retakes are unlimited | M |
| **Admin console deployed anywhere** | There is no organiser portal to run the round from | M |
| R2-30 — top 6 | Can be read off the board by hand | S |

### Semi-final cannot run today without

| Gap | Why it blocks | Size |
|---|---|:--:|
| SF-4 — projector view | A stated part of the format | M |
| SF-6 — difficulty choice and lock | Decides the question and its value | M |
| SF-10, SF-11 — host marks correct / wrong / skip | Without it, only tapped multiple-choice works, not a spoken round | M |
| SF-13 — −50 for a wrong answer | Scoring is wrong without it | S |
| SF-16, SF-19 — tie-break mode and reserve pool | Otherwise the host improvises | M |
| X-3 — response times | Simultaneity is the whole point of the Impossible Challenge | ? |
| App installed on 6 devices | No build exists yet | S |

Size: **S** under a day · **M** a day or two · **L** several days · **?** unknown until the hosting is diagnosed.

---

## Hardware

Your plan is sound: **12 devices + 2 spares**, laptops preferred, same venue Wi-Fi.

One correction to the assumption behind it. **Laptops today are the less secure option.** The strict client — no answers sent, server-graded, one attempt per team — is the mobile app. Laptops use the web portal, which still runs the old contract. Either move the web client to v2 (roughly a day) or run Round 2 on phones with the app.

Given the measured response times, I would rehearse with the real number of devices on the venue Wi-Fi before committing to any synchronised round.

---

## What I verified, and what I didn't

**Verified:** every status above was read in the current code, and the live endpoints were probed. Specifically confirmed: no difficulty field; the shuffle flag is read and never applied; the self-paced quiz has no timer; a wrong answer scores 0 with no penalty path; no projector page exists; the live command set is open/lock/reveal/next/end; std has no git remote; the web client omits `v=2` and grades with `q.correctAnswer`.

**Not verified:** nothing has been run end to end with real teams on real devices, response times were sampled rather than load-tested, and no timing has been measured on the venue's network.

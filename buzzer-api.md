# Electric Answers: the RAIDERX API plan

> Engine-side plan for `quizType: 'buzzer'`. Written 22 September 2026.
> Companion to `buzzer-round.md` — this replaces the sketch in its §9 with something buildable.
> Engine: this repo, deployed at `https://pixelquizraiderx.netlify.app`.

---

## 0. Where it stands today

| Repo | Electric Answers | Evidence |
|---|---|---|
| **app** (`D:\PXEL\pixel_event_app`) | **Built, dark.** Model, arena screen, lobby card, service calls, refusal copy, retry-proofed presses, tests | `lib/models/buzzer_round.dart`, `lib/screens/events/modes/electric_answers_screen.dart` (604 lines), `test/buzzer_round_test.dart`, `test/buzzer_retry_test.dart`, commit `2a1ecd8` |
| **RAIDERX** (this repo) | **Nothing.** One word, in a comment | `grep -ri buzzer src` → `src/lib/live/rounds.js:415` only |
| **std** (`D:\PXEL\std`) | **Nothing.** No console, no leaderboard breakdown | `grep -ri buzzer src` → no hits |

The client is ahead of the engine. **The API contract is therefore not open for design — the shipped Flutter client fixes it.** Every key below is one the Dart parser reads. Renaming one means shipping a new app build.

---

## 1. The rule this plan obeys

std never writes engine collections; it calls RAIDERX (`CODEX_TASK_raiderx-api.md`). `buzz_presses` and `buzz_attempts` are engine collections. The host console in std reaches them only through `/api/host/live` → `/api/events/live/command`.

---

## 2. What the built client forces

From `lib/models/buzzer_round.dart` and `electric_answers_screen.dart`:

- The buzzer block lives at `data.activeActivity.quiz.buzzer` — `QuizData.fromJson` reads `json['buzzer']`.
- Phases are exactly `lobby staged countdown buzzing seated judged_correct judged_wrong no_buzz revealed completed`.
- `armsAt`, `buzzClosesAt`, `answerEndsAt` are parsed with `DateTime.tryParse` then `.toUtc()` → **ISO-8601 with a zone**. A bare local-time string is silently read as local and the countdown is wrong by the offset.
- `question.type` is matched against **`mcq`, `truefalse`, `fillup`**. Anything else renders read-only. The stored `QuestionSchema.type` in this repo is `choice | text`, so the payload builder must **normalise**: `choice → mcq`, `text → fillup`, `truefalse` passes through once it can be stored.
- `correctAnswer` is read **only** from `reveal.correctAnswer`, and **only** while the phase is `revealed` or `completed`. The client deliberately refuses to parse an answer off `question`.
- Refusals must carry a JSON body with a `code` field — `ApiException.code` is `data['code']`. The client already has copy for `NOT_LEADER`, `NOT_ELIGIBLE`, `FALSE_START`, `LOCKED_OUT`, `BUZZ_CLOSED`, `ALREADY_PRESSED`, `STALE_QUESTION`, `NOT_YOUR_SEAT`, `SPOKEN_MODE`, `TOO_LATE`, `ALREADY_ANSWERED`.
- The client derives `countdown → buzzing` and `→ no_buzz` itself, from `armsAt`/`buzzClosesAt` (`BuzzerRound.phaseAt`). The server must derive the same way from the same instants, or the button lights at two different moments.
- Press body `{activityId, instanceId}`; answer body `{activityId, instanceId, answer}`. Both sent with `retry: false` and 5-second timeouts — a press is never replayed.
- The client fast-polls (500 ms) while the phase is `staged`, `countdown`, `buzzing` or `seated`.

---

## 3. Schema (PR 1)

### `src/models/EventActivity.js`

```js
quizType: { type: String, enum: ['rapid_fire','custom_live','preloaded','kbc','buzzer'], default: 'rapid_fire' },
```

Inline `QuestionSchema` — widen, never replace, so existing questions stay valid:

```js
type: { type: String, enum: ['choice','text','mcq','truefalse','fillup'], default: 'choice' },
acceptedAnswers: [{ type: String }],        // fill-up: every spelling the grader accepts
source: { type: String, enum: ['pack','spot'], default: 'pack' },
```

`correctAnswer` is `required: true` today. A spoken on-the-spot question has no stored answer, so it becomes conditional:

```js
correctAnswer: { type: String, required: function () { return this.source !== 'spot'; } },
```

New subtree `quiz.buzzer`, shaped as `buzzer-round.md` §8, plus one addition:

```js
buzzer: {
  answerMode: { type: String, enum: ['in_app','spoken'], default: 'in_app' },
  countdownSeconds: { type: Number, default: 3 },
  buzzWindowSeconds: { type: Number, default: 10 },
  answerSeconds:     { type: Number, default: 15 },
  wrongPenalty: { type: Number, default: 0 },
  passPoints:   { type: Number, default: null },     // null = question.points
  falseStartLockout: { type: Boolean, default: true },
  tieScope: { type: String, enum: ['first','podium'], default: 'first' },
  latencyCompensation: { type: Boolean, default: false },
  teamIds: [{ type: String }],                        // empty = every registered team
  answerers: [{ teamId: String, email: String }],

  round: {
    instanceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    questionIndex: { type: Number, default: 0 },
    phase: { type: String, enum: [/* the ten above */], default: 'lobby' },
    answerMode: { type: String, enum: ['in_app','spoken'], default: 'in_app' },
    showOptionsBeforeBuzz: { type: Boolean, default: true },
    stagedAt: Date, armsAt: Date, buzzClosesAt: Date,
    eligibleTeamIds: [String], lockedOutTeamIds: [String], attemptedTeamIds: [String],
    seat: { teamId: String, teamName: String, leaderEmail: String, leaderName: String,
            pressedAt: Date, attempt: Number, answerEndsAt: Date,
            answeredAt: Date, submittedAnswer: String },
    isTiebreak: { type: Boolean, default: false },
  },

  /**
   * ADDITION to the §8 sketch: the scoreboard, denormalised.
   *
   * Every phone polls twice a second and the client reads `scoreboard` on
   * every payload. Aggregating buzz_attempts per poll would put one
   * aggregation per phone per 500 ms on Atlas for the length of the round.
   * Standings change only when a seat is judged — a host action, a few times a
   * minute — so they are recomputed on that write and read straight off the
   * activity document.
   */
  standings: [{ teamId: String, teamName: String, score: Number, tiebreakWins: Number }],
  standingsAt: Date,
}
```

**Mongoose drops unknown fields silently.** std keeps its own copy of this schema; when `quiz.buzzer` lands here it must land there in the same breath, or std writes a seat that never persists — the `external.scores` failure again.

### `src/models/BuzzPress.js`, `src/models/BuzzAttempt.js`

Modelled on `LiveAnswer`:

```js
// buzz_presses — the queue
{ activityId, eventId, instanceId, questionIndex, teamId, teamKey, teamName,
  participantId, email, name, receivedAt, offsetMs, falseStart }
index { instanceId: 1, teamKey: 1 }   unique   name 'uniq_buzz_press_team'
index { instanceId: 1, receivedAt: 1 }         // the queue, in arrival order
index { activityId: 1 }

// buzz_attempts — where scores come from, one row per seat
{ activityId, eventId, instanceId, questionIndex, teamId, teamName, attempt,
  answerMode, submittedAnswer, judgedBy /* 'auto' | host email */,
  outcome /* correct | wrong | timeout */, points, isTiebreak, decidedAt }
index { instanceId: 1, teamId: 1 }    unique   name 'uniq_buzz_attempt_team'
index { activityId: 1, teamId: 1 }             // the standings rollup
```

`teamKey` mirrors `teamId` so the unique index can be partial on its presence, exactly as `LiveAnswer` does it.

---

## 4. The machine (PR 2) — `src/lib/buzzer/machine.js`

Its own file, next to `lib/kbc/machine.js` and `lib/live/rounds.js`, and shaped like them: `PHASE`, `COMMAND`, `ALLOWED_FROM`, `NEXT_PHASE`, `GUARDS`, and `canRunBuzzer(command, quiz, payload)` → `{ ok, nextPhase } | { ok: false, reason }`.

Two things it must own, because server and client both compute them:

```js
/** countdown → buzzing → no_buzz, derived from instants. Mirrors
 *  effectiveRoundState() for liveRound, and BuzzerRound.phaseAt() on the app. */
export function effectiveBuzzerPhase(round, now = new Date()) { ... }

/** Fill-up grading: trim, lowercase, collapse whitespace, both sides.
 *  Matches correctAnswer plus acceptedAnswers. */
export function gradeBuzzerAnswer(question, answer) { ... }
```

Tests: the legality table, both derived transitions across their boundary instants, false-start classification, fill-up normalisation, and **the seat claim under concurrent presses** — fire N presses from one `Promise.all` against a live instance and assert exactly one `seated: true` and N−1 queued rows in arrival order.

---

## 5. Participant endpoints (PR 3)

All authenticate with `requireEventUser(req)` — the `pxe_event_session` cookie, the NextAuth session, or a bearer. Team and leadership come from `resolveParticipantTeam(eventId, email)`; the body never names a team, and `isLeader` is never taken from the phone.

### 5.1 `GET /api/flutter/events/status?eventId=&participantId=&v=2`

A `buzzer` branch beside the `kbc` and `custom_live` ones, built by a new `src/lib/buzzer/viewerPayload.js` (the `kbc/viewerPayload.js` pattern), landing at `data.activeActivity.quiz.buzzer`:

```jsonc
{
  "phase": "buzzing",
  "instanceId": "66f...",
  "question": { "text": "...", "type": "mcq", "options": ["A","B","C","D"] },
  "armsAt": "2026-09-22T12:00:03.000Z",
  "buzzClosesAt": "2026-09-22T12:00:13.000Z",
  "answerEndsAt": null,
  "answerMode": "in_app",
  "isTiebreak": false,
  "myTeam": { "teamId": "t1", "teamName": "Kernel Panic", "leaderName": "Priya" },
  "amLeader": true,
  "canBuzz": true,
  "lockedOut": false,
  "myQueuePosition": null,
  "seat": null,
  "mySeat": false,
  "scoreboard": [{ "teamId": "t1", "teamName": "Kernel Panic", "score": 40, "tiebreakWins": 0 }],
  "reveal": null
}
```

Rules:

- `question.options` is **omitted** while `showOptionsBeforeBuzz === false` and the phase is before `seated`. It appears for the seated team, and for everyone at reveal.
- `reveal` is non-null **only** in `revealed`/`completed`: `{ correctAnswer, outcomeByTeam: { [teamId]: 'correct'|'wrong'|'timeout' } }`.
- `canBuzz` = eligible ∧ leader (or the `answerers` override) ∧ not locked out ∧ not already pressed ∧ derived phase is `buzzing`. The client re-checks; the server is the guard.
- `mySeat` = `seat.teamId === myTeam.teamId`. `myQueuePosition` is 1-based among presses behind the seated one.
- No email in this payload, ever. `leaderName` only.
- `pollAfterMs`: **500** in `staged|countdown|buzzing|seated`, 2000 in `judged_*|no_buzz|revealed`, 10000 in `lobby|completed`.
- Cost budget, because this runs at 2 Hz per phone: one `EventActivity.findById().lean()` with a projection, one `resolveParticipantTeam` (indexed), and one `BuzzPress.find({instanceId}).select('teamId receivedAt').lean()` — at most one row per team. Standings come off the document (§3). No aggregation on this path.

### 5.2 `POST /api/flutter/events/buzzer/press`

Body `{ activityId, instanceId }`.

```js
const receivedAt = new Date();   // first line, before auth and before connectDB
```

Order: stamp → auth → load activity (lean, projected) → resolve team → legality → **atomic claim** (§9) → write the press row → respond.

| Refusal | HTTP | `code` |
|---|---|---|
| Not the team leader, and not the named answerer | 403 | `NOT_LEADER` |
| Solo entrant, or team not in `eligibleTeamIds` | 403 | `NOT_ELIGIBLE` |
| `receivedAt < armsAt` | 409 | `FALSE_START` |
| Team already in `lockedOutTeamIds` | 409 | `LOCKED_OUT` |
| `receivedAt ≥ buzzClosesAt`, or phase past `buzzing` | 409 | `BUZZ_CLOSED` |
| Duplicate key on `(instanceId, teamKey)` | 409 | `ALREADY_PRESSED` |
| `instanceId` is not the current round's | 409 | `STALE_QUESTION` |

Success: `200 { seated: true, offsetMs }` or `200 { seated: false, queuePosition, offsetMs }`.

A `FALSE_START` also `$addToSet`s the team into `lockedOutTeamIds` and writes a press row with `falseStart: true`, so the console can show who jumped.

### 5.3 `POST /api/flutter/events/buzzer/answer`

Body `{ activityId, instanceId, answer }`. In-app mode only, seated team's leader only. Grades with `gradeBuzzerAnswer`, writes the `buzz_attempts` row, moves the phase to `judged_correct`/`judged_wrong`, recomputes `standings`, and returns **`200 { recorded: true }` with no correctness** — the same withholding as `quiz/answer`.

| Refusal | HTTP | `code` |
|---|---|---|
| Not the seated team, or not its leader | 403 | `NOT_YOUR_SEAT` |
| `round.answerMode === 'spoken'` | 409 | `SPOKEN_MODE` |
| `now > seat.answerEndsAt` | 409 | `TOO_LATE` |
| `seat.answeredAt` already set, or duplicate attempt key | 409 | `ALREADY_ANSWERED` |
| `instanceId` mismatch | 409 | `STALE_QUESTION` |

A timed-out seat is not swept by anything: the host's `MARK_WRONG`/`PASS` records the `timeout` outcome. There is no scheduler on Netlify to do it unprompted (§10).

---

## 6. Host commands (PR 4) — `POST /api/events/live/command`

A third branch in the existing route, beside `kbc` and `custom_live`, `requireAdmin` as today, reached from std through `/api/host/live`.

| Command | Payload | From phase | Effect |
|---|---|---|---|
| `STAGE_QUESTION` | `{ questionIndex, answerMode?, showOptionsBeforeBuzz? }` | `lobby`, `revealed` | new `instanceId` and `stagedAt`, builds `eligibleTeamIds`, clears lockouts, attempts and seat |
| `INSERT_QUESTION` | `{ question, stage? }` | any | **appends** to `quiz.questions` (never inserts — rounds reference `questionIndex`), optionally stages it |
| `START_COUNTDOWN` | `{}` | `staged` | `armsAt = now + countdownSeconds`, `buzzClosesAt = armsAt + buzzWindowSeconds`, phase `countdown` |
| `MARK_CORRECT` / `MARK_WRONG` | `{}` | `seated`, `judged_*` | writes or overrides the attempt, applies `points` or `wrongPenalty`, recomputes standings |
| `PASS` | `{}` | `judged_wrong` | next team in the press queue takes the seat, fresh `answerEndsAt`, `attempt + 1` |
| `REBUZZ` | `{}` | `judged_wrong`, `no_buzz` | reopens buzzing for teams not in `attemptedTeamIds`, new `armsAt`/`buzzClosesAt`, same `instanceId` |
| `REVEAL` | `{}` | `judged_*`, `no_buzz` | phase `revealed` |
| `START_TIEBREAK` | `{ teamIds, questionIndex?, question? }` | `revealed` | new instance, `isTiebreak: true`, `eligibleTeamIds = teamIds` |
| `SET_ANSWERER` | `{ teamId, email }` | any | override for a team whose leader has no working phone |
| `END_GAME` | `{}` | `revealed` | phase `completed` |

Refusals reuse the existing shape: `409 { error, code: 'ILLEGAL_TRANSITION', phase }`.

**`GET /api/events/live/command?activityId=`** gains a buzzer branch returning what no participant may see: the correct answer, every press with `offsetMs` and `falseStart` sorted by arrival, the seat with its remaining window, the attempts so far, the standings, and `tiedTeams` per `tieScope`.

---

## 7. Arena display (PR 5) — `GET /api/events/[id]/arena`

Public, no auth, for the projector. The §5.1 payload minus `myTeam`, `amLeader`, `canBuzz`, `lockedOut`, `mySeat` and `myQueuePosition`, plus the leading presses by offset for the winner flash. Never an answer before reveal, never an email.

**Netlify specific:** this is the one route in the plan with no cookie and no session, which makes it the one route Next can statically optimise and the CDN can cache. A cached arena freezes the projector on a dead question.

```js
export const dynamic = 'force-dynamic';
// and on the response: headers: { 'Cache-Control': 'no-store, max-age=0' }
```

---

## 8. Scoring and tie-break (PR 5)

- Points come from `buzz_attempts`, summed per team. A negative `wrongPenalty` row needs no special case.
- `rankActivity()` in `src/lib/quiz/standings.js` gains a `fromBuzzAttempts(activityId)` branch, so the phone leaderboard, the console and std's advancement screen cannot disagree — the reason that function is shared today.
- Ranking: **score ↓, then tiebreakWins ↓, then total seat time ↑.**
- `tiedTeams` is computed on the console GET from `tieScope` (`first` = a tie at rank 1; `podium` = any tie inside the top 3). The console shows **Start tie-break** when it is non-empty. Nothing starts automatically.
- A tie-break win writes `tiebreakWins`, never score.

---

## 9. The seat claim, concretely

Two leaders press in the same millisecond; the database picks, not JavaScript.

```js
const claimed = await EventActivity.findOneAndUpdate(
  {
    _id: activityId,
    'quiz.buzzer.round.instanceId': instanceId,      // still this question
    'quiz.buzzer.round.phase': { $in: ['countdown', 'buzzing'] },
    'quiz.buzzer.round.seat.teamId': null,           // seat still empty
  },
  {
    $set: {
      'quiz.buzzer.round.phase': 'seated',
      'quiz.buzzer.round.seat': {
        teamId, teamName, leaderEmail, leaderName,
        pressedAt: receivedAt, attempt: 1,
        answerEndsAt: new Date(receivedAt.getTime() + answerSeconds * 1000),
      },
    },
  },
  { new: true },
);
// claimed === null → somebody else got there first: queue this press instead.
```

The press row is written **either way**; the queue is `buzz_presses` sorted by `receivedAt`. The unique `(instanceId, teamKey)` index — not a disabled button on a phone — is what makes a team's second press an `ALREADY_PRESSED`.

`phase` may be `countdown` in the filter because arming is derived from `armsAt` rather than written; the `receivedAt ≥ armsAt` check above it is what actually opens the window.

---

## 10. What Netlify decides for us

1. **No WebSockets, no SSE worth having.** Netlify's Next runtime is request/response functions. Polling at 500 ms is the design — which is exactly why the countdown is *one instant* (`armsAt`) rather than three commands (`buzzer-round.md` §4).
2. **No background scheduler.** `countdown → buzzing` and `buzzing → no_buzz` are derived on read. Nothing auto-passes a timed-out seat; the host presses Pass. A Netlify Scheduled Function runs at minute granularity — useless for a 15-second window.
3. **Cold starts.** The first press after a quiet minute can wait on a cold function and a cold Atlas connection. `receivedAt` is stamped on line 1, before `requireEventUser` and before `connectDB`, so that latency is never charged to a team's reaction time. `lib/mongo.js` already caches the connection across invocations.
4. **Function region vs Atlas region.** Every press pays one round trip to Atlas for the claim. If the function region and the cluster region differ, that is tens of milliseconds on every press. It does not change who wins — it is the same tax for everyone — but it eats the answer window. Worth confirming before the event.
5. **Load.** 12 teams × ~4 phones × 2 polls/s ≈ 96 invocations/s in the hot phases, plus the arena. Inside Netlify's limits, and the reason §5.1 has a cost budget and §3 denormalises the standings.
6. **Env parity.** `NEXTAUTH_SECRET` must be identical on both Netlify sites or std's proxied host commands are 401 (`CODEX_TASK_raiderx-api.md`).

---

## 11. Build order

| PR | Work | Files | Done when |
|---|---|---|---|
| 1 | Schema + collections | `models/EventActivity.js`, `models/BuzzPress.js`, `models/BuzzAttempt.js` | Indexes exist on Atlas; std's copy of the schema updated in the same PR |
| 2 | Machine + grading | `lib/buzzer/machine.js` + tests | Legality table, derived transitions and the concurrent-claim test are green |
| 3 | Participant API | `api/flutter/events/buzzer/press`, `.../answer`, `lib/buzzer/viewerPayload.js`, the status branch | The dark app build lights up against a local engine |
| 4 | Host commands + console state | `api/events/live/command/route.js` | A whole question runs end to end from curl |
| 5 | Arena, standings, tie-break | `api/events/[id]/arena`, `lib/quiz/standings.js` | Projector renders; leaderboard matches the console |

PRs 1–4 are the contract std (Codex) builds against. The app needs **nothing new** after PR 3 — it is already written against this shape.

---

## 12. Prerequisites, restated against today's code

| `buzzer-round.md` §12 | Now |
|---|---|
| Fix the 15-minute event session | **Done.** `SESSION.DURATION_MS` is 4 hours in `src/config/constants.js`, and `attachEventSession` takes both the JWT and the cookie from it |
| Ship the app build with live rounds and the team screen | **Open.** `feat/live-rounds-client`, unpushed |
| Commit and deploy the std console | **Open.** No git remote on `D:\PXEL\std` |
| Rotate the Atlas password, drop the hardcoded admin password from std's scripts | **Open** |
| *(new)* Push `feat/admin-api` | Local branch here; std's port is blocked on that deploy |

---

## 13. Decisions still needed

`buzzer-round.md` §14 is unanswered. PR 1 can be written against the bold defaults there (in-app answers, 0 penalty, full points on a pass, host chooses after the queue empties, options shown before the buzz, lockout without penalty, tie for 1st only, 3/10/15 seconds, solo entrants spectate, latency compensation off). They are all stored config, so answering later costs a document edit, not a migration — except **§14.5, options before the buzz**, which decides whether `question.options` is in the payload before `seated`, and that shapes the arena and the app screen alike.

/**
 * Electric Answers — the buzzer round's state machine.
 *
 * The third machine in this codebase, and separate from the other two for the
 * same reason they are separate from each other: KBC has a hot seat and
 * lifelines, `custom_live` has one open question and a deadline, and this has a
 * countdown, a race, a seat and a queue. Folding any of them together is how
 * fields that belong to one format end up stored on activities running another.
 *
 * Two ideas carry the whole design:
 *
 *   1. **One instant, not three commands.** The host presses Start once. The
 *      server writes `armsAt`, and every phone counts 3 · 2 · 1 down to that
 *      same instant. Sending "3", "2", "1" as separate updates would arm each
 *      phone whenever its next poll happened to land.
 *
 *   2. **Phases that depend on time are derived, never written.** `countdown`
 *      becomes `buzzing` at `armsAt` and `buzzing` becomes `no_buzz` at
 *      `buzzClosesAt` without anybody writing anything, exactly as
 *      `effectiveRoundState()` does for `liveRound`. There is no scheduler on
 *      Netlify, and a 3-second countdown cannot wait for one.
 *
 * This module is deliberately free of imports so it can be unit-tested with
 * `node --test` without a database or the `@/` alias. That is also why
 * `GRACE_MS` is restated here rather than imported from `lib/live/rounds.js`.
 */

export const BUZZER_PHASE = {
    LOBBY: 'lobby',
    STAGED: 'staged',
    COUNTDOWN: 'countdown',
    BUZZING: 'buzzing',
    SEATED: 'seated',
    JUDGED_CORRECT: 'judged_correct',
    JUDGED_WRONG: 'judged_wrong',
    NO_BUZZ: 'no_buzz',
    REVEALED: 'revealed',
    COMPLETED: 'completed',
};

export const BUZZER_COMMAND = {
    STAGE_QUESTION: 'STAGE_QUESTION',
    INSERT_QUESTION: 'INSERT_QUESTION',
    START_COUNTDOWN: 'START_COUNTDOWN',
    MARK_CORRECT: 'MARK_CORRECT',
    MARK_WRONG: 'MARK_WRONG',
    PASS: 'PASS',
    REBUZZ: 'REBUZZ',
    REVEAL: 'REVEAL',
    START_TIEBREAK: 'START_TIEBREAK',
    SET_ANSWERER: 'SET_ANSWERER',
    END_GAME: 'END_GAME',
};

/** Every setting the round reads, and what it is when nobody has said. */
export const BUZZER_DEFAULTS = {
    answerMode: 'in_app',
    countdownSeconds: 3,
    buzzWindowSeconds: 10,
    answerSeconds: 15,
    wrongPenalty: 0,
    passPoints: null,
    falseStartLockout: true,
    tieScope: 'first',
    latencyCompensation: false,
};

/**
 * Allowance for the network leg, applied only to the *closing* edge of the
 * buzz window and the answer window.
 *
 * A leader who taps at 9.98s of a 10s window has buzzed in time; the request
 * still has to cross a phone network to get here. It is never applied to the
 * opening edge: a press that arrives before `armsAt` is a false start however
 * close it was, because there the grace would be an advantage rather than a
 * correction.
 */
export const BUZZ_GRACE_MS = 800;

/** The three answer shapes the app can render. */
export const BUZZER_QUESTION_TYPES = ['mcq', 'truefalse', 'fillup'];

const ms = (value) => (value ? new Date(value).getTime() : null);

/** Settings with the defaults filled in. */
export function buzzerSettings(quiz) {
    const stored = quiz?.buzzer ?? {};
    const settings = { ...BUZZER_DEFAULTS };
    for (const key of Object.keys(BUZZER_DEFAULTS)) {
        // `null` is the stored way of saying "use the default" — `passPoints`
        // is null when a passed question is worth the question's own value.
        if (stored[key] !== undefined && stored[key] !== null) settings[key] = stored[key];
    }
    return settings;
}

/**
 * What the round actually is right now, as opposed to what was last written.
 *
 * Mirrors `BuzzerRound.phaseAt()` in the Flutter client, field for field and
 * comparison for comparison. If the two ever disagree, the BUZZ button lights
 * on the phones at a different moment from the one the server will accept, and
 * the round is unfair in a way nobody can see.
 */
export function effectiveBuzzerPhase(round, now = new Date()) {
    const stored = round?.phase ?? BUZZER_PHASE.LOBBY;
    if (stored !== BUZZER_PHASE.COUNTDOWN && stored !== BUZZER_PHASE.BUZZING) return stored;

    const t = now.getTime();
    const closes = ms(round?.buzzClosesAt);
    if (closes !== null && t >= closes) return BUZZER_PHASE.NO_BUZZ;

    const arms = ms(round?.armsAt);
    if (stored === BUZZER_PHASE.COUNTDOWN && arms !== null && t >= arms) return BUZZER_PHASE.BUZZING;

    return stored;
}

/**
 * Why a press cannot be accepted, as one of the codes the app already has copy
 * for, or null to accept it.
 *
 * Shared by the press endpoint and by the `canBuzz` flag in the status payload,
 * so a phone is never shown a live button for a press this would refuse.
 *
 * `seated` is an accepting phase on purpose: the teams behind the winner are
 * still pressing, and those presses are the queue that `PASS` walks.
 */
export function buzzRefusal({ round, settings, team, now, hasPressed = false }) {
    if (!round?.instanceId) return 'BUZZ_CLOSED';

    const teamId = team?.teamId ? String(team.teamId) : null;
    if (!teamId) return 'NOT_ELIGIBLE';

    const eligible = (round.eligibleTeamIds ?? []).map(String);
    if (eligible.length && !eligible.includes(teamId)) return 'NOT_ELIGIBLE';

    if ((round.lockedOutTeamIds ?? []).map(String).includes(teamId)) return 'LOCKED_OUT';
    if ((round.attemptedTeamIds ?? []).map(String).includes(teamId)) return 'ALREADY_PRESSED';
    if (hasPressed) return 'ALREADY_PRESSED';

    const stored = round.phase;
    const racing = stored === BUZZER_PHASE.COUNTDOWN
        || stored === BUZZER_PHASE.BUZZING
        || stored === BUZZER_PHASE.SEATED;
    if (!racing) return 'BUZZ_CLOSED';

    const t = now.getTime();
    const arms = ms(round.armsAt);
    if (arms === null) return 'BUZZ_CLOSED';
    if (t < arms) return settings?.falseStartLockout === false ? 'BUZZ_CLOSED' : 'FALSE_START';

    const closes = ms(round.buzzClosesAt);
    if (closes !== null && t >= closes + BUZZ_GRACE_MS) return 'BUZZ_CLOSED';

    return null;
}

/**
 * Whether this address may press for this team.
 *
 * The leader by default, or whoever the host named with `SET_ANSWERER` — which
 * is what a team whose leader's phone has died uses. Resolved from the
 * registration and the activity, never from anything the phone says about
 * itself.
 */
export function mayPressFor(buzzer, team, email) {
    const lower = String(email ?? '').toLowerCase();
    if (!lower || !team?.teamId) return false;

    const override = (buzzer?.answerers ?? []).find(
        (a) => String(a?.teamId ?? '') === String(team.teamId),
    );
    if (override?.email) return String(override.email).toLowerCase() === lower;

    return Boolean(team.isLeader);
}

/**
 * The question type as the app understands it.
 *
 * The stored `QuestionSchema.type` has said `choice | text` since long before
 * this round existed, and the shipped client matches on `mcq | truefalse |
 * fillup`. Translating here means neither side has to change: old questions
 * stage as MCQs, typed ones as fill-ups.
 */
export function buzzerQuestionType(question) {
    const stored = String(question?.type ?? '').toLowerCase();
    if (stored === 'truefalse') return 'truefalse';
    if (stored === 'fillup' || stored === 'text') return 'fillup';
    return 'mcq';
}

const normalise = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

/**
 * Grade one in-app answer.
 *
 * Fill-ups normalise both sides — trim, collapse whitespace, fold case — and
 * match against `correctAnswer` plus every spelling in `acceptedAnswers`. A
 * right answer with a typo the list does not cover is graded wrong here and the
 * host overrides it with Correct; that is a deliberately dumb grader with a
 * human behind it, rather than a clever one nobody can predict.
 */
export function gradeBuzzerAnswer(question, answer) {
    const given = normalise(answer);
    if (!given) return false;

    const accepted = [question?.correctAnswer, ...(question?.acceptedAnswers ?? [])]
        .filter((a) => a !== undefined && a !== null && String(a).trim() !== '')
        .map(normalise);

    return accepted.includes(given);
}

/** What this seat is worth, before the outcome is known. */
export function buzzerPoints({ question, settings, attempt, outcome }) {
    const base = Number(question?.points) || 10;

    if (outcome === 'correct') {
        // A passed question can be worth less than one answered first hand.
        // `null` means it is worth the same, which is the default.
        const passValue = settings?.passPoints;
        return attempt > 1 && passValue !== null && passValue !== undefined
            ? Number(passValue) || 0
            : base;
    }

    // Held as a magnitude and subtracted, like `quiz.penalties`, so a glance at
    // the config cannot leave you wondering what a stored -50 means. Zero is
    // returned as itself rather than as -0, which would otherwise end up on an
    // attempt row and in a sum.
    const penalty = Math.abs(Number(settings?.wrongPenalty) || 0);
    return penalty === 0 ? 0 : -penalty;
}

/**
 * The conditional update that claims the seat.
 *
 * Built here, and as data rather than as a call, for two reasons: the filter
 * *is* the fairness property, so it belongs next to the rest of the rules; and
 * a property this important should be testable without a database.
 *
 * The three conditions are what make two presses in the same millisecond safe.
 * Still this question, still open, and the seat still empty — the first write
 * matches, every later one matches nothing, and Mongo does the deciding rather
 * than a read-then-write in JavaScript that can interleave.
 */
export function seatClaim({ activityId, round, team, leaderEmail, leaderName, receivedAt, settings }) {
    return {
        filter: {
            _id: activityId,
            'quiz.buzzer.round.instanceId': round.instanceId,
            'quiz.buzzer.round.phase': { $in: [BUZZER_PHASE.COUNTDOWN, BUZZER_PHASE.BUZZING] },
            // Matches a null seat and a missing one alike.
            'quiz.buzzer.round.seat.teamId': null,
        },
        update: {
            $set: {
                'quiz.buzzer.round.phase': BUZZER_PHASE.SEATED,
                'quiz.buzzer.round.seat': {
                    teamId: String(team.teamId),
                    teamName: team.teamName ?? null,
                    leaderEmail: leaderEmail ?? null,
                    leaderName: leaderName ?? team.leaderName ?? null,
                    pressedAt: receivedAt,
                    seatedAt: receivedAt,
                    attempt: 1,
                    answerEndsAt: new Date(receivedAt.getTime() + settings.answerSeconds * 1000),
                    answeredAt: null,
                    submittedAnswer: null,
                },
            },
        },
    };
}

// ── Command legality ─────────────────────────────────────────────────────────

const {
    LOBBY, STAGED, COUNTDOWN, BUZZING, SEATED,
    JUDGED_CORRECT, JUDGED_WRONG, NO_BUZZ, REVEALED, COMPLETED,
} = BUZZER_PHASE;

/**
 * `staged` is a legal place to stage from: the host has put a question up but
 * nobody has pressed anything, so swapping it for another costs nothing. Every
 * other way out of a question goes through `REVEAL` first, so that the room
 * always sees the answer to a question it was asked.
 */
const STAGE_FROM = [LOBBY, STAGED, REVEALED];

const ALLOWED_FROM = {
    [BUZZER_COMMAND.STAGE_QUESTION]: STAGE_FROM,
    [BUZZER_COMMAND.INSERT_QUESTION]: Object.values(BUZZER_PHASE),
    [BUZZER_COMMAND.START_COUNTDOWN]: [STAGED],
    [BUZZER_COMMAND.MARK_CORRECT]: [SEATED, JUDGED_CORRECT, JUDGED_WRONG],
    [BUZZER_COMMAND.MARK_WRONG]: [SEATED, JUDGED_CORRECT, JUDGED_WRONG],
    [BUZZER_COMMAND.PASS]: [JUDGED_WRONG],
    [BUZZER_COMMAND.REBUZZ]: [JUDGED_WRONG, NO_BUZZ],
    [BUZZER_COMMAND.REVEAL]: [JUDGED_CORRECT, JUDGED_WRONG, NO_BUZZ],
    [BUZZER_COMMAND.START_TIEBREAK]: [REVEALED],
    [BUZZER_COMMAND.SET_ANSWERER]: Object.values(BUZZER_PHASE),
    // Ending must always be possible, including out of a phase nobody planned
    // to be in when the hall has to be cleared.
    [BUZZER_COMMAND.END_GAME]: Object.values(BUZZER_PHASE),
};

const NEXT_PHASE = {
    [BUZZER_COMMAND.STAGE_QUESTION]: STAGED,
    [BUZZER_COMMAND.START_COUNTDOWN]: COUNTDOWN,
    [BUZZER_COMMAND.MARK_CORRECT]: JUDGED_CORRECT,
    [BUZZER_COMMAND.MARK_WRONG]: JUDGED_WRONG,
    [BUZZER_COMMAND.PASS]: SEATED,
    // Not `buzzing`: a rebuzz writes a fresh `armsAt` and lets the derived
    // transition arm the phones, so the teams still in it get the same 3 · 2 · 1
    // they got the first time instead of a button that is already live.
    [BUZZER_COMMAND.REBUZZ]: COUNTDOWN,
    [BUZZER_COMMAND.REVEAL]: REVEALED,
    [BUZZER_COMMAND.START_TIEBREAK]: STAGED,
    [BUZZER_COMMAND.END_GAME]: COMPLETED,
};

const questionRefusal = (quiz, index, answerMode) => {
    const total = quiz?.questions?.length ?? 0;
    if (!total) return 'This round has no questions.';
    if (!Number.isInteger(index) || index < 0 || index >= total) {
        return `Question ${index} does not exist.`;
    }
    const question = quiz.questions[index];
    if (answerMode !== 'spoken' && !String(question?.correctAnswer ?? '').trim()) {
        return 'That question has no stored answer. Stage it in spoken mode and judge it yourself.';
    }
    return null;
};

/**
 * Preconditions that depend on state rather than on the phase name.
 *
 * `PASS` and `REBUZZ` need to know who is left, and who is left lives in
 * `buzz_presses` — a collection this module deliberately cannot read. The route
 * works it out and hands it over in the payload, which keeps the machine
 * testable without a database and keeps the queue in one place.
 */
const GUARDS = {
    [BUZZER_COMMAND.STAGE_QUESTION]: (quiz, payload) =>
        questionRefusal(
            quiz,
            Number(payload?.questionIndex),
            payload?.answerMode ?? buzzerSettings(quiz).answerMode,
        ),

    [BUZZER_COMMAND.INSERT_QUESTION]: (quiz, payload) => {
        const q = payload?.question ?? {};
        if (!String(q.text ?? '').trim()) return 'A question needs some text.';

        const type = String(q.type ?? 'mcq').toLowerCase();
        if (!BUZZER_QUESTION_TYPES.includes(type)) {
            return `Type must be one of ${BUZZER_QUESTION_TYPES.join(', ')}.`;
        }

        const options = Array.isArray(q.options) ? q.options.filter(Boolean) : [];
        if (type === 'mcq' && options.length < 2) return 'An MCQ needs at least two options.';

        const answer = String(q.correctAnswer ?? '').trim();
        const mode = payload?.answerMode ?? buzzerSettings(quiz).answerMode;
        if (!answer && mode !== 'spoken') {
            return 'An in-app question needs a correct answer. Use spoken mode to judge it yourself.';
        }
        if (answer && type === 'mcq' && options.length && !options.includes(answer)) {
            return 'The correct answer is not one of the options.';
        }
        if (payload?.stage && !STAGE_FROM.includes(quiz?.buzzer?.round?.phase ?? LOBBY)) {
            return 'Reveal the current question before staging another.';
        }
        return null;
    },

    [BUZZER_COMMAND.START_COUNTDOWN]: (quiz) => {
        const round = quiz?.buzzer?.round ?? {};
        if (!round.instanceId) return 'No question is staged.';
        if (!(round.eligibleTeamIds ?? []).length) return 'No team is eligible to buzz.';
        return null;
    },

    [BUZZER_COMMAND.MARK_CORRECT]: (quiz) =>
        quiz?.buzzer?.round?.seat?.teamId ? null : 'No team has the seat.',

    [BUZZER_COMMAND.MARK_WRONG]: (quiz) =>
        quiz?.buzzer?.round?.seat?.teamId ? null : 'No team has the seat.',

    [BUZZER_COMMAND.PASS]: (quiz, payload) =>
        payload?.nextTeam?.teamId ? null : 'No team is left in the buzz queue.',

    [BUZZER_COMMAND.REBUZZ]: (quiz, payload) =>
        (payload?.remainingTeamIds ?? []).length
            ? null
            : 'Every eligible team has already had a go at this question.',

    [BUZZER_COMMAND.START_TIEBREAK]: (quiz, payload) => {
        const teamIds = (payload?.teamIds ?? []).map(String).filter(Boolean);
        if (teamIds.length < 2) return 'A tie-break needs at least two teams.';
        if (payload?.question) return GUARDS[BUZZER_COMMAND.INSERT_QUESTION](quiz, payload);
        return questionRefusal(
            quiz,
            Number(payload?.questionIndex),
            payload?.answerMode ?? buzzerSettings(quiz).answerMode,
        );
    },

    [BUZZER_COMMAND.SET_ANSWERER]: (quiz, payload) => {
        if (!String(payload?.teamId ?? '').trim()) return 'Name the team.';
        if (!String(payload?.email ?? '').trim()) return 'Name the address that answers for them.';
        return null;
    },
};

/**
 * @returns {{ ok: true, nextPhase: string } | { ok: false, reason: string }}
 */
export function canRunBuzzer(command, quiz, payload = {}, now = new Date()) {
    const allowed = ALLOWED_FROM[command];
    if (!allowed) return { ok: false, reason: `Unknown command ${command}.` };

    // The derived phase, not the stored one: a host whose buzz window ran out
    // while they were talking may rebuzz or reveal without pressing anything
    // first, because as far as the room is concerned nobody buzzed.
    const phase = effectiveBuzzerPhase(quiz?.buzzer?.round, now);
    if (!allowed.includes(phase)) {
        return { ok: false, reason: `Cannot ${command} while the round is "${phase}".` };
    }

    const reason = GUARDS[command]?.(quiz ?? {}, payload);
    if (reason) return { ok: false, reason };

    // Commands that leave the round where it stands.
    if (command === BUZZER_COMMAND.SET_ANSWERER) return { ok: true, nextPhase: phase };
    if (command === BUZZER_COMMAND.INSERT_QUESTION) {
        return { ok: true, nextPhase: payload?.stage ? STAGED : phase };
    }

    return { ok: true, nextPhase: NEXT_PHASE[command] };
}

// ── Effects ──────────────────────────────────────────────────────────────────

export const emptySeat = () => ({
    teamId: null, teamName: null, leaderEmail: null, leaderName: null,
    pressedAt: null, seatedAt: null, attempt: 0,
    answerEndsAt: null, answeredAt: null, submittedAnswer: null,
});

/**
 * Perform a command's effects on `quiz.buzzer`. Mutates; the caller sets the
 * phase from the verdict and owns every database write.
 *
 * `newInstanceId` is supplied rather than minted here for the same reason
 * `applyLiveEffects` does it: this module stays free of mongoose, and therefore
 * testable without one.
 */
export function applyBuzzerEffects({ command, payload = {}, quiz, now, newInstanceId }) {
    const buzzer = quiz.buzzer ?? (quiz.buzzer = {});
    const settings = buzzerSettings(quiz);
    const round = buzzer.round ?? (buzzer.round = { phase: LOBBY });

    const stage = ({ questionIndex, isTiebreak, eligibleTeamIds }) => {
        buzzer.round = {
            instanceId: newInstanceId,
            questionIndex,
            phase: STAGED,
            answerMode: payload.answerMode ?? settings.answerMode,
            showOptionsBeforeBuzz: payload.showOptionsBeforeBuzz ?? true,
            stagedAt: now,
            armsAt: null,
            buzzClosesAt: null,
            eligibleTeamIds,
            lockedOutTeamIds: [],
            attemptedTeamIds: [],
            seat: emptySeat(),
            isTiebreak: Boolean(isTiebreak),
        };
        // Kept in step so the readers that predate this round — the console's
        // question list, the legacy status payload — do not have to learn about
        // `quiz.buzzer`.
        quiz.currentQuestion = questionIndex;
    };

    const arm = (eligibleTeamIds) => {
        const armsAt = new Date(now.getTime() + settings.countdownSeconds * 1000);
        round.eligibleTeamIds = eligibleTeamIds ?? round.eligibleTeamIds ?? [];
        round.armsAt = armsAt;
        round.buzzClosesAt = new Date(armsAt.getTime() + settings.buzzWindowSeconds * 1000);
        round.seat = emptySeat();
    };

    switch (command) {
        case BUZZER_COMMAND.STAGE_QUESTION:
            stage({
                questionIndex: Number(payload.questionIndex),
                isTiebreak: false,
                eligibleTeamIds: (payload.eligibleTeamIds ?? []).map(String),
            });
            break;

        case BUZZER_COMMAND.INSERT_QUESTION: {
            // Appended, never inserted. Rounds and attempts reference
            // `questionIndex`, so inserting in the middle would silently move
            // every question already recorded under an index.
            quiz.questions = [...(quiz.questions ?? []), { ...payload.question, source: 'spot' }];
            if (payload.stage) {
                stage({
                    questionIndex: quiz.questions.length - 1,
                    isTiebreak: Boolean(payload.isTiebreak),
                    eligibleTeamIds: (payload.eligibleTeamIds ?? []).map(String),
                });
            }
            break;
        }

        case BUZZER_COMMAND.START_COUNTDOWN:
            arm();
            break;

        case BUZZER_COMMAND.MARK_CORRECT:
        case BUZZER_COMMAND.MARK_WRONG: {
            const teamId = round.seat?.teamId;
            if (teamId && !(round.attemptedTeamIds ?? []).map(String).includes(String(teamId))) {
                round.attemptedTeamIds = [...(round.attemptedTeamIds ?? []), String(teamId)];
            }
            if (round.seat && !round.seat.answeredAt) round.seat.answeredAt = now;
            break;
        }

        case BUZZER_COMMAND.PASS: {
            const next = payload.nextTeam ?? {};
            round.seat = {
                teamId: String(next.teamId),
                teamName: next.teamName ?? null,
                leaderEmail: next.leaderEmail ?? null,
                leaderName: next.leaderName ?? null,
                pressedAt: next.pressedAt ?? null,
                seatedAt: now,
                attempt: (round.seat?.attempt ?? 1) + 1,
                answerEndsAt: new Date(now.getTime() + settings.answerSeconds * 1000),
                answeredAt: null,
                submittedAnswer: null,
            };
            break;
        }

        case BUZZER_COMMAND.REBUZZ:
            arm((payload.remainingTeamIds ?? []).map(String));
            break;

        case BUZZER_COMMAND.REVEAL:
            round.revealedAt = now;
            break;

        case BUZZER_COMMAND.START_TIEBREAK: {
            const teamIds = (payload.teamIds ?? []).map(String);
            if (payload.question) {
                quiz.questions = [...(quiz.questions ?? []), { ...payload.question, source: 'spot' }];
            }
            stage({
                questionIndex: payload.question
                    ? quiz.questions.length - 1
                    : Number(payload.questionIndex),
                isTiebreak: true,
                eligibleTeamIds: teamIds,
            });
            break;
        }

        case BUZZER_COMMAND.SET_ANSWERER: {
            const teamId = String(payload.teamId);
            const email = String(payload.email).toLowerCase();
            const others = (buzzer.answerers ?? []).filter((a) => String(a?.teamId) !== teamId);
            buzzer.answerers = [...others, { teamId, email }];
            break;
        }

        case BUZZER_COMMAND.END_GAME:
            round.seat = emptySeat();
            round.armsAt = null;
            round.buzzClosesAt = null;
            break;

        default:
            break;
    }
}

/**
 * The teams that may be sent back into the buzz window.
 *
 * Everyone eligible, less those who have had the seat, those who jumped the
 * gun, and those who already have a press recorded for this instance — that
 * last one because a press row is unique per team per instance, so a team that
 * buzzed but never got the seat cannot press again without tripping the index.
 * They are queued already; a rebuzz is for the teams that are not.
 */
export function remainingTeams(round, pressedTeamIds = []) {
    const out = new Set((round?.eligibleTeamIds ?? []).map(String));
    for (const id of (round?.attemptedTeamIds ?? []).map(String)) out.delete(id);
    for (const id of (round?.lockedOutTeamIds ?? []).map(String)) out.delete(id);
    for (const id of pressedTeamIds.map(String)) out.delete(id);
    return [...out];
}

/**
 * Who is tied where it matters.
 *
 * `first` is a tie for the win; `podium` widens it to any tie inside the top
 * three. Returned so the console can offer a tie-break — never so that one
 * starts by itself. The host decides when the room is ready for sudden death.
 */
export function tiedTeams(standings = [], tieScope = 'first') {
    const rows = [...standings].sort(
        (a, b) => (b.score - a.score) || ((b.tiebreakWins ?? 0) - (a.tiebreakWins ?? 0)),
    );
    if (rows.length < 2) return [];

    const depth = tieScope === 'podium' ? Math.min(3, rows.length) : 1;
    const ties = [];

    for (let i = 0; i < depth; i += 1) {
        const level = rows.filter(
            (r) => r.score === rows[i].score && (r.tiebreakWins ?? 0) === (rows[i].tiebreakWins ?? 0),
        );
        if (level.length > 1 && !ties.some((t) => t[0]?.teamId === level[0]?.teamId)) {
            ties.push(level);
        }
    }

    return ties.flat().map((r) => ({
        teamId: r.teamId,
        teamName: r.teamName,
        score: r.score,
        tiebreakWins: r.tiebreakWins ?? 0,
    }));
}

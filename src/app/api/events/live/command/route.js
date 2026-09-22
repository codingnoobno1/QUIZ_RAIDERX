import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import AudiencePollVote from '@/models/AudiencePollVote';
import FastestFingerSubmission from '@/models/FastestFingerSubmission';
import { canRun, fiftyFiftyEliminations, COMMAND, PHASE } from '@/lib/kbc/machine';
import LiveAnswer from '@/models/LiveAnswer';
import BuzzPress from '@/models/BuzzPress';
import BuzzAttempt from '@/models/BuzzAttempt';
import {
    BUZZER_COMMAND,
    BUZZER_PHASE,
    applyBuzzerEffects,
    buzzerPoints,
    buzzerQuestionType,
    buzzerSettings,
    canRunBuzzer,
    effectiveBuzzerPhase,
    remainingTeams,
    tiedTeams,
} from '@/lib/buzzer/machine';
import { refreshStandings } from '@/lib/buzzer/scoring';
import { listEventTeams } from '@/lib/rounds/roster';
import {
    canRunLive,
    applyLiveEffects,
    effectiveRoundState,
    LIVE_COMMAND,
    ROUND_STATE,
} from '@/lib/live/rounds';
import {
    requireAdmin,
    readJson,
    invalidIdResponse,
    badRequest,
    notFound,
    conflict,
    serverError,
} from '@/lib/apiGuards';

/**
 * POST /api/events/live/command — drive the live show.
 *
 * Host only, and the single way any phase changes. Clients render the state
 * they are given; they never compute the next one. A contestant whose timer
 * expires does not advance the show, and an audience member cannot reveal an
 * answer by editing their own JavaScript, because neither can produce an
 * admin-authenticated request.
 *
 * Body: { activityId, action, payload? }
 */
export async function POST(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, action, payload = {} } = parsed.data;

    if (!activityId || !action) return badRequest('activityId and action are required.');

    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId);
        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');

        const quiz = activity.quiz ?? {};

        // Two formats, two machines. A game show has phases — a hot seat,
        // lifelines, an audience — that a host-paced quiz has none of, and
        // merging them would mean one table of transitions where half the rows
        // are unreachable for any given activity.
        if (quiz.quizType === 'kbc') {
            // The machine decides legality; this route only performs effects.
            const verdict = canRun(action, quiz, payload);
            if (!verdict.ok) return conflict(verdict.reason, { code: 'ILLEGAL_TRANSITION', phase: quiz.phase });

            const now = new Date();
            await applyEffects({ action, payload, activity, quiz, now, actor: auth.actor });

            quiz.phase = verdict.nextPhase;
            await activity.save();

            return NextResponse.json({
                success: true,
                phase: quiz.phase,
                changedBy: auth.actor.email || auth.actor.name,
            });
        }

        if (quiz.quizType === 'custom_live') {
            const verdict = canRunLive(action, quiz, payload);
            if (!verdict.ok) {
                return conflict(verdict.reason, {
                    code: 'ILLEGAL_TRANSITION',
                    state: effectiveRoundState(quiz.liveRound),
                });
            }

            const now = new Date();

            // A fresh instance for every opening. Reusing one would make a
            // re-asked question a duplicate-key error for everyone who answered
            // the first time round.
            const opensRound = action === LIVE_COMMAND.OPEN_QUESTION
                || action === LIVE_COMMAND.NEXT_QUESTION;

            applyLiveEffects({
                action,
                payload,
                quiz,
                now,
                newInstanceId: opensRound
                    ? new mongoose.Types.ObjectId()
                    : quiz.liveRound?.instanceId ?? null,
            });

            quiz.liveRound.state = verdict.nextState;
            activity.markModified('quiz.liveRound');
            activity.markModified('quiz.roundClock');
            activity.markModified('quiz.choice');
            await activity.save();

            return NextResponse.json({
                success: true,
                state: quiz.liveRound.state,
                liveRound: {
                    instanceId: quiz.liveRound.instanceId ? String(quiz.liveRound.instanceId) : null,
                    questionIndex: quiz.liveRound.questionIndex,
                    endsAt: quiz.liveRound.endsAt,
                    durationSeconds: quiz.liveRound.durationSeconds,
                    target: quiz.liveRound.target,
                },
                roundClock: quiz.roundClock ?? null,
                choice: quiz.choice ?? null,
                serverTime: now.toISOString(),
                changedBy: auth.actor.email || auth.actor.name,
            });
        }

        if (quiz.quizType === 'buzzer') {
            return await runBuzzerCommand({ activity, quiz, action, payload, actor: auth.actor });
        }

        return badRequest(
            'This activity is not host-paced. Live commands apply to kbc, custom_live and buzzer quizzes.',
        );
    } catch (error) {
        if (error?.code === 11000) {
            return conflict('That action was already applied.', { code: 'DUPLICATE' });
        }
        return serverError(error, 'events/live/command');
    }
}

/** Mutates `quiz` in place. Phase itself is set by the caller. */
async function applyEffects({ action, payload, activity, quiz, now }) {
    const questions = quiz.questions ?? [];

    switch (action) {
        case COMMAND.OPEN_FASTEST_FINGER: {
            const index = Number.isInteger(payload.questionIndex) ? payload.questionIndex : 0;
            quiz.fastestFinger = { questionIndex: index, openedAt: now, closedAt: null, revealed: false };
            // openedAt is the clock every submission is measured against, so it
            // must be written before any answer can arrive.
            startTimer(quiz, payload.durationSeconds ?? 30, now);
            break;
        }

        case COMMAND.CLOSE_FASTEST_FINGER: {
            quiz.fastestFinger.closedAt = now;
            clearTimer(quiz);
            // Grade now, but keep it hidden: `revealed` still false, and the
            // status route withholds correctness until the host reveals.
            await gradeFastestFinger(activity, quiz);
            break;
        }

        case COMMAND.REVEAL_FASTEST_FINGER:
            quiz.fastestFinger.revealed = true;
            break;

        case COMMAND.SEAT_CONTESTANT:
            quiz.activeContestant = {
                participantId: payload.participantId,
                name: payload.name ?? '',
                teamId: payload.teamId ?? '',
                teamName: payload.teamName ?? '',
                seatedAt: now,
            };
            // A new contestant gets a fresh set of lifelines.
            quiz.lifelines = { fiftyFifty: true, audiencePoll: true, skip: true, eliminatedOptions: [] };
            quiz.answerState = { locked: false, lockedOption: null, lockedAt: null };
            quiz.audiencePoll = { status: 'idle', resultsVisible: false, questionIndex: null };
            break;

        case COMMAND.START_HOT_SEAT:
            quiz.currentQuestion = Number.isInteger(payload.questionIndex) ? payload.questionIndex : 0;
            resetForQuestion(quiz);
            startTimer(quiz, payload.durationSeconds ?? quiz.timePerQuestion ?? 30, now);
            break;

        case COMMAND.NEXT_QUESTION:
            quiz.currentQuestion = (quiz.currentQuestion ?? 0) + 1;
            resetForQuestion(quiz);
            startTimer(quiz, payload.durationSeconds ?? quiz.timePerQuestion ?? 30, now);
            break;

        case COMMAND.LOCK_ANSWER:
            quiz.answerState = { locked: true, lockedOption: payload.option, lockedAt: now };
            clearTimer(quiz);
            break;

        case COMMAND.OPEN_AUDIENCE_POLL:
            quiz.lifelines.audiencePoll = false; // consumed on use, not on close
            quiz.audiencePoll = {
                questionIndex: quiz.currentQuestion ?? 0,
                status: 'open',
                openedAt: now,
                closedAt: null,
                resultsVisible: false,
            };
            break;

        case COMMAND.CLOSE_AUDIENCE_POLL:
            quiz.audiencePoll.status = 'closed';
            quiz.audiencePoll.closedAt = now;
            // Only now may the contestant — and the room — see the split.
            quiz.audiencePoll.resultsVisible = true;
            break;

        case COMMAND.USE_FIFTY_FIFTY: {
            const q = questions[quiz.currentQuestion ?? 0];
            quiz.lifelines.fiftyFifty = false;
            quiz.lifelines.eliminatedOptions = fiftyFiftyEliminations(q);
            break;
        }

        case COMMAND.REVEAL_ANSWER: {
            const index = quiz.currentQuestion ?? 0;
            const q = questions[index];
            const selected = quiz.answerState?.lockedOption ?? null;
            const correct = Boolean(selected && q && selected === q.correctAnswer);

            quiz.results.push({
                participantId: quiz.activeContestant?.participantId ?? '',
                name: quiz.activeContestant?.name ?? '',
                teamName: quiz.activeContestant?.teamName ?? '',
                questionIndex: index,
                selectedOption: selected,
                correct,
                pointsAwarded: correct ? q?.points ?? 10 : 0,
                decidedAt: now,
            });
            clearTimer(quiz);
            break;
        }

        case COMMAND.RETIRE_CONTESTANT:
            quiz.activeContestant = undefined;
            quiz.answerState = { locked: false, lockedOption: null, lockedAt: null };
            quiz.audiencePoll = { status: 'idle', resultsVisible: false, questionIndex: null };
            clearTimer(quiz);
            break;

        case COMMAND.END_SHOW:
            clearTimer(quiz);
            break;

        default:
            break; // pure phase moves (REVEAL_FASTEST_FINGER, SHOW_LEADERBOARD)
    }
}

function resetForQuestion(quiz) {
    quiz.answerState = { locked: false, lockedOption: null, lockedAt: null };
    quiz.audiencePoll = { status: 'idle', resultsVisible: false, questionIndex: null };
    quiz.lifelines.eliminatedOptions = [];
}

function startTimer(quiz, durationSeconds, now) {
    quiz.timer = {
        startedAt: now,
        endsAt: new Date(now.getTime() + durationSeconds * 1000),
        durationSeconds,
    };
}

const clearTimer = (quiz) => {
    quiz.timer = { startedAt: null, endsAt: null, durationSeconds: null };
};

/**
 * Grade every submission for the round against the stored correct order.
 *
 * Ranking is (correct, then elapsedMs) and elapsedMs was measured server-side
 * at submit, so a client cannot buy itself a better position.
 */
async function gradeFastestFinger(activity, quiz) {
    const index = quiz.fastestFinger?.questionIndex ?? 0;
    const question = quiz.questions?.[index];
    if (!question) return;

    // correctAnswer holds the ordering as a delimited string, e.g. "C,B,A,D".
    const expected = String(question.correctAnswer ?? '')
        .split(/[,>\s]+/)
        .filter(Boolean)
        .join(',');

    const submissions = await FastestFingerSubmission.find({
        activityId: activity._id,
        questionIndex: index,
    }).select('_id answer');

    await Promise.all(
        submissions.map((s) =>
            FastestFingerSubmission.updateOne(
                { _id: s._id },
                { $set: { correct: (s.answer ?? []).join(',') === expected } },
            ),
        ),
    );
}

/**
 * GET /api/events/live/command?activityId= — host-only console state.
 *
 * Everything the control room needs and no participant may see: the correct
 * answer, the live vote tally while the poll is still open, and the ranked
 * fastest-finger board before reveal.
 */
export async function GET(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get('activityId');

    if (!activityId) return badRequest('activityId is required.');
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId).lean();
        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');

        if (activity.quiz?.quizType === 'custom_live') {
            return NextResponse.json({ success: true, data: await liveConsoleState(activity) });
        }

        if (activity.quiz?.quizType === 'buzzer') {
            return NextResponse.json({ success: true, data: await buzzerConsoleState(activity) });
        }

        const quiz = activity.quiz ?? {};
        const index = quiz.currentQuestion ?? 0;
        const question = quiz.questions?.[index] ?? null;

        const [ranking, pollVotes] = await Promise.all([
            FastestFingerSubmission.find({
                activityId,
                questionIndex: quiz.fastestFinger?.questionIndex ?? 0,
            })
                .sort({ correct: -1, elapsedMs: 1 })
                .limit(25)
                .lean(),
            AudiencePollVote.find({ activityId, questionIndex: index }).select('option').lean(),
        ]);

        const tally = pollVotes.reduce((acc, v) => {
            acc[v.option] = (acc[v.option] ?? 0) + 1;
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            data: {
                phase: quiz.phase ?? PHASE.LOBBY,
                round: quiz.round ?? 1,
                activeContestant: quiz.activeContestant ?? null,
                questionIndex: index,
                totalQuestions: quiz.questions?.length ?? 0,
                question: question
                    ? {
                          text: question.text,
                          type: question.type ?? 'choice',
                          options: question.options,
                          points: question.points,
                          correctAnswer: question.correctAnswer, // host only
                      }
                    : null,
                answerState: quiz.answerState ?? null,
                lifelines: quiz.lifelines ?? null,
                timer: quiz.timer ?? null,
                audiencePoll: { ...(quiz.audiencePoll ?? {}), tally, totalVotes: pollVotes.length },
                fastestFinger: {
                    ...(quiz.fastestFinger ?? {}),
                    ranking: ranking.map((r, i) => ({
                        rank: i + 1,
                        participantId: r.participantId,
                        name: r.name,
                        teamName: r.teamName,
                        elapsedMs: r.elapsedMs,
                        correct: r.correct,
                    })),
                },
                results: quiz.results ?? [],
            },
        });
    } catch (error) {
        return serverError(error, 'events/live/command/state');
    }
}

/**
 * Host-paced console state.
 *
 * The operator needs three things the room must not have: the correct answer,
 * who has answered while the question is still open, and how long is actually
 * left according to the server rather than to their own laptop clock.
 */
async function liveConsoleState(activity) {
    const quiz = activity.quiz ?? {};
    const round = quiz.liveRound ?? {};
    const now = new Date();
    const index = round.questionIndex ?? quiz.currentQuestion ?? 0;
    const question = quiz.questions?.[index] ?? null;

    const answers = round.instanceId
        ? await LiveAnswer.find({ instanceId: round.instanceId })
              .sort({ elapsedMs: 1 })
              .select('participantId name teamId teamName option elapsedMs isCorrect pointsAwarded')
              .lean()
        : [];

    return {
        quizType: 'custom_live',
        scope: quiz.scope ?? 'individual',
        state: effectiveRoundState(round, now),
        storedState: round.state ?? ROUND_STATE.IDLE,
        questionIndex: index,
        totalQuestions: quiz.questions?.length ?? 0,
        question: question
            ? {
                  text: question.text,
                  type: question.type ?? 'choice',
                  options: question.options,
                  points: question.points,
                  correctAnswer: question.correctAnswer, // host only
              }
            : null,
        liveRound: {
            instanceId: round.instanceId ? String(round.instanceId) : null,
            openedAt: round.openedAt ?? null,
            endsAt: round.endsAt ?? null,
            durationSeconds: round.durationSeconds ?? null,
            revealedAt: round.revealedAt ?? null,
            target: round.target ?? { kind: 'all', teamIds: [] },
        },
        roundClock: quiz.roundClock ?? null,
        // The console's difficulty panel is built from this. Without it the
        // host cannot see whose turn it is or what they picked.
        choice: quiz.choice?.state && quiz.choice.state !== 'idle' ? {
            state: quiz.choice.state,
            teamId: quiz.choice.teamId ?? null,
            teamName: quiz.choice.teamName ?? null,
            difficulty: quiz.choice.difficulty ?? null,
            endsAt: quiz.choice.endsAt ?? null,
            chosenBy: quiz.choice.chosenBy ?? null,
        } : null,
        answers: answers.map((a) => ({
            participantId: a.participantId,
            name: a.name,
            teamId: a.teamId,
            teamName: a.teamName,
            option: a.option,
            elapsedMs: a.elapsedMs,
            isCorrect: a.isCorrect,
            pointsAwarded: a.pointsAwarded,
        })),
        answerCount: answers.length,
        // The console counts down to this, corrected against serverTime, for
        // the same reason the phones do.
        serverTime: now.toISOString(),
    };
}

/**
 * Electric Answers, driven from the console.
 *
 * The machine decides what is legal; this performs the effects and owns every
 * write. Two things it has to work out first, because the machine deliberately
 * cannot read them: who is next in the buzz queue, and who has not had a go
 * yet. Both live in `buzz_presses`, and handing them to the machine as payload
 * is what keeps it testable without a database.
 */
async function runBuzzerCommand({ activity, quiz, action, payload, actor }) {
    const now = new Date();
    const before = quiz.buzzer?.round ?? {};
    const context = { ...payload };

    if (action === BUZZER_COMMAND.PASS) {
        context.nextTeam = await nextInQueue(before);
    }

    if (action === BUZZER_COMMAND.REBUZZ) {
        context.remainingTeamIds = remainingTeams(before, await pressedTeamIds(before));
    }

    const staging = action === BUZZER_COMMAND.STAGE_QUESTION
        || (action === BUZZER_COMMAND.INSERT_QUESTION && payload.stage);

    let roster = null;
    if (staging || action === BUZZER_COMMAND.START_TIEBREAK || action === BUZZER_COMMAND.END_GAME) {
        roster = await eligibleTeams(activity, quiz);
        // A tie-break goes out only to the teams the host named. Everything
        // else goes out to everyone in the round.
        if (staging) context.eligibleTeamIds = roster.ids;
    }

    const verdict = canRunBuzzer(action, quiz, context, now);
    if (!verdict.ok) {
        return conflict(verdict.reason, {
            code: 'ILLEGAL_TRANSITION',
            phase: effectiveBuzzerPhase(before, now),
        });
    }

    // Captured before the effects run: MARK_* records an attempt for the team
    // on the seat now, not for whoever the round moves on to.
    const judgedSeat = (action === BUZZER_COMMAND.MARK_CORRECT || action === BUZZER_COMMAND.MARK_WRONG)
        ? {
            ...(before.seat ?? {}),
            questionIndex: before.questionIndex ?? 0,
            instanceId: before.instanceId,
            isTiebreak: before.isTiebreak,
        }
        : null;

    applyBuzzerEffects({
        command: action,
        payload: context,
        quiz,
        now,
        // A fresh instance for every staging, for the same reason a live round
        // mints one on every open: a re-asked question must not collide with
        // the presses and attempts of the one that was abandoned.
        newInstanceId: staging || action === BUZZER_COMMAND.START_TIEBREAK
            ? new mongoose.Types.ObjectId()
            : before.instanceId ?? null,
    });

    quiz.buzzer.round.phase = verdict.nextPhase;

    // Marked narrowly on purpose. `markModified('quiz.buzzer')` would rewrite
    // the whole subtree, and a press claiming the seat in the same moment would
    // be undone by a command that never meant to touch it.
    activity.markModified('quiz.buzzer.round');
    if (action === BUZZER_COMMAND.SET_ANSWERER) activity.markModified('quiz.buzzer.answerers');
    if (action === BUZZER_COMMAND.INSERT_QUESTION || action === BUZZER_COMMAND.START_TIEBREAK) {
        activity.markModified('quiz.questions');
    }
    await activity.save();

    if (judgedSeat?.teamId) {
        await recordJudgement({
            activity,
            quiz,
            seat: judgedSeat,
            outcome: judgementOutcome(action, judgedSeat, now),
            actor,
            now,
        });
    }

    // The board is denormalised onto the activity, so it is rebuilt whenever a
    // score could have moved — and seeded when a round is staged, so the lobby
    // shows every team at zero rather than an empty list.
    if (judgedSeat?.teamId || roster) {
        await refreshStandings({
            activityId: activity._id,
            teams: (roster ?? await eligibleTeams(activity, quiz)).teams,
        });
    }

    const round = quiz.buzzer.round;
    return NextResponse.json({
        success: true,
        phase: round.phase,
        buzzer: {
            instanceId: round.instanceId ? String(round.instanceId) : null,
            questionIndex: round.questionIndex,
            answerMode: round.answerMode,
            armsAt: round.armsAt,
            buzzClosesAt: round.buzzClosesAt,
            seat: round.seat?.teamId ? round.seat : null,
            eligibleTeamIds: round.eligibleTeamIds,
            lockedOutTeamIds: round.lockedOutTeamIds,
            attemptedTeamIds: round.attemptedTeamIds,
            isTiebreak: round.isTiebreak,
        },
        serverTime: now.toISOString(),
        changedBy: actor.email || actor.name,
    });
}

/** The next team down the queue that has not already had the seat. */
async function nextInQueue(round) {
    if (!round?.instanceId) return null;

    const presses = await BuzzPress.find({ instanceId: round.instanceId, falseStart: false })
        .sort({ receivedAt: 1 })
        .select('teamId teamName email name receivedAt')
        .lean();

    const attempted = new Set((round.attemptedTeamIds ?? []).map(String));
    const next = presses.find((p) => !attempted.has(String(p.teamId)));
    if (!next) return null;

    return {
        teamId: String(next.teamId),
        teamName: next.teamName ?? null,
        leaderEmail: next.email ?? null,
        leaderName: next.name ?? null,
        pressedAt: next.receivedAt,
    };
}

/** Everyone with a press on record for this staging, false starts included. */
async function pressedTeamIds(round) {
    if (!round?.instanceId) return [];
    const rows = await BuzzPress.find({ instanceId: round.instanceId }).select('teamId').lean();
    return rows.map((r) => String(r.teamId));
}

/** The teams in this round, and their ids — the roster the board is built on. */
async function eligibleTeams(activity, quiz) {
    const teams = await listEventTeams(activity.eventId);
    const allow = (quiz.buzzer?.teamIds ?? []).map(String);
    const chosen = allow.length ? teams.filter((t) => allow.includes(String(t.teamId))) : teams;
    return { teams: chosen, ids: chosen.map((t) => String(t.teamId)) };
}

/**
 * A wrong answer and a silence are both wrong, but they are not the same thing
 * to read back afterwards: one team answered and missed, the other let the
 * clock run out. Both cost the same.
 */
function judgementOutcome(action, seat, now) {
    if (action === BUZZER_COMMAND.MARK_CORRECT) return 'correct';
    if (seat.submittedAnswer) return 'wrong';
    return seat.answerEndsAt && now > new Date(seat.answerEndsAt) ? 'timeout' : 'wrong';
}

/**
 * The host's verdict on one seat.
 *
 * Upserted rather than inserted: MARK_CORRECT after an in-app grade is an
 * override, and an override has to replace the row it overrides rather than
 * score the question twice.
 */
async function recordJudgement({ activity, quiz, seat, outcome, actor, now }) {
    const question = quiz.questions?.[seat.questionIndex ?? 0];
    const settings = buzzerSettings(quiz);
    const attempt = seat.attempt || 1;
    const seatedAt = seat.seatedAt ?? seat.pressedAt ?? now;

    await BuzzAttempt.updateOne(
        { instanceId: seat.instanceId, teamId: String(seat.teamId) },
        {
            $set: {
                activityId: activity._id,
                eventId: activity.eventId,
                questionIndex: seat.questionIndex ?? 0,
                teamName: seat.teamName ?? null,
                attempt,
                answerMode: quiz.buzzer?.round?.answerMode ?? settings.answerMode,
                submittedAnswer: seat.submittedAnswer ?? null,
                judgedBy: actor.email || actor.name || 'host',
                outcome,
                points: buzzerPoints({ question, settings, attempt, outcome }),
                isTiebreak: Boolean(seat.isTiebreak),
                seatMs: Math.max(0, now.getTime() - new Date(seatedAt).getTime()),
                decidedAt: now,
            },
        },
        { upsert: true },
    );
}

/**
 * Electric Answers console state.
 *
 * Everything the control room needs and nobody in the room may see: the correct
 * answer, every press with the offset that decided it, the seat with its clock,
 * the attempts so far, and who is tied where it matters.
 */
async function buzzerConsoleState(activity) {
    const quiz = activity.quiz ?? {};
    const round = quiz.buzzer?.round ?? {};
    const now = new Date();
    const index = round.questionIndex ?? quiz.currentQuestion ?? 0;
    const question = quiz.questions?.[index] ?? null;
    const settings = buzzerSettings(quiz);

    const [presses, attempts] = round.instanceId
        ? await Promise.all([
            BuzzPress.find({ instanceId: round.instanceId })
                .sort({ receivedAt: 1 })
                .select('teamId teamName name email offsetMs falseStart receivedAt')
                .lean(),
            BuzzAttempt.find({ instanceId: round.instanceId })
                .sort({ attempt: 1 })
                .select('teamId teamName attempt outcome points submittedAnswer judgedBy')
                .lean(),
        ])
        : [[], []];

    const standings = quiz.buzzer?.standings ?? [];

    return {
        quizType: 'buzzer',
        phase: effectiveBuzzerPhase(round, now),
        storedPhase: round.phase ?? BUZZER_PHASE.LOBBY,
        settings,
        questionIndex: index,
        totalQuestions: quiz.questions?.length ?? 0,
        question: question
            ? {
                  text: question.text,
                  type: buzzerQuestionType(question),
                  options: question.options ?? [],
                  points: question.points,
                  correctAnswer: question.correctAnswer ?? null, // host only
                  acceptedAnswers: question.acceptedAnswers ?? [],
                  source: question.source ?? 'pack',
              }
            : null,
        round: {
            instanceId: round.instanceId ? String(round.instanceId) : null,
            answerMode: round.answerMode ?? settings.answerMode,
            showOptionsBeforeBuzz: round.showOptionsBeforeBuzz !== false,
            stagedAt: round.stagedAt ?? null,
            armsAt: round.armsAt ?? null,
            buzzClosesAt: round.buzzClosesAt ?? null,
            eligibleTeamIds: round.eligibleTeamIds ?? [],
            lockedOutTeamIds: round.lockedOutTeamIds ?? [],
            attemptedTeamIds: round.attemptedTeamIds ?? [],
            seat: round.seat?.teamId ? round.seat : null,
            isTiebreak: Boolean(round.isTiebreak),
        },
        // Sorted by arrival, each with the offset from `armsAt` that decided
        // it. Two presses a few milliseconds apart were effectively a tie, and
        // the host is the only one who can say so.
        presses: presses.map((p, i) => ({
            position: p.falseStart ? null : i,
            teamId: p.teamId,
            teamName: p.teamName,
            name: p.name,
            offsetMs: p.offsetMs,
            falseStart: p.falseStart,
            receivedAt: p.receivedAt,
        })),
        attempts,
        standings,
        tiedTeams: tiedTeams(standings, settings.tieScope),
        answerers: quiz.buzzer?.answerers ?? [],
        serverTime: now.toISOString(),
    };
}

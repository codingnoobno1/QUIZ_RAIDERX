import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import AudiencePollVote from '@/models/AudiencePollVote';
import FastestFingerSubmission from '@/models/FastestFingerSubmission';
import { canRun, fiftyFiftyEliminations, COMMAND, PHASE } from '@/lib/kbc/machine';
import LiveAnswer from '@/models/LiveAnswer';
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
                serverTime: now.toISOString(),
                changedBy: auth.actor.email || auth.actor.name,
            });
        }

        return badRequest(
            'This activity is not host-paced. Live commands apply to kbc and custom_live quizzes.',
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

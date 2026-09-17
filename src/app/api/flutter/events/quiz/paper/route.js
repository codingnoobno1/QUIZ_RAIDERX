import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import QuizPaper from '@/models/QuizPaper';
import QuizSubmission from '@/models/QuizSubmission';
import { resolveParticipantTeam } from '@/lib/live/rounds';
import {
    GRACE_MS,
    bankShortfalls,
    dealPaper,
    gradePaper,
    paperConfig,
    paperState,
    remainingMs,
    renderPaper,
} from '@/lib/quiz/paper';
import {
    requireEventUser,
    readJson,
    invalidIdResponse,
    badRequest,
    conflict,
    forbidden,
    notFound,
    serverError,
} from '@/lib/apiGuards';

/**
 * /api/flutter/events/quiz/paper — a generated paper, its clock, and its answers.
 *
 *   GET    issue or re-open this entrant's paper
 *   PATCH  save answers as they are chosen
 *   POST   submit
 *
 * Three things are the server's alone: which questions this team was dealt,
 * when their thirty minutes end, and whether an answer is right. The client
 * gets questions with options in their dealt order and never a correct answer.
 *
 * The deadline needs no scheduled job. A paper whose `endsAt` has passed is
 * closed to writes, and the next read finalises it from whatever was saved —
 * so a team that closes the laptop still scores what they had answered.
 */

/** GET ?activityId= */
export async function GET(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const activityId = new URL(req.url).searchParams.get('activityId');
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const context = await load(activityId, auth);
        if (context.response) return context.response;

        const { activity, quiz, config, owner } = context;

        let paper = await QuizPaper.findOne({ activityId, ownerKey: owner.key });

        if (!paper) {
            const shortfalls = bankShortfalls(quiz.questions, config.counts);
            if (shortfalls.length) {
                // Refused rather than dealt short. A team discovering mid-round
                // that their paper has four hard questions instead of five has
                // no remedy; an organiser told before the round does.
                return conflict('This quiz cannot be generated from its question bank yet.', {
                    code: 'BANK_TOO_SMALL',
                    shortfalls,
                });
            }
            paper = await issue({ activity, quiz, config, owner, email: auth.email });
        }

        // The deadline passed while nobody was looking — a closed laptop, a
        // dead battery. Finalise from what was saved, dated to the deadline
        // rather than to whenever this read happened, so the score reaches the
        // board without anyone having to press submit.
        if (paperState(paper) === 'closed') {
            paper = await finalise(paper, activity, quiz, config, new Date(paper.endsAt));
        }

        return NextResponse.json({ success: true, data: await present(paper, quiz, config) });
    } catch (error) {
        return serverError(error, 'flutter/events/quiz/paper/read');
    }
}

/**
 * PATCH { activityId, answers: { [questionId]: option } }
 *
 * Merges rather than replaces, so a save that crosses another one cannot wipe
 * an answer, and a dropped request costs at most one selection.
 */
export async function PATCH(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, answers } = parsed.data;
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;
    if (!answers || typeof answers !== 'object') return badRequest('answers must be an object.');

    try {
        await connectDB();

        const context = await load(activityId, auth);
        if (context.response) return context.response;
        const { quiz, config, owner } = context;

        const paper = await QuizPaper.findOne({ activityId, ownerKey: owner.key });
        if (!paper) return notFound('Open the paper before answering it.', { code: 'NO_PAPER' });

        const state = paperState(paper);
        if (state !== 'open') {
            return conflict(
                state === 'submitted' ? 'This paper has been submitted.' : 'Time is up for this paper.',
                { code: state === 'submitted' ? 'ALREADY_SUBMITTED' : 'TOO_LATE' },
            );
        }

        const onPaper = new Map(paper.items.map((i) => [String(i.questionId), i]));
        const optionsById = new Map((quiz.questions ?? []).map((q) => [String(q._id), q.options ?? []]));
        const $set = {};

        for (const [questionId, option] of Object.entries(answers)) {
            // Only questions on this entrant's own paper, and only options the
            // question actually offers.
            if (!onPaper.has(String(questionId))) continue;
            if (option !== null && !optionsById.get(String(questionId))?.includes(option)) continue;
            $set[`answers.${questionId}`] = option;
        }

        if (!Object.keys($set).length) return badRequest('No answer matched this paper.');

        const saved = await QuizPaper.findOneAndUpdate(
            { _id: paper._id, submittedAt: null },
            { $set },
            { new: true },
        );
        if (!saved) return conflict('This paper has been submitted.', { code: 'ALREADY_SUBMITTED' });

        return NextResponse.json({
            success: true,
            savedCount: Object.keys($set).length,
            answeredCount: saved.answers?.size ?? 0,
            remainingMs: remainingMs(saved),
            serverTime: new Date().toISOString(),
        });
    } catch (error) {
        return serverError(error, 'flutter/events/quiz/paper/save');
    }
}

/** POST { activityId } — submit now. */
export async function POST(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId } = parsed.data;
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const context = await load(activityId, auth);
        if (context.response) return context.response;
        const { activity, quiz, config, owner } = context;

        const paper = await QuizPaper.findOne({ activityId, ownerKey: owner.key });
        if (!paper) return notFound('There is no paper to submit.', { code: 'NO_PAPER' });

        if (paper.submittedAt) {
            return NextResponse.json({
                success: true,
                alreadySubmitted: true,
                data: await present(paper, quiz, config),
            });
        }

        const now = new Date();
        if (now.getTime() > new Date(paper.endsAt).getTime() + GRACE_MS) {
            // Late, but not lost: finalise what was saved before the deadline.
            const finalised = await finalise(paper, activity, quiz, config, new Date(paper.endsAt));
            return conflict('Time was up, so the answers saved before the deadline were submitted.', {
                code: 'TOO_LATE',
                data: await present(finalised, quiz, config),
            });
        }

        const finalised = await finalise(paper, activity, quiz, config, now);
        return NextResponse.json({ success: true, data: await present(finalised, quiz, config) });
    } catch (error) {
        return serverError(error, 'flutter/events/quiz/paper/submit');
    }
}

// ── Shared ───────────────────────────────────────────────────────────────────

/** The activity, its paper settings, and who is sitting it. */
async function load(activityId, auth) {
    const activity = await EventActivity.findById(activityId).lean();
    if (!activity || activity.type !== 'quiz') {
        return { response: notFound('Quiz activity not found.') };
    }
    if (activity.status !== 'active') {
        return { response: forbidden('This quiz is not running.', { code: 'NOT_ACTIVE' }) };
    }

    const quiz = activity.quiz ?? {};
    if (!quiz.paper?.enabled) {
        return {
            response: badRequest('This quiz does not use generated papers.', { code: 'NOT_A_PAPER_QUIZ' }),
        };
    }

    const isTeamScope = quiz.scope === 'team';
    const team = isTeamScope
        ? await resolveParticipantTeam(activity.eventId, auth.email)
        : { teamId: null, teamName: null };

    if (isTeamScope && !team.teamId) {
        return {
            response: conflict('This round is sat by teams, and you are not registered with one.', {
                code: 'NO_TEAM',
            }),
        };
    }

    return {
        activity,
        quiz,
        config: paperConfig(quiz),
        owner: {
            key: isTeamScope ? team.teamId : auth.email,
            scope: isTeamScope ? 'team' : 'individual',
            teamId: team.teamId,
            teamName: team.teamName,
        },
    };
}

/**
 * Deal and store the paper.
 *
 * The seed is the activity and the entrant, so the same paper can be
 * regenerated from those two ids alone. On a race the unique index decides, and
 * the loser reads the winner's paper — never a second, different one.
 */
async function issue({ activity, quiz, config, owner, email }) {
    const now = new Date();
    const { items } = dealPaper({
        questions: quiz.questions,
        config,
        seed: `${activity._id}:${owner.key}`,
    });

    const durationSeconds = Math.max(1, Math.round(config.durationMinutes * 60));

    try {
        return await QuizPaper.create({
            activityId: activity._id,
            eventId: activity.eventId,
            ownerKey: owner.key,
            scope: owner.scope,
            teamId: owner.teamId,
            teamName: owner.teamName,
            issuedTo: email,
            items,
            startedAt: now,
            endsAt: new Date(now.getTime() + durationSeconds * 1000),
            durationSeconds,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return QuizPaper.findOne({ activityId: activity._id, ownerKey: owner.key });
        }
        throw error;
    }
}

/**
 * Grade, stamp, and write a QuizSubmission.
 *
 * The submission is what every existing reader already understands — the
 * leaderboard, the reports, the one-attempt indexes — so a generated paper
 * lands on the same board as every other quiz without special cases.
 */
async function finalise(paper, activity, quiz, config, at) {
    const questionsById = new Map((quiz.questions ?? []).map((q) => [String(q._id), q]));
    const graded = gradePaper(paper, questionsById);

    const stamped = await QuizPaper.findOneAndUpdate(
        { _id: paper._id, submittedAt: null },
        {
            $set: {
                submittedAt: at,
                score: graded.score,
                correctCount: graded.correctCount,
                totalPossible: graded.totalPossible,
            },
        },
        { new: true },
    );

    // Someone else submitted in the gap; theirs stands.
    if (!stamped) return QuizPaper.findById(paper._id);

    const timeTakenSeconds = Math.max(
        0,
        Math.round((at.getTime() - new Date(paper.startedAt).getTime()) / 1000),
    );

    try {
        await QuizSubmission.create({
            activityId: activity._id,
            eventId: activity.eventId,
            participantId: paper.issuedTo,
            teamId: paper.teamId,
            teamName: paper.teamName,
            ...(paper.scope === 'team' ? { teamKey: paper.teamId } : {}),
            scope: paper.scope,
            answers: graded.answers,
            score: graded.score,
            totalPossible: graded.totalPossible,
            correctCount: graded.correctCount,
            totalQuestions: graded.totalQuestions,
            percentage: graded.percentage,
            quizType: quiz.quizType,
            timeTakenSeconds,
        });
    } catch (error) {
        // A submission already exists for this entrant. The paper is the record
        // of what they sat either way, so this is not worth failing on.
        if (error?.code !== 11000) throw error;
    }

    return stamped;
}

/**
 * The paper as the client may see it.
 *
 * Correct answers appear only once it is submitted — the same rule as the live
 * round: nothing that could tell a team what to pick while they can still pick.
 */
async function present(paper, quiz, config) {
    const questionsById = new Map((quiz.questions ?? []).map((q) => [String(q._id), q]));
    const state = paperState(paper);
    const answers = paper.answers instanceof Map ? paper.answers : new Map();

    const base = {
        paperId: String(paper._id),
        state,
        startedAt: paper.startedAt,
        endsAt: paper.endsAt,
        durationSeconds: paper.durationSeconds,
        remainingMs: remainingMs(paper),
        serverTime: new Date().toISOString(),
        scope: paper.scope,
        teamName: paper.teamName,
        totalQuestions: paper.items?.length ?? 0,
        totalPossible: paper.items?.reduce((sum, i) => sum + i.points, 0) ?? 0,
        answeredCount: answers.size,
        savedAnswers: Object.fromEntries(answers),
        questions: renderPaper(paper, questionsById),
        // How long the client should wait before asking again. Tight while the
        // clock runs so a reopened paper shows the right time left.
        pollAfterMs: state === 'open' ? 15000 : 60000,
    };

    if (state !== 'submitted') return base;

    const graded = gradePaper(paper, questionsById);
    return {
        ...base,
        submittedAt: paper.submittedAt,
        score: paper.score,
        correctCount: paper.correctCount,
        percentage: graded.percentage,
        result: graded.answers,
    };
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import QuizSubmission from '@/models/QuizSubmission';
import { resolveParticipantTeam } from '@/lib/live/rounds';
import { teamIsQualified } from '@/lib/rounds/qualification';
import {
    requireEventUser,
    readJson,
    invalidIdResponse,
    badRequest,
    notFound,
    conflict,
    serverError,
} from '@/lib/apiGuards';

/**
 * POST /api/flutter/events/quiz/submit
 *
 * A whole self-paced attempt at once: `rapid_fire` and `preloaded`. The
 * host-paced format answers one question at a time through `quiz/answer`.
 *
 * Grading has always happened here against the stored `correctAnswer`, which is
 * the part worth keeping. Three things it did not do:
 *
 *   - it took `participantId` from the request body, so any caller could submit
 *     as anybody, including someone who never sat the quiz;
 *   - it had no notion of a team, so a team-scoped round scored six people
 *     separately;
 *   - it kept the best of repeated attempts, which in a competitive round means
 *     a participant may retake until satisfied.
 *
 * Versioned the same way `status` is, and for the same reason: a build of the
 * mobile client is already deployed and calls this route with a body-supplied
 * `participantId` and no guarantee of a session. v1 keeps that contract exactly
 * as it was. v2 — `?v=2` — is the strict one: session identity, team scope, one
 * attempt. Team-scoped scoring requires v2, because there is no honest way to
 * score a team from an unauthenticated claim about who is submitting.
 *
 * Delete v1 once the store build has rolled over.
 *
 * Body: { activityId, answers: [{ questionId, selectedOption }], timeTakenSeconds? }
 */
export async function POST(req) {
    const strict = Number(new URL(req.url).searchParams.get('v')) >= 2;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, answers, timeTakenSeconds } = parsed.data;

    if (!activityId || !Array.isArray(answers)) {
        return badRequest('activityId and answers[] are required.');
    }
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    let participantId;

    if (strict) {
        const auth = await requireEventUser(req);
        if (!auth.ok) return auth.response;

        // The identity is the session's. A body that disagrees is a client bug
        // worth seeing in the logs, not a reason to throw away a quiz the
        // participant has already sat through.
        participantId = auth.email;
        if (parsed.data.participantId && parsed.data.participantId !== participantId) {
            console.warn('[api:flutter/events/quiz/submit] body participantId ignored', {
                claimed: parsed.data.participantId,
                session: participantId,
            });
        }
    } else {
        participantId = parsed.data.participantId;
        if (!participantId) return badRequest('participantId is required.');
    }

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId).lean();
        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');

        const quiz = activity.quiz ?? {};
        const questions = quiz.questions ?? [];
        // Only v2 can be trusted to say who is submitting, so only v2 scores
        // by team. A v1 client against a team-scoped quiz still submits — it is
        // simply scored as an individual, which is what it has always done.
        const isTeamScope = strict && quiz.scope === 'team';

        const team = isTeamScope
            ? await resolveParticipantTeam(activity.eventId, participantId)
            : { teamId: null, teamName: null };

        if (isTeamScope && !team.teamId) {
            return conflict('This quiz is scored by team, and you are not registered with one.', {
                code: 'NO_TEAM',
            });
        }


        // A legacy v1 caller supplies its own identity, so it cannot prove it
        // belongs to a restricted roster. Restricted rounds deliberately
        // require the session-backed contract.
        if (quiz.qualificationRoundId && !strict) {
            return conflict('Update the app to enter this restricted round.', {
                code: 'CLIENT_UPDATE_REQUIRED',
            });
        }

        if (!(await teamIsQualified({ quiz, eventId: activity.eventId, teamId: team.teamId }))) {
            return conflict('Your team did not qualify for this round.', { code: 'NOT_QUALIFIED' });
        }

        // One attempt, unless the activity says otherwise. Checked here so the
        // message can be useful; the unique indexes are what hold when two
        // teammates submit at the same moment.
        const existing = await QuizSubmission.findOne(
            isTeamScope
                ? { activityId, teamKey: team.teamId }
                : { activityId, participantId },
        ).lean();

        if (existing && strict && !quiz.allowRetake) {
            const mine = existing.participantId === participantId;
            return conflict(
                mine
                    ? 'You have already submitted this quiz.'
                    : `${existing.participantId} already submitted for your team.`,
                {
                    code: mine ? 'ALREADY_SUBMITTED' : 'ALREADY_SUBMITTED_BY_TEAMMATE',
                    score: existing.score,
                    correctCount: existing.correctCount,
                    totalQuestions: existing.totalQuestions,
                    percentage: existing.percentage,
                    answers: existing.answers,
                },
            );
        }

        const graded = grade(questions, answers);

        if (existing) {
            // Retakes are enabled: keep the better attempt rather than the
            // latest, so a worse retry cannot cost someone their score.
            const better = graded.score > existing.score;

            if (better) {
                await QuizSubmission.updateOne(
                    { _id: existing._id },
                    {
                        $set: {
                            answers: graded.answers,
                            score: graded.score,
                            correctCount: graded.correctCount,
                            percentage: graded.percentage,
                            timeTakenSeconds: timeTakenSeconds ?? null,
                            submittedAt: new Date(),
                        },
                    },
                );
            }

            const best = better ? graded : existing;
            return NextResponse.json({
                success: true,
                alreadySubmitted: true,
                bestScoreKept: better,
                score: best.score,
                totalPossible: graded.totalPossible,
                correctCount: best.correctCount,
                totalQuestions: questions.length,
                percentage: best.percentage,
                answers: graded.answers,
            });
        }

        await QuizSubmission.create({
            activityId,
            eventId: activity.eventId,
            participantId,
            teamId: team.teamId,
            teamName: team.teamName,
            ...(isTeamScope ? { teamKey: team.teamId } : {}),
            scope: isTeamScope ? 'team' : 'individual',
            answers: graded.answers,
            score: graded.score,
            totalPossible: graded.totalPossible,
            correctCount: graded.correctCount,
            totalQuestions: questions.length,
            percentage: graded.percentage,
            quizType: quiz.quizType,
            timeTakenSeconds: timeTakenSeconds ?? null,
        });

        return NextResponse.json({
            success: true,
            score: graded.score,
            totalPossible: graded.totalPossible,
            correctCount: graded.correctCount,
            totalQuestions: questions.length,
            percentage: graded.percentage,
            answers: graded.answers,
        });

    } catch (err) {
        if (err?.code === 11000) {
            return conflict('That attempt was already recorded.', { code: 'DUPLICATE_SUBMISSION' });
        }
        return serverError(err, 'flutter/events/quiz/submit');
    }
}

/**
 * Grade every question, not every submitted answer — a question the client
 * skipped still counts against the total, and a `questionId` the quiz does not
 * contain is ignored rather than scored.
 */
function grade(questions, answers) {
    let score = 0;
    let correctCount = 0;
    const totalPossible = questions.reduce((sum, q) => sum + (q.points || 10), 0);

    const graded = questions.map((q) => {
        const submitted = answers.find((a) => a.questionId === q._id?.toString());
        const selected = submitted?.selectedOption ?? null;
        const normalise = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
        const isCorrect = selected !== null && (
            q.type === 'text'
                ? Boolean(String(selected).trim()) && normalise(selected) === normalise(q.correctAnswer)
                : selected === q.correctAnswer
        );
        const pointsAwarded = isCorrect ? (q.points || 10) : 0;

        if (isCorrect) {
            score += pointsAwarded;
            correctCount += 1;
        }

        return {
            questionId: q._id?.toString(),
            questionText: q.text,
            selectedOption: selected,
            correctAnswer: q.correctAnswer,
            isCorrect,
            pointsAwarded,
        };
    });

    return {
        answers: graded,
        score,
        correctCount,
        totalPossible,
        percentage: totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0,
    };
}

/**
 * GET /api/flutter/events/quiz/submit?activityId=[id]
 *
 * Restore a result when the app reopens.
 *
 * Under v2 the participant is the session's. The v1 `participantId` query
 * parameter let anyone read anyone else's attempt — correct answers included —
 * for any activity id they could guess, and it survives only until the deployed
 * client stops using it.
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const strict = Number(searchParams.get('v')) >= 2;
    const activityId = searchParams.get('activityId');

    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    let viewer;
    if (strict) {
        const auth = await requireEventUser(req);
        if (!auth.ok) return auth.response;
        viewer = auth.email;
    } else {
        viewer = searchParams.get('participantId');
        if (!viewer) return badRequest('participantId is required.');
    }

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId)
            .select('eventId quiz.scope').lean();
        if (!activity) return notFound('Quiz activity not found.');

        const isTeamScope = strict && activity.quiz?.scope === 'team';
        const team = isTeamScope
            ? await resolveParticipantTeam(activity.eventId, viewer)
            : { teamId: null };

        const submission = await QuizSubmission.findOne(
            isTeamScope && team.teamId
                ? { activityId, teamKey: team.teamId }
                : { activityId, participantId: viewer },
        ).lean();

        if (!submission) return NextResponse.json({ success: true, submitted: false });

        return NextResponse.json({
            success: true,
            submitted: true,
            submittedBy: submission.participantId,
            teamName: submission.teamName ?? null,
            score: submission.score,
            totalPossible: submission.totalPossible,
            correctCount: submission.correctCount,
            totalQuestions: submission.totalQuestions,
            percentage: submission.percentage,
            answers: submission.answers,
        });

    } catch (err) {
        return serverError(err, 'flutter/events/quiz/submit/get');
    }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import QuizSubmission from '@/models/QuizSubmission';
import { resolveParticipantTeam } from '@/lib/live/rounds';
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
 * Body: { activityId, answers: [{ questionId, selectedOption }], timeTakenSeconds? }
 */
export async function POST(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, answers, timeTakenSeconds } = parsed.data;

    if (!activityId || !Array.isArray(answers)) {
        return badRequest('activityId and answers[] are required.');
    }
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    // The identity is the session's, always. A body that disagrees is a client
    // bug worth seeing in the logs, not a reason to throw away a quiz the
    // participant has already sat through.
    const participantId = auth.email;
    if (parsed.data.participantId && parsed.data.participantId !== participantId) {
        console.warn('[api:flutter/events/quiz/submit] body participantId ignored', {
            claimed: parsed.data.participantId,
            session: participantId,
        });
    }

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId).lean();
        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');

        const quiz = activity.quiz ?? {};
        const questions = quiz.questions ?? [];
        const isTeamScope = quiz.scope === 'team';

        const team = isTeamScope
            ? await resolveParticipantTeam(activity.eventId, participantId)
            : { teamId: null, teamName: null };

        if (isTeamScope && !team.teamId) {
            return conflict('This quiz is scored by team, and you are not registered with one.', {
                code: 'NO_TEAM',
            });
        }

        // One attempt, unless the activity says otherwise. Checked here so the
        // message can be useful; the unique indexes are what hold when two
        // teammates submit at the same moment.
        const existing = await QuizSubmission.findOne(
            isTeamScope
                ? { activityId, teamKey: team.teamId }
                : { activityId, participantId },
        ).lean();

        if (existing && !quiz.allowRetake) {
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
        const isCorrect = selected !== null && selected === q.correctAnswer;
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
 * Restore a result when the app reopens. The participant is the session's — the
 * old `participantId` query parameter let anyone read anyone else's attempt,
 * correct answers included, for any activity id they could guess.
 */
export async function GET(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get('activityId');

    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId)
            .select('eventId quiz.scope').lean();
        if (!activity) return notFound('Quiz activity not found.');

        const isTeamScope = activity.quiz?.scope === 'team';
        const team = isTeamScope
            ? await resolveParticipantTeam(activity.eventId, auth.email)
            : { teamId: null };

        const submission = await QuizSubmission.findOne(
            isTeamScope && team.teamId
                ? { activityId, teamKey: team.teamId }
                : { activityId, participantId: auth.email },
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

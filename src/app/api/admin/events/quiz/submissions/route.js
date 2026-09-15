import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import EventRegistration from '@/models/EventRegistration';
import QuizSubmission from '@/models/QuizSubmission';
import { nameIndex } from '@/lib/live/activities';
import { requireAdmin, invalidIdResponse, notFound, serverError } from '@/lib/apiGuards';

/**
 * GET /api/admin/events/quiz/submissions?activityId=[id]
 *
 * Every attempt at a self-paced quiz, ranked, with the per-question breakdown.
 *
 * Admin only. The copy in the admin app accepted any signed-in session, and
 * this response carries every question's correct answer — so any account that
 * could sign in to that app could read the answer key for a quiz still running.
 *
 * Names cover team members too; the old lookup mapped only the person who
 * registered, so every other member appeared as unknown.
 */
export async function GET(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const activityId = new URL(req.url).searchParams.get('activityId');
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId)
            .select('title type quiz.quizType quiz.scope quiz.questions.points eventId')
            .lean();
        if (!activity) return notFound('Activity not found.');

        const [submissions, registrations] = await Promise.all([
            QuizSubmission.find({ activityId }).sort({ score: -1, submittedAt: 1 }).lean(),
            EventRegistration.find({ eventId: activity.eventId }).select('name email enrollmentNumber members').lean(),
        ]);

        const nameOf = nameIndex(registrations);
        const total = submissions.length;
        const sum = (key) => submissions.reduce((acc, s) => acc + (Number(s[key]) || 0), 0);

        return NextResponse.json({
            success: true,
            data: {
                activity: {
                    id: activityId,
                    title: activity.title,
                    quizType: activity.quiz?.quizType,
                    scope: activity.quiz?.scope ?? 'individual',
                    totalQuestions: activity.quiz?.questions?.length ?? 0,
                    totalPossible: (activity.quiz?.questions ?? []).reduce((s, q) => s + (q.points || 10), 0),
                },
                stats: {
                    total,
                    avgScore: total ? Math.round(sum('score') / total) : 0,
                    highScore: total ? submissions[0].score : 0,
                    avgPct: total ? Math.round(sum('percentage') / total) : 0,
                },
                leaderboard: submissions.map((s, i) => ({
                    rank: i + 1,
                    participantId: s.participantId,
                    fullName: nameOf(s.participantId),
                    teamId: s.teamId ?? null,
                    teamName: s.teamName ?? null,
                    score: s.score,
                    totalPossible: s.totalPossible,
                    correctCount: s.correctCount,
                    totalQuestions: s.totalQuestions,
                    percentage: s.percentage,
                    timeTakenSeconds: s.timeTakenSeconds,
                    submittedAt: s.submittedAt,
                    answers: s.answers,
                })),
            },
        });
    } catch (error) {
        return serverError(error, 'admin/events/quiz/submissions');
    }
}

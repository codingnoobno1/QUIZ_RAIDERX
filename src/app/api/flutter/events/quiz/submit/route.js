import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import QuizSubmission from '@/models/QuizSubmission';

/**
 * POST /api/flutter/events/quiz/submit
 *
 * Called when participant completes a quiz (rapid_fire or preloaded).
 * Grades server-side using stored correctAnswer, stores QuizSubmission.
 * Returns detailed score breakdown.
 *
 * Body: {
 *   activityId: string,
 *   participantId: string,
 *   answers: [{ questionId, selectedOption }],
 *   timeTakenSeconds?: number
 * }
 */
export async function POST(req) {
    try {
        await connectDB();
        const { activityId, participantId, answers, timeTakenSeconds } = await req.json();

        if (!activityId || !participantId || !Array.isArray(answers)) {
            return NextResponse.json(
                { error: 'activityId, participantId, and answers[] are required' },
                { status: 400 }
            );
        }

        // Load activity with full question data (including correctAnswer)
        const activity = await EventActivity.findById(activityId).lean();
        if (!activity || activity.type !== 'quiz') {
            return NextResponse.json({ error: 'Quiz activity not found' }, { status: 404 });
        }

        const questions = activity.quiz?.questions || [];

        // Grade each answer
        let score = 0;
        let correctCount = 0;
        const totalPossible = questions.reduce((s, q) => s + (q.points || 10), 0);

        const gradedAnswers = questions.map((q) => {
            const submitted = answers.find(a => a.questionId === q._id?.toString());
            const selected = submitted?.selectedOption ?? null;
            const isCorrect = selected !== null && selected === q.correctAnswer;
            const pts = isCorrect ? (q.points || 10) : 0;
            if (isCorrect) { score += pts; correctCount++; }
            return {
                questionId: q._id?.toString(),
                questionText: q.text,
                selectedOption: selected,
                correctAnswer: q.correctAnswer,
                isCorrect,
                pointsAwarded: pts
            };
        });

        const percentage = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;

        // Upsert — if participant re-submits, keep best score
        const existing = await QuizSubmission.findOne({ activityId, participantId });
        if (existing) {
            if (score > existing.score) {
                await QuizSubmission.updateOne(
                    { activityId, participantId },
                    { $set: { answers: gradedAnswers, score, correctCount, percentage, timeTakenSeconds, submittedAt: new Date() } }
                );
            }
            return NextResponse.json({
                success: true,
                alreadySubmitted: true,
                bestScoreKept: score > existing.score,
                score: score > existing.score ? score : existing.score,
                totalPossible,
                correctCount: score > existing.score ? correctCount : existing.correctCount,
                totalQuestions: questions.length,
                percentage: score > existing.score ? percentage : existing.percentage,
                answers: gradedAnswers
            });
        }

        await QuizSubmission.create({
            activityId,
            eventId: activity.eventId,
            participantId,
            answers: gradedAnswers,
            score,
            totalPossible,
            correctCount,
            totalQuestions: questions.length,
            percentage,
            quizType: activity.quiz?.quizType,
            timeTakenSeconds: timeTakenSeconds ?? null
        });

        return NextResponse.json({
            success: true,
            score,
            totalPossible,
            correctCount,
            totalQuestions: questions.length,
            percentage,
            answers: gradedAnswers
        });

    } catch (err) {
        if (err.code === 11000) {
            return NextResponse.json({ error: 'Already submitted', code: 'DUPLICATE_SUBMISSION' }, { status: 409 });
        }
        console.error('Quiz submit error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * GET /api/flutter/events/quiz/submit?activityId=[id]&participantId=[id]
 * Check if participant already submitted (so Flutter can restore result on re-open).
 */
export async function GET(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get('activityId');
        const participantId = searchParams.get('participantId');

        if (!activityId || !participantId) {
            return NextResponse.json({ error: 'activityId and participantId required' }, { status: 400 });
        }

        const submission = await QuizSubmission.findOne({ activityId, participantId }).lean();
        if (!submission) {
            return NextResponse.json({ success: true, submitted: false });
        }

        return NextResponse.json({
            success: true,
            submitted: true,
            score: submission.score,
            totalPossible: submission.totalPossible,
            correctCount: submission.correctCount,
            totalQuestions: submission.totalQuestions,
            percentage: submission.percentage,
            answers: submission.answers
        });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

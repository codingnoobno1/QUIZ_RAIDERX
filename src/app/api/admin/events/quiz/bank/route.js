import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import QuizPaper from '@/models/QuizPaper';
import { bankShortfalls, dealPaper, inPool, paperConfig, renderPaper, tally } from '@/lib/quiz/paper';
import { requireAdmin, invalidIdResponse, notFound, serverError } from '@/lib/apiGuards';

/**
 * GET /api/admin/events/quiz/bank?activityId=[id]&preview=1
 *
 * Can this bank produce the paper the settings ask for, and what does one look
 * like? Meant to be read before the round starts, because a bank that is short
 * of hard questions is discovered otherwise by the first team to open a paper.
 *
 * `preview=1` deals a throwaway paper under a preview seed. It is never stored
 * and never matches a real entrant's, so it cannot be used to learn what any
 * team will be asked.
 */
export async function GET(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const params = new URL(req.url).searchParams;
    const activityId = params.get('activityId');
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId).select('type title quiz').lean();
        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');

        const quiz = activity.quiz ?? {};
        const config = paperConfig(quiz);
        const questions = quiz.questions ?? [];
        const shortfalls = bankShortfalls(questions, config.counts, config.power);

        const asked = Object.values(config.counts).reduce((a, b) => a + b, 0);
        const maxScore = Object.entries(config.counts)
            .reduce((sum, [d, n]) => sum + n * (config.points[d] ?? 0), 0);
        const powerMax = config.power.enabled ? config.power.count * config.power.points : 0;

        const [issued, submitted] = await Promise.all([
            QuizPaper.countDocuments({ activityId }),
            QuizPaper.countDocuments({ activityId, submittedAt: { $ne: null } }),
        ]);

        const data = {
            activity: { id: String(activity._id), title: activity.title },
            enabled: Boolean(quiz.paper?.enabled),
            bankSize: questions.length,
            // Per pool: the regular bank is what papers draw on; power and
            // tie-break questions are reserves that never appear on a paper.
            available: tally(inPool(questions, 'regular')),
            pools: {
                regular: inPool(questions, 'regular').length,
                power: inPool(questions, 'power').length,
                tiebreak: inPool(questions, 'tiebreak').length,
            },
            power: config.power,
            maxScoreWithPower: maxScore + powerMax,
            asks: config.counts,
            pointsPerDifficulty: config.points,
            questionsPerPaper: asked,
            maxScore,
            durationMinutes: config.durationMinutes,
            shuffleQuestions: config.shuffleQuestions,
            shuffleOptions: config.shuffleOptions,
            ready: shortfalls.length === 0,
            shortfalls,
            papersIssued: issued,
            papersSubmitted: submitted,
        };

        if (params.get('preview') === '1' && !shortfalls.length) {
            const byId = new Map(questions.map((q) => [String(q._id), q]));
            const dealt = dealPaper({ questions, config, seed: `preview:${activityId}:${Date.now()}` });
            data.preview = renderPaper(dealt, byId);
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return serverError(error, 'admin/events/quiz/bank');
    }
}

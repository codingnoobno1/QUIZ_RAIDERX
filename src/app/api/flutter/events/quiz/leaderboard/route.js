import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import LiveAnswer from '@/models/LiveAnswer';
import QuizSubmission from '@/models/QuizSubmission';
import { resolveParticipantTeam } from '@/lib/live/rounds';
import { requireEventUser, invalidIdResponse, notFound, serverError } from '@/lib/apiGuards';

/**
 * GET /api/flutter/events/quiz/leaderboard?activityId=[id]&limit=[n]
 *
 * The board for one quiz, in whichever unit that quiz competes in — teams if
 * the activity is team-scoped, otherwise individuals. The scope is a property
 * of the activity, not a query parameter: letting a caller ask for individual
 * rankings in a team round would publish who on each team answered, which is
 * exactly what team scope is meant to stop mattering.
 *
 * Two sources, because two kinds of quiz write two shapes:
 *   custom_live          → LiveAnswer, one document per answer
 *   rapid_fire/preloaded → QuizSubmission, one document per attempt
 *
 * Ranking is score first, then least accumulated time — so of two teams on the
 * same score, the one that answered faster is ahead. That time was measured
 * server-side at submit and cannot be improved by a client.
 *
 * Safe to poll: it reads and never writes.
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get('activityId');
    const limit = clampLimit(searchParams.get('limit'));

    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId)
            .select('type eventId quiz.quizType quiz.scope quiz.questions.points')
            .lean();

        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');

        const isTeamScope = activity.quiz?.scope === 'team';
        const rows = activity.quiz?.quizType === 'custom_live'
            ? await fromLiveAnswers(activity._id, isTeamScope)
            : await fromSubmissions(activity._id, isTeamScope);

        // Ranked in memory rather than with $limit in the pipeline, because the
        // caller's own position has to be findable even when it is not on the
        // visible board. An activity is capped at `maxParticipants` (500 by
        // default), so the full grouping is small.
        rows.sort((a, b) => (b.score - a.score) || (a.totalElapsedMs - b.totalElapsedMs));
        const ranked = rows.map((row, i) => ({ rank: i + 1, ...row }));

        return NextResponse.json({
            success: true,
            data: {
                activityId: String(activity._id),
                scope: isTeamScope ? 'team' : 'individual',
                totalEntrants: ranked.length,
                rankings: ranked.slice(0, limit),
                me: await findMe(req, activity, ranked, isTeamScope),
                serverTime: new Date().toISOString(),
            },
        });

    } catch (error) {
        return serverError(error, 'flutter/events/quiz/leaderboard');
    }
}

function clampLimit(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 50;
    return Math.min(Math.max(Math.trunc(n), 1), 200);
}

async function fromLiveAnswers(activityId, isTeamScope) {
    const grouped = await LiveAnswer.aggregate([
        { $match: { activityId: new mongoose.Types.ObjectId(String(activityId)) } },
        {
            $group: {
                _id: isTeamScope ? '$teamKey' : '$participantId',
                score: { $sum: '$pointsAwarded' },
                correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
                answered: { $sum: 1 },
                totalElapsedMs: { $sum: '$elapsedMs' },
                displayName: { $first: isTeamScope ? '$teamName' : '$name' },
                teamId: { $first: '$teamId' },
                teamName: { $first: '$teamName' },
            },
        },
    ]);

    return grouped
        .filter((row) => row._id)
        .map((row) => ({
            key: String(row._id),
            name: row.displayName || String(row._id),
            teamId: row.teamId ?? null,
            teamName: row.teamName ?? null,
            score: row.score ?? 0,
            correct: row.correct ?? 0,
            answered: row.answered ?? 0,
            totalElapsedMs: row.totalElapsedMs ?? 0,
        }));
}

async function fromSubmissions(activityId, isTeamScope) {
    const grouped = await QuizSubmission.aggregate([
        { $match: { activityId: new mongoose.Types.ObjectId(String(activityId)) } },
        {
            $group: {
                _id: isTeamScope ? '$teamId' : '$participantId',
                // One submission per entrant is the intent, enforced by the
                // unique index. $max is the safety net for rows written before
                // that index existed.
                score: { $max: '$score' },
                correct: { $max: '$correctCount' },
                answered: { $max: '$totalQuestions' },
                totalElapsedMs: { $min: { $multiply: [{ $ifNull: ['$timeTakenSeconds', 0] }, 1000] } },
                teamName: { $first: '$teamName' },
            },
        },
    ]);

    return grouped
        .filter((row) => row._id)
        .map((row) => ({
            key: String(row._id),
            name: (isTeamScope ? row.teamName : null) || String(row._id),
            teamId: isTeamScope ? String(row._id) : null,
            teamName: row.teamName ?? null,
            score: row.score ?? 0,
            correct: row.correct ?? 0,
            answered: row.answered ?? 0,
            totalElapsedMs: row.totalElapsedMs ?? 0,
        }));
}

/**
 * The caller's own row, so a phone can show "you are 7th of 40" without pulling
 * down the whole board. Anonymous callers — the projector display, mostly — get
 * null rather than a 401; the board itself is not secret.
 */
async function findMe(req, activity, ranked, isTeamScope) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return null;

    let key = auth.email;
    if (isTeamScope) {
        const team = await resolveParticipantTeam(activity.eventId, auth.email);
        if (!team.teamId) return null;
        key = team.teamId;
    }

    return ranked.find((row) => row.key === String(key)) ?? null;
}

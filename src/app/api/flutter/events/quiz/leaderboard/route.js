import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import { resolveParticipantTeam } from '@/lib/live/rounds';
import { applyCut, rankActivity } from '@/lib/quiz/standings';
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
 * Ranking comes from `lib/quiz/standings`, the same function the organiser's
 * advancement screen uses, so a phone and the console cannot disagree about
 * who came 6th. When the activity sets an advancement count, each row says
 * whether it is currently going through — and once an organiser confirms the
 * cut, the confirmed list wins over the live calculation.
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
            .select('type eventId quiz.quizType quiz.scope quiz.advancement')
            .lean();

        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');

        const isTeamScope = activity.quiz?.scope === 'team';
        const advancement = activity.quiz?.advancement ?? {};
        const count = advancement.count ?? 0;
        const confirmed = advancement.confirmed?.at ? new Set(advancement.confirmed.keys ?? []) : null;

        const { rankings, tieAtCut } = applyCut(await rankActivity(activity), count);
        const final = confirmed
            ? rankings.map((r) => ({ ...r, advancing: confirmed.has(r.key), tiedAtCut: false }))
            : rankings;

        return NextResponse.json({
            success: true,
            data: {
                activityId: String(activity._id),
                scope: isTeamScope ? 'team' : 'individual',
                totalEntrants: final.length,
                rankings: final.slice(0, limit),
                advancement: count > 0
                    ? {
                        count,
                        confirmed: Boolean(confirmed),
                        // Only meaningful before confirmation; afterwards the
                        // organiser has decided it.
                        tieAtCut: confirmed ? false : tieAtCut.length > 0,
                    }
                    : null,
                me: await findMe(req, activity, final, isTeamScope),
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

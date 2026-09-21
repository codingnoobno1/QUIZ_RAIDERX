import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import EventRound from '@/models/EventRound';
import { applyCut, rankActivity } from '@/lib/quiz/standings';
import { indexTeams, listEventTeams } from '@/lib/rounds/roster';
import {
    requireAdmin,
    readJson,
    invalidIdResponse,
    badRequest,
    conflict,
    notFound,
    serverError,
} from '@/lib/apiGuards';

/**
 * /api/admin/events/quiz/standings — the ranking, and the cut into the next round.
 *
 *   GET  ?activityId=   ranking with who is currently through, any tie on the cut
 *   POST { activityId, count?, keys?, replace? }   confirm who advances
 *
 * The cut is computed live until an organiser confirms it; confirming freezes
 * the list, with who confirmed it and when, so a late re-grade or a straggling
 * submission cannot quietly change who went through.
 *
 * A tie that straddles the cut — level on score and on time — is not broken by
 * array order. Confirming while one exists is refused unless the organiser names
 * the advancing entrants explicitly, which is them deciding it.
 */

/** GET ?activityId= */
export async function GET(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const activityId = new URL(req.url).searchParams.get('activityId');
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId)
            .select('type title eventId quiz.quizType quiz.scope quiz.advancement').lean();
        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');

        return NextResponse.json({ success: true, data: await standings(activity) });
    } catch (error) {
        return serverError(error, 'admin/events/quiz/standings');
    }
}

/**
 * POST { activityId, count?, keys?, replace? }
 *
 *   count    how many advance; defaults to the activity's configured count
 *   keys     explicit list of entrant keys (teamIds, or emails for individuals);
 *            required when a tie sits on the cut
 *   replace  allow overwriting an earlier confirmation
 */
export async function POST(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, keys, replace } = parsed.data;
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId)
            .select('type title eventId quiz.quizType quiz.scope quiz.advancement').lean();
        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');

        const count = Number(parsed.data.count ?? activity.quiz?.advancement?.count ?? 0);
        if (!Number.isInteger(count) || count <= 0) {
            return badRequest('Set how many advance (count) before confirming.');
        }

        if (activity.quiz?.advancement?.confirmed?.at && !replace) {
            return conflict('Advancement was already confirmed. Send replace: true to change it.', {
                code: 'ALREADY_CONFIRMED',
                confirmed: activity.quiz.advancement.confirmed,
            });
        }

        const ranked = await rankActivity(activity);
        const { rankings, tieAtCut } = applyCut(ranked, count);
        const byKey = new Map(rankings.map((r) => [r.key, r]));

        let chosen;
        if (Array.isArray(keys) && keys.length) {
            const unknown = keys.filter((k) => !byKey.has(String(k)));
            if (unknown.length) {
                return badRequest('Some entrants are not on this board.', { code: 'UNKNOWN_ENTRANT', unknown });
            }
            if (keys.length !== count) {
                return badRequest(`Name exactly ${count} entrants, or change count.`, { code: 'WRONG_COUNT' });
            }
            chosen = keys.map(String);
        } else {
            if (tieAtCut.length) {
                return conflict('There is a tie on the cut. Name who advances with keys.', {
                    code: 'TIE_AT_CUT',
                    tied: rankings.filter((r) => r.tiedAtCut).map(summary),
                });
            }
            chosen = rankings.filter((r) => r.advancing).map((r) => r.key);
            if (chosen.length < count) {
                return conflict(`Only ${chosen.length} entrants have a score, fewer than ${count}.`, {
                    code: 'NOT_ENOUGH_ENTRANTS',
                });
            }
        }

        const confirmed = {
            keys: chosen,
            names: chosen.map((k) => byKey.get(k)?.name ?? k),
            at: new Date(),
            by: auth.actor?.email || auth.actor?.name || 'admin',
        };

        const targetRoundId = activity.quiz?.advancement?.targetRoundId;
        let targetRound = null;
        let targetTeams = null;
        if (targetRoundId) {
            if (activity.quiz?.scope !== 'team') {
                return badRequest('Automatic round rosters require a team-scoped quiz.', {
                    code: 'TEAM_SCOPE_REQUIRED',
                });
            }

            targetRound = await EventRound.findById(targetRoundId);
            if (!targetRound) return notFound('The configured advancement round no longer exists.');
            if (String(targetRound.eventId) !== String(activity.eventId)) {
                return badRequest('The configured advancement round belongs to another event.', {
                    code: 'WRONG_EVENT',
                });
            }

            const pool = await listEventTeams(activity.eventId);
            const byId = indexTeams(pool);
            const unknown = chosen.filter((id) => !byId.has(id));
            if (unknown.length) {
                return conflict('Some advancing teams are no longer registered for this event.', {
                    code: 'UNKNOWN_TEAM',
                    unknown,
                });
            }
            targetTeams = chosen.map((id) => ({
                teamId: id,
                teamName: byId.get(id).teamName,
                addedAt: new Date(),
                addedBy: confirmed.by,
            }));
        }

        const writes = [EventActivity.updateOne(
            { _id: activityId },
            { $set: { 'quiz.advancement.count': count, 'quiz.advancement.confirmed': confirmed } },
        )];

        if (targetRound) {
            targetRound.teams = targetTeams;
            targetRound.updatedBy = confirmed.by;
            targetRound.audit.push({
                at: new Date(),
                by: confirmed.by,
                action: 'sync-advancement',
                teamIds: chosen,
                detail: `Top ${count} from ${activity.title}`,
            });
            writes.push(targetRound.save());
        }

        await Promise.all(writes);

        const updated = await EventActivity.findById(activityId)
            .select('type title eventId quiz.quizType quiz.scope quiz.advancement').lean();

        return NextResponse.json({ success: true, data: await standings(updated) });
    } catch (error) {
        return serverError(error, 'admin/events/quiz/standings/confirm');
    }
}

async function standings(activity) {
    const advancement = activity.quiz?.advancement ?? {};
    const count = advancement.count ?? 0;
    const confirmedAt = advancement.confirmed?.at ?? null;
    const confirmedKeys = new Set(advancement.confirmed?.keys ?? []);

    const { rankings, tieAtCut, cutScore } = applyCut(await rankActivity(activity), count);

    return {
        activity: { id: String(activity._id), title: activity.title },
        scope: activity.quiz?.scope === 'team' ? 'team' : 'individual',
        advancementCount: count,
        targetRoundId: advancement.targetRoundId ? String(advancement.targetRoundId) : null,
        cutScore,
        tieAtCut: tieAtCut.length > 0,
        confirmed: confirmedAt
            ? {
                at: confirmedAt,
                by: advancement.confirmed.by,
                names: advancement.confirmed.names,
                // Has the live board moved since the cut was confirmed?
                differsFromLive: rankings.some((r) => r.advancing !== confirmedKeys.has(r.key)),
            }
            : null,
        rankings: rankings.map((r) => ({
            ...summary(r),
            confirmedAdvancing: confirmedAt ? confirmedKeys.has(r.key) : null,
        })),
    };
}

const summary = (r) => ({
    rank: r.rank,
    key: r.key,
    name: r.name,
    score: r.score,
    correct: r.correct,
    answered: r.answered,
    totalElapsedMs: r.totalElapsedMs,
    submittedAt: r.submittedAt ?? null,
    advancing: r.advancing,
    tiedAtCut: r.tiedAtCut,
});

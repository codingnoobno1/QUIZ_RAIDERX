import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import EventRegistration from '@/models/EventRegistration';
import {
    readJson,
    invalidIdResponse,
    badRequest,
    conflict,
    forbidden,
    notFound,
    unauthorized,
    serverError,
} from '@/lib/apiGuards';

/**
 * POST /api/events-engine/external-score — { activityId, teamId, score, signature }
 *
 * An external game posting a team's score back. Authenticated by an HMAC over
 * `${activityId}:${teamId}:${score}` with the activity's own `secretKey` — the
 * same scheme as before, so an integration that already signs correctly keeps
 * working.
 *
 * Three things refused that the admin app's copy accepted:
 *
 *   - An activity with no `secretKey`. The old check was `if (secretKey) verify`,
 *     so leaving the key blank let anyone post any score for any team. No key
 *     now means no scores.
 *   - A `teamId` that is not a team at this event. Scores are stored in a map
 *     keyed by team id; an arbitrary key became a phantom team on the board,
 *     and a key containing "." made Mongoose throw.
 *   - A negative or non-integer score.
 *
 * It no longer recomputes the leaderboard as a side effect. The board reads
 * scores when it is asked for.
 */
export async function POST(req) {
    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, teamId, score, signature } = parsed.data;

    if (!activityId || !teamId || score == null || !signature) {
        return badRequest('activityId, teamId, score and signature are required.');
    }
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    const points = Number(score);
    if (!Number.isInteger(points) || points < 0) return badRequest('score must be a whole number, 0 or more.');
    if (!/^[\w-]{1,64}$/.test(String(teamId))) return badRequest('teamId is not a valid team id.');

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId)
            .select('type status eventId external.secretKey').lean();
        if (!activity || activity.type !== 'external') return notFound('External activity not found.');
        if (activity.status !== 'active') return forbidden('This activity is not running.', { code: 'NOT_ACTIVE' });

        const secret = activity.external?.secretKey;
        if (!secret) {
            return conflict('This activity has no secret key, so it cannot accept scores. Set one in the console.', {
                code: 'NO_SECRET',
            });
        }

        const expected = Buffer.from(
            crypto.createHmac('sha256', secret).update(`${activityId}:${teamId}:${score}`).digest('hex'),
        );
        const supplied = Buffer.from(String(signature));
        if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
            return unauthorized('Invalid signature.', { code: 'BAD_SIGNATURE' });
        }

        const team = await EventRegistration.exists({ eventId: activity.eventId, teamId: String(teamId) });
        if (!team) return notFound('No team with that id is registered for this event.', { code: 'UNKNOWN_TEAM' });

        await EventActivity.updateOne(
            { _id: activityId },
            { $set: { [`external.scores.${teamId}`]: points } },
        );

        return NextResponse.json({ success: true, message: `Score ${points} recorded for ${teamId}.` });
    } catch (error) {
        return serverError(error, 'events-engine/external-score');
    }
}

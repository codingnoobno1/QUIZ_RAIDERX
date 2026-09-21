import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRound from '@/models/EventRound';
import { resolveParticipantTeam } from '@/lib/live/rounds';
import { listEventTeams, indexTeams, shapeRoundForParticipant } from '@/lib/rounds/roster';
import { invalidIdResponse, badRequest, requireEventUser, serverError } from '@/lib/apiGuards';

/**
 * GET /api/flutter/events/rounds?eventId=[id]
 *
 * The qualifier board: which teams are through to each round, as published by
 * the organiser. Read by the web lobby and by the app, on the same contract.
 *
 * Drafts never appear here. The organiser decides eliminations while the hall
 * is still full, and a roster being edited must not reach thirty phones one
 * team at a time.
 *
 * Deliberately not part of `/events/status`. That route is polled every few
 * seconds by every device in the room and has to stay cheap; this list changes
 * a handful of times in an evening, so it is its own call on its own cadence.
 */
export async function GET(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const eventId = new URL(req.url).searchParams.get('eventId');
    if (!eventId) return badRequest('eventId is required.');

    const invalid = invalidIdResponse(eventId, 'eventId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const rounds = await EventRound.find({
            eventId,
            status: { $in: ['published', 'completed'] },
        }).sort({ roundNumber: 1 }).lean();

        if (!rounds.length) {
            return NextResponse.json({
                success: true,
                data: { eventId, yourTeamId: null, yourTeamName: null, rounds: [] },
            });
        }

        // Only worth resolving once there is a list to be on. The viewer's own
        // team is marked server-side so every client highlights the same row.
        const [mine, pool] = await Promise.all([
            resolveParticipantTeam(eventId, auth.email),
            listEventTeams(eventId),
        ]);
        const byId = indexTeams(pool);

        return NextResponse.json({
            success: true,
            data: {
                eventId,
                yourTeamId: mine.teamId,
                yourTeamName: mine.teamName,
                rounds: rounds.map((r) => shapeRoundForParticipant(r, byId, mine.teamId)),
            },
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        return serverError(error, 'flutter/events/rounds');
    }
}

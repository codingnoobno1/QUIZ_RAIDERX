import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRound from '@/models/EventRound';
import {
    listEventTeams,
    indexTeams,
    normaliseTeamIds,
    shapeRoundForAdmin,
} from '@/lib/rounds/roster';
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
 * /api/admin/events/rounds — the organiser's roster editor.
 *
 *   GET    ?eventId=            every round, plus the pool of registered teams
 *   POST   { eventId, title }   create a round, optionally seeded from another
 *   PATCH  { roundId, action }  edit it
 *   DELETE ?roundId=            remove a draft
 *
 * This is the hand-maintained answer to "who is still in". A round sat on paper
 * leaves nothing in the database, so the twenty teams that survived it can only
 * get into the system by an organiser putting them there.
 *
 * Nothing here runs a round or scores anything. It publishes a list.
 */

const FORMATS = ['paper', 'live', 'online', 'other'];

const actorOf = (auth) => auth.actor?.email || auth.actor?.name || 'admin';

/** GET ?eventId= — or ?roundId= for one round. */
export async function GET(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const params = new URL(req.url).searchParams;
    const eventId = params.get('eventId');
    const roundId = params.get('roundId');

    if (!eventId && !roundId) return badRequest('eventId or roundId is required.');

    try {
        await connectDB();

        if (roundId) {
            const invalid = invalidIdResponse(roundId, 'roundId');
            if (invalid) return invalid;

            const round = await EventRound.findById(roundId).lean();
            if (!round) return notFound('Round not found.');

            const pool = await listEventTeams(round.eventId);
            return NextResponse.json({
                success: true,
                data: { round: shapeRoundForAdmin(round, indexTeams(pool)), teams: pool },
            });
        }

        const invalid = invalidIdResponse(eventId, 'eventId');
        if (invalid) return invalid;

        const [rounds, pool] = await Promise.all([
            EventRound.find({ eventId }).sort({ roundNumber: 1 }).lean(),
            listEventTeams(eventId),
        ]);
        const byId = indexTeams(pool);

        // The pool travels with the rounds so the editor can draw its checkbox
        // list without a second round trip, and so "20 of 30" is one number
        // from one moment rather than two reads that can disagree.
        return NextResponse.json({
            success: true,
            data: {
                rounds: rounds.map((r) => shapeRoundForAdmin(r, byId)),
                teams: pool,
            },
        });
    } catch (error) {
        return serverError(error, 'admin/events/rounds');
    }
}

/**
 * POST { eventId, title, roundNumber?, format?, copyFromRoundId?, teamIds? }
 *
 * `copyFromRoundId` seeds the new roster from an existing one, which is how a
 * round after the first is actually built: start from everyone who was in the
 * last round, then take out the teams that went home.
 */
export async function POST(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { eventId, copyFromRoundId } = parsed.data;
    const invalid = invalidIdResponse(eventId, 'eventId');
    if (invalid) return invalid;

    const title = String(parsed.data.title ?? '').trim();
    if (!title) return badRequest('A round title is required.');

    const format = parsed.data.format ?? 'other';
    if (!FORMATS.includes(format)) {
        return badRequest('format must be paper, live, online or other.');
    }

    try {
        await connectDB();

        let roundNumber = parsed.data.roundNumber;
        if (roundNumber === undefined || roundNumber === null || roundNumber === '') {
            const last = await EventRound.findOne({ eventId })
                .sort({ roundNumber: -1 }).select('roundNumber').lean();
            roundNumber = (last?.roundNumber ?? 0) + 1;
        }
        roundNumber = Number(roundNumber);
        if (!Number.isInteger(roundNumber) || roundNumber < 1) {
            return badRequest('roundNumber must be a whole number of 1 or more.');
        }

        const pool = await listEventTeams(eventId);
        const byId = indexTeams(pool);

        let seed = normaliseTeamIds(parsed.data.teamIds ?? []);
        if (copyFromRoundId) {
            const copyInvalid = invalidIdResponse(copyFromRoundId, 'copyFromRoundId');
            if (copyInvalid) return copyInvalid;

            const source = await EventRound.findById(copyFromRoundId).select('eventId teams').lean();
            if (!source) return notFound('The round to copy from does not exist.');
            if (String(source.eventId) !== String(eventId)) {
                return badRequest('That round belongs to a different event.', { code: 'WRONG_EVENT' });
            }
            seed = normaliseTeamIds([...(source.teams ?? []).map((t) => t.teamId), ...seed]);
        }

        const unknown = seed.filter((id) => !byId.has(id));
        if (unknown.length) {
            return badRequest('Some teams are not registered for this event.', {
                code: 'UNKNOWN_TEAM',
                unknown,
            });
        }

        const by = actorOf(auth);
        const round = await EventRound.create({
            eventId,
            roundNumber,
            title,
            format,
            status: 'draft',
            teams: seed.map((id) => ({
                teamId: id,
                teamName: byId.get(id).teamName,
                addedAt: new Date(),
                addedBy: by,
            })),
            updatedBy: by,
            audit: [{
                at: new Date(),
                by,
                action: 'create',
                teamIds: seed,
                detail: copyFromRoundId ? 'Seeded from an earlier round' : undefined,
            }],
        });

        return NextResponse.json(
            { success: true, data: { round: shapeRoundForAdmin(round.toObject(), byId) } },
            { status: 201 },
        );
    } catch (error) {
        if (error?.code === 11000) {
            return conflict('That round number already exists for this event.', {
                code: 'DUPLICATE_ROUND',
            });
        }
        return serverError(error, 'admin/events/rounds/create');
    }
}

/**
 * PATCH { roundId, action, ... }
 *
 *   add-teams    { teamIds }        put teams into the round
 *   remove-teams { teamIds }        take them out
 *   set-teams    { teamIds }        replace the roster wholesale
 *   note         { teamId, note }   why this team is on the list
 *   rename       { title?, format?, roundNumber? }
 *   publish - unpublish - complete - reopen
 */
export async function PATCH(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { roundId, action } = parsed.data;
    const invalid = invalidIdResponse(roundId, 'roundId');
    if (invalid) return invalid;
    if (!action) return badRequest('action is required.');

    try {
        await connectDB();

        // Not `.lean()` — every branch below mutates and saves.
        const round = await EventRound.findById(roundId);
        if (!round) return notFound('Round not found.');

        const pool = await listEventTeams(round.eventId);
        const byId = indexTeams(pool);
        const by = actorOf(auth);
        const ids = normaliseTeamIds(parsed.data.teamIds ?? []);
        let detail;

        switch (action) {
            case 'add-teams':
            case 'set-teams': {
                if (!ids.length && action === 'add-teams') return badRequest('Name at least one team.');

                const unknown = ids.filter((id) => !byId.has(id));
                if (unknown.length) {
                    return badRequest('Some teams are not registered for this event.', {
                        code: 'UNKNOWN_TEAM',
                        unknown,
                    });
                }

                // Keep the entry a team already has — its note, who added it and
                // when. Re-adding a team the operator never removed must not
                // quietly rewrite the record of how it got here.
                const existing = new Map((round.teams ?? []).map((t) => [t.teamId, t]));
                const wanted = action === 'set-teams' ? ids : [...existing.keys(), ...ids];

                const next = [];
                for (const id of wanted) {
                    if (next.some((t) => t.teamId === id)) continue;
                    next.push(existing.get(id) ?? {
                        teamId: id,
                        teamName: byId.get(id).teamName,
                        addedAt: new Date(),
                        addedBy: by,
                    });
                }

                round.teams = next;
                detail = `${next.length} team(s) on the roster`;
                break;
            }

            case 'remove-teams': {
                if (!ids.length) return badRequest('Name at least one team.');
                const before = round.teams.length;
                // No pool check: a team can only be removed from a list it is
                // already on, and a withdrawn registration must stay removable.
                round.teams = round.teams.filter((t) => !ids.includes(t.teamId));
                detail = `${before - round.teams.length} team(s) removed`;
                break;
            }

            case 'note': {
                const teamId = String(parsed.data.teamId ?? '').trim();
                const entry = round.teams.find((t) => t.teamId === teamId);
                if (!entry) return notFound('That team is not on this round.');
                entry.note = String(parsed.data.note ?? '').trim();
                detail = entry.note;
                break;
            }

            case 'rename': {
                if (parsed.data.title !== undefined) {
                    const title = String(parsed.data.title).trim();
                    if (!title) return badRequest('A round title is required.');
                    round.title = title;
                }
                if (parsed.data.format !== undefined) {
                    if (!FORMATS.includes(parsed.data.format)) {
                        return badRequest('format must be paper, live, online or other.');
                    }
                    round.format = parsed.data.format;
                }
                if (parsed.data.roundNumber !== undefined) {
                    const n = Number(parsed.data.roundNumber);
                    if (!Number.isInteger(n) || n < 1) {
                        return badRequest('roundNumber must be a whole number of 1 or more.');
                    }
                    round.roundNumber = n;
                }
                detail = round.title;
                break;
            }

            case 'publish': {
                // An empty published roster reads to the room as "nobody is
                // through", which is never what an organiser means by it — it
                // means they published before filling the list in.
                if (!round.teams.length) {
                    return conflict('Add the teams that are through before publishing.', {
                        code: 'EMPTY_ROSTER',
                    });
                }
                round.status = 'published';
                round.publishedAt = new Date();
                detail = `${round.teams.length} team(s) published`;
                break;
            }

            case 'unpublish': {
                round.status = 'draft';
                round.publishedAt = null;
                break;
            }

            case 'complete': {
                round.status = 'completed';
                break;
            }

            case 'reopen': {
                round.status = round.publishedAt ? 'published' : 'draft';
                break;
            }

            default:
                return badRequest(`Unknown round action "${action}".`);
        }

        round.updatedBy = by;
        round.audit.push({ at: new Date(), by, action, teamIds: ids, detail });
        await round.save();

        return NextResponse.json({
            success: true,
            data: { round: shapeRoundForAdmin(round.toObject(), byId) },
        });
    } catch (error) {
        if (error?.code === 11000) {
            return conflict('That round number already exists for this event.', {
                code: 'DUPLICATE_ROUND',
            });
        }
        return serverError(error, 'admin/events/rounds/update');
    }
}

/** DELETE ?roundId= — drafts only. A published list is one the room has seen. */
export async function DELETE(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const roundId = new URL(req.url).searchParams.get('roundId');
    const invalid = invalidIdResponse(roundId, 'roundId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const round = await EventRound.findById(roundId).select('status').lean();
        if (!round) return notFound('Round not found.');
        if (round.status !== 'draft') {
            return conflict('Unpublish the round before deleting it.', { code: 'PUBLISHED' });
        }

        await EventRound.deleteOne({ _id: roundId });
        return new Response(null, { status: 204 });
    } catch (error) {
        return serverError(error, 'admin/events/rounds/delete');
    }
}

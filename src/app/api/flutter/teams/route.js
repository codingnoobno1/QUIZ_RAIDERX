import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';
import { leaderNameOf } from '@/lib/live/rounds';
import {
    requireEventUser,
    readJson,
    invalidIdResponse,
    badRequest,
    conflict,
    forbidden,
    notFound,
    serverError,
} from '@/lib/apiGuards';

/**
 * The team, as its own members may see and manage it.
 *
 * Ported from the admin app, where it had landed by accident: the route is
 * leader-guarded rather than admin-guarded, which makes it participant-facing,
 * and the mobile client points at this origin. A leader on their phone could be
 * told they lead a team and given nothing to do about it.
 *
 * Addressable two ways because the client knows two different things depending
 * on where it is. During a live round it holds `myTeamId` from the round
 * payload; on the team screen it only knows which event it is in. Both resolve
 * to the same registration.
 */

const emailOf = (value) => String(value ?? '').trim().toLowerCase();

/** Rows written before `leaderEmail` existed: the registrant leads. */
const leaderEmailOf = (team) => emailOf(team?.leaderEmail || team?.email);

/**
 * GET /api/flutter/teams?eventId=[id]
 * GET /api/flutter/teams?teamId=[id]
 */
export async function GET(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const teamId = searchParams.get('teamId');

    if (!eventId && !teamId) return badRequest('eventId or teamId is required.');
    if (eventId) {
        const invalid = invalidIdResponse(eventId, 'eventId');
        if (invalid) return invalid;
    }

    try {
        await connectDB();

        const team = await findTeam({ eventId, teamId, email: auth.email });
        if (!team) return notFound('You are not registered with a team for this event.');
        if (!canRead(team, auth.email)) return forbidden('That is not your team.');

        return NextResponse.json({ success: true, data: shape(team, auth.email) });
    } catch (error) {
        return serverError(error, 'flutter/teams/read');
    }
}

/**
 * PATCH /api/flutter/teams
 *
 * Body: { eventId | teamId, action, ... }
 *
 * Actions: revoke-invite, resend-invite, replace-member, transfer-leadership.
 * All four are the leader's alone — a member who could replace a member could
 * remove the leader.
 */
export async function PATCH(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { eventId, teamId, action, memberEmail, replacement, newLeaderEmail } = parsed.data;

    if (!eventId && !teamId) return badRequest('eventId or teamId is required.');
    if (!action) return badRequest('action is required.');

    try {
        await connectDB();

        // Not `.lean()` — these actions mutate a subdocument array and save.
        const team = await findTeam({ eventId, teamId, email: auth.email, lean: false });
        if (!team) return notFound('You are not registered with a team for this event.');

        if (leaderEmailOf(team) !== auth.email) {
            return forbidden('Only the team leader can change the roster.', { code: 'NOT_LEADER' });
        }

        const targetEmail = emailOf(memberEmail);
        const member = team.members?.find((m) => emailOf(m.email) === targetEmail);

        if (['revoke-invite', 'resend-invite', 'replace-member'].includes(action) && !member) {
            return notFound('That person is not on your team.');
        }

        switch (action) {
            case 'revoke-invite': {
                if (member.inviteStatus !== 'pending') {
                    return conflict('Only an invitation still pending can be revoked.', {
                        code: 'NOT_PENDING',
                    });
                }
                team.members.pull(member._id);
                break;
            }

            case 'resend-invite': {
                if (member.inviteStatus === 'accepted') {
                    return conflict('They have already accepted.', { code: 'ALREADY_ACCEPTED' });
                }
                member.inviteStatus = 'pending';
                break;
            }

            case 'replace-member': {
                const replacementEmail = emailOf(replacement?.email);
                if (!replacementEmail) return badRequest('A replacement email is required.');
                if (replacementEmail === leaderEmailOf(team)) {
                    return badRequest('You cannot replace a member with yourself.');
                }

                // Release the outgoing member's seat. The replacement does not
                // take one until they accept — holding a seat on an unanswered
                // invitation is what locks someone out of registering
                // themselves, which the seat index exists to prevent.
                team.participantEmails = (team.participantEmails || [])
                    .filter((e) => emailOf(e) !== targetEmail);

                member.name = String(replacement?.name ?? '').trim();
                member.email = replacementEmail;
                member.enrollmentNumber = String(replacement?.enrollmentNumber ?? '').trim();
                member.semester = String(replacement?.semester ?? '').trim();
                member.inviteStatus = 'pending';
                member.role = 'member';
                break;
            }

            case 'transfer-leadership': {
                const nextEmail = emailOf(newLeaderEmail);
                const next = team.members?.find(
                    (m) => emailOf(m.email) === nextEmail && m.inviteStatus === 'accepted',
                );
                if (!next) {
                    return badRequest('The new leader must be a member who has accepted their invite.');
                }

                // Both the pointer and the roles. The admin copy of this moved
                // only `leaderEmail`, which left the new leader's own row still
                // reading `member` — so any screen that renders the roster from
                // `role` disagreed with the one that renders it from
                // `leaderEmail`.
                team.leaderEmail = nextEmail;
                next.role = 'leader';
                for (const m of team.members) {
                    if (emailOf(m.email) !== nextEmail) m.role = 'member';
                }
                break;
            }

            default:
                return badRequest(`Unknown team action "${action}".`);
        }

        await team.save();
        return NextResponse.json({ success: true, data: shape(team.toObject(), auth.email) });

    } catch (error) {
        if (error?.code === 11000) {
            return conflict('That person already holds a seat at this event.', {
                code: 'SEAT_TAKEN',
            });
        }
        return serverError(error, 'flutter/teams/update');
    }
}

// ── Lookup ───────────────────────────────────────────────────────────────────

/**
 * By `teamId` when the caller has one, otherwise the caller's own team for the
 * event. The `$or` is wide because two apps have written this collection with
 * schemas that drifted: `participantEmails` is the current seat claim, and
 * older rows carry the same people only under `email` and `members.email`.
 */
function findTeam({ eventId, teamId, email, lean = true }) {
    const where = teamId
        ? { teamId }
        : {
              eventId,
              $or: [
                  { participantEmails: email },
                  { email },
                  { 'members.email': email },
              ],
          };

    const query = EventRegistration.findOne(where);
    return lean ? query.lean() : query;
}

/** A member, or the leader of a legacy row whose seat was never claimed. */
function canRead(team, email) {
    if (leaderEmailOf(team) === email) return true;
    if ((team.participantEmails || []).some((e) => emailOf(e) === email)) return true;
    return (team.members || []).some((m) => emailOf(m.email) === email);
}

// ── Shaping ──────────────────────────────────────────────────────────────────

/**
 * What the app renders.
 *
 * Deliberately not the raw registration: that document carries pass URLs, entry
 * and exit logs and mode progress, none of which a roster screen needs, and all
 * of which would then have to be kept out of a cache by hand.
 *
 * Teammates' addresses are included — they are the handle every leader action
 * takes, and everyone here is on the same team by construction.
 */
function shape(team, viewerEmail) {
    const leaderEmail = leaderEmailOf(team);

    const members = (team.members ?? []).map((m) => ({
        name: m.name ?? '',
        email: emailOf(m.email),
        enrollmentNumber: m.enrollmentNumber ?? '',
        semester: m.semester ?? '',
        inviteStatus: m.inviteStatus ?? 'pending',
        role: emailOf(m.email) === leaderEmail ? 'leader' : (m.role ?? 'member'),
        isYou: emailOf(m.email) === viewerEmail,
    }));

    // The registrant is a member of the team but lives on the registration
    // itself rather than in `members[]`, so a roster built only from that array
    // is always missing one person — usually the leader.
    const registrant = {
        name: team.name ?? '',
        email: emailOf(team.email),
        enrollmentNumber: team.enrollmentNumber ?? '',
        semester: team.semester ?? '',
        // The person who created the entry is on it by definition; there is no
        // invitation for them to accept.
        inviteStatus: 'accepted',
        role: emailOf(team.email) === leaderEmail ? 'leader' : 'member',
        isYou: emailOf(team.email) === viewerEmail,
    };

    const roster = [registrant, ...members.filter((m) => m.email !== registrant.email)];

    return {
        teamId: team.teamId ?? null,
        teamName: team.teamName ?? null,
        eventId: String(team.eventId ?? ''),
        registrationType: team.registrationType ?? 'team',

        isLeader: leaderEmail === viewerEmail,
        leaderEmail,
        leaderName: leaderNameOf(team),

        roster,
        seatsFilled: roster.filter((m) => m.inviteStatus === 'accepted').length,
        seatsPending: roster.filter((m) => m.inviteStatus === 'pending').length,
        maxMembers: 6,
    };
}

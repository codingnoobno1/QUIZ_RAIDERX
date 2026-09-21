import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';
import Event from '@/models/Event';
import { TEAM } from '@/config/constants';
import {
    readJson,
    invalidIdResponse,
    isEmail,
    badRequest,
    notFound,
    conflict,
    serverError,
} from '@/lib/apiGuards';

const clean = (value) => (typeof value === 'string' ? value.trim() : '');
const normaliseEmail = (value) => clean(value).toLowerCase();

/** POST /api/events/register */
export async function POST(req) {
    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const {
        eventId,
        registrationType,
        teamName,
        name,
        email,
        enrollmentNumber,
        semester,
        members = [],
    } = parsed.data;

    if (!eventId || !name || !email || !registrationType) {
        return badRequest('Missing required fields');
    }

    const invalid = invalidIdResponse(eventId, 'eventId');
    if (invalid) return invalid;

    if (registrationType !== 'solo' && registrationType !== 'team') {
        return badRequest('registrationType must be "solo" or "team".');
    }

    if (!isEmail(email)) {
        return badRequest('That email address does not look right.');
    }

    if (!Array.isArray(members)) {
        return badRequest('members must be a list.');
    }

    const isTeam = registrationType === 'team';
    const teamMembers = isTeam ? members : [];

    if (isTeam && !clean(teamName)) {
        return badRequest('A team needs a name.');
    }

    // One shared limit for both clients and the server — TEAM.MAX_SIZE counts
    // the leader, so the members list holds at most MAX_SIZE - 1.
    if (isTeam && 1 + teamMembers.length > TEAM.MAX_SIZE) {
        return badRequest(`Team size cannot exceed ${TEAM.MAX_SIZE} members`);
    }

    const leaderEmail = normaliseEmail(email);
    const memberEmails = teamMembers.map((m) => normaliseEmail(m?.email)).filter(Boolean);

    const badMember = teamMembers.find((m) => clean(m?.email) && !isEmail(m.email));
    if (badMember) {
        return badRequest(`"${clean(badMember.email)}" does not look like a valid email.`);
    }

    // A team that lists the same person twice would otherwise register them
    // twice and then block their own second registration.
    const allEmails = [leaderEmail, ...memberEmails];
    const duplicateInTeam = allEmails.find((e, i) => allEmails.indexOf(e) !== i);
    if (duplicateInTeam) {
        return badRequest(`${duplicateInTeam} is listed twice in this team.`);
    }

    try {
        await connectDB();

        const event = await Event.findById(eventId).select('_id title participation').lean();
        if (!event) return notFound('That event no longer exists.');

        // Refused here rather than merely hidden on the form. A solo entry to a
        // team event is not a cosmetic mistake: the person is registered, holds
        // a seat, and then cannot sit a team-scored round — which they only
        // discover when the round is already live and the screen tells them to
        // ask a team leader to invite them to a team they were never allowed
        // to be on. Events created before this setting existed default to
        // `both`, so nothing that was valid yesterday is refused today.
        const participation = event.participation ?? 'both';
        if (participation === 'team' && !isTeam) {
            return badRequest('This event is played in teams. Register a team instead.', {
                code: 'SOLO_NOT_ALLOWED',
                participation,
            });
        }
        if (participation === 'solo' && isTeam) {
            return badRequest('This event is played individually. Register yourself instead.', {
                code: 'TEAM_NOT_ALLOWED',
                participation,
            });
        }

        // Seats, not membership. Someone who merely has a PENDING invite from
        // another team is free to register — only an accepted seat blocks them.
        // The old check matched members[] regardless of inviteStatus, so
        // declining an invitation locked you out of the event permanently.
        const clash = await EventRegistration.findOne({
            eventId,
            participantEmails: { $in: allEmails },
        }).select('email teamName participantEmails').lean();

        if (clash) {
            const takenEmail = allEmails.find((e) => (clash.participantEmails ?? []).includes(e));
            return conflict(
                clash.teamName
                    ? `${takenEmail} is already registered in team "${clash.teamName}".`
                    : `${takenEmail} is already registered for this event.`,
                { code: 'ALREADY_REGISTERED' },
            );
        }

        const registrationData = {
            eventId,
            registrationType,
            name: clean(name),
            email: leaderEmail,
            enrollmentNumber: clean(enrollmentNumber),
            semester: clean(semester),
            status: 'pending',
            modeProgress: [],
            // The leader claims their seat on creation. Invited members claim
            // theirs only when they accept. The unique index on
            // (eventId, participantEmails) makes the claim atomic, so the check
            // above is a courtesy for the error message — not the guard.
            participantEmails: [leaderEmail],
        };

        if (isTeam) {
            registrationData.teamName = clean(teamName);
            registrationData.teamId = generateTeamId();
            // Leadership is recorded, not inferred. Without this every new team
            // relied on the registrant fallback, and a transfer was the only
            // thing that ever wrote the field.
            registrationData.leaderEmail = leaderEmail;
            registrationData.members = teamMembers.map((m) => ({
                name: clean(m?.name),
                email: normaliseEmail(m?.email),
                enrollmentNumber: clean(m?.enrollmentNumber),
                semester: clean(m?.semester),
                inviteStatus: 'pending',
            }));
        }

        const registration = await EventRegistration.create(registrationData);

        return NextResponse.json(
            {
                message: 'Registered successfully',
                teamId: registration.teamId || null,
                data: registration,
            },
            { status: 201 },
        );
    } catch (error) {
        // Lost a race with a concurrent signup (or a double-tapped submit).
        // Report the settled state, not a 500.
        if (error?.code === 11000) {
            // The unique index rejected the write: someone claimed a seat in the
            // instant between the check above and this insert. This is the guard
            // that actually holds under concurrency.
            const dupTeamId = String(error?.keyPattern ?? '').includes('teamId');
            return conflict(
                dupTeamId
                    ? 'Could not allocate a team id. Please try again.'
                    : 'Someone in this registration was just registered for this event.',
                { code: 'ALREADY_REGISTERED' },
            );
        }
        if (error?.name === 'ValidationError') {
            return badRequest('Those registration details are incomplete.', {
                fields: Object.keys(error.errors ?? {}),
            });
        }
        return serverError(error, 'events/register');
    }
}

/**
 * Random enough to not collide, and no longer derived from `Date.now()` alone —
 * two teams registering in the same millisecond used to be able to generate the
 * same id and trip the unique index.
 */
function generateTeamId() {
    const rand = () => Math.random().toString(36).slice(2, 7);
    return `TEAM-${Date.now().toString(36)}-${rand()}${rand()}`.toUpperCase();
}

/** GET /api/events/register?email=&eventId= */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const email = normaliseEmail(searchParams.get('email'));
    const eventId = searchParams.get('eventId');

    if (!email) return badRequest('Missing email');

    if (eventId) {
        const invalid = invalidIdResponse(eventId, 'eventId');
        if (invalid) return invalid;
    }

    try {
        await connectDB();

        // A member only counts as registered once they accept the invite; the
        // leader counts immediately.
        const mine = {
            $or: [
                { email },
                { members: { $elemMatch: { email, inviteStatus: 'accepted' } } },
            ],
        };

        if (eventId) {
            const registration = await EventRegistration.findOne({ eventId, ...mine }).lean();
            return NextResponse.json({ registered: Boolean(registration), data: registration }, { status: 200 });
        }

        const registrations = await EventRegistration.find(mine).lean();
        return NextResponse.json({ data: registrations }, { status: 200 });
    } catch (error) {
        return serverError(error, 'events/register/list');
    }
}

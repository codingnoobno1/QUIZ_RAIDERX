import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';
// Required for populate('eventId'): Mongoose resolves the ref by model name, and
// a process that never imported Event throws MissingSchemaError instead.
import Event from '@/models/Event';
import { TEAM } from '@/config/constants';
import {
    requireEventUser,
    readJson,
    invalidIdResponse,
    badRequest,
    notFound,
    forbidden,
    conflict,
    serverError,
} from '@/lib/apiGuards';

/**
 * Team invitations.
 *
 * The rules this enforces, none of which held before:
 *
 *   - only the invitee can answer their own invitation
 *   - an answer is final; answering twice reports the settled state
 *   - accepting claims a seat atomically, so you cannot end up in two teams for
 *     one event by accepting an old invitation
 *   - declining releases nothing, because a pending invite never held a seat.
 *     Declining used to leave your email in members[], where the registration
 *     route's duplicate check found it and locked you out of the event for good
 *   - a leader can withdraw an invitation that has not been answered
 */

/** GET /api/events/invitations — invitations awaiting THIS participant. */
export async function GET(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    try {
        await connectDB();

        // $elemMatch, not two sibling conditions. Filtering on
        // { 'members.email': x, 'members.inviteStatus': 'pending' } matches when
        // ANY member has that email and ANY member is pending — not necessarily
        // the same one — so an already-accepted member kept seeing their
        // invitation as outstanding.
        const invitations = await EventRegistration.find({
            members: { $elemMatch: { email: auth.email, inviteStatus: 'pending' } },
        })
            .populate('eventId')
            .lean();

        return NextResponse.json({ data: invitations }, { status: 200 });
    } catch (error) {
        return serverError(error, 'events/invitations/list');
    }
}

/** POST /api/events/invitations — accept or decline. Body: { registrationId, response } */
export async function POST(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { registrationId, response } = parsed.data;

    if (!registrationId || !response) {
        return badRequest('registrationId and response are required');
    }

    const invalid = invalidIdResponse(registrationId, 'registrationId');
    if (invalid) return invalid;

    if (!['accepted', 'rejected'].includes(response)) {
        return badRequest('response must be "accepted" or "rejected"');
    }

    // Taken from the verified session, never from the body. The old handler read
    // the email out of the payload, so anyone could answer anyone's invitation.
    const email = auth.email;

    try {
        await connectDB();

        if (response === 'rejected') return await decline(registrationId, email);
        return await accept(registrationId, email);
    } catch (error) {
        if (error?.code === 11000) {
            // The unique (eventId, participantEmails) index refused the claim.
            return conflict(
                'You are already registered for this event, so you cannot join another team.',
                { code: 'ALREADY_REGISTERED' },
            );
        }
        return serverError(error, 'events/invitations/respond');
    }
}

/**
 * Accept: flip the member to accepted AND claim the seat in one write.
 *
 * The filter requires the invite to still be pending, so two taps race for a
 * single update and exactly one wins. The old code read the document, mutated
 * the array in memory and saved the whole thing back — the classic lost update.
 */
async function accept(registrationId, email) {
    const target = await EventRegistration.findById(registrationId)
        .select('members participantEmails eventId teamName')
        .lean();

    if (!target) return notFound('That invitation no longer exists.');

    const invite = (target.members ?? []).find((m) => (m.email ?? '').toLowerCase() === email);
    if (!invite) return forbidden('That invitation is not addressed to you.');

    if (invite.inviteStatus !== 'pending') {
        return conflict(`You already ${invite.inviteStatus} this invitation.`, {
            code: 'ALREADY_ANSWERED',
            inviteStatus: invite.inviteStatus,
        });
    }

    // Seats already claimed, plus the one being taken now.
    const seated = (target.participantEmails ?? []).length;
    if (seated + 1 > TEAM.MAX_SIZE) {
        return conflict(`This team is already full (${TEAM.MAX_SIZE} members).`, { code: 'TEAM_FULL' });
    }

    const updated = await EventRegistration.findOneAndUpdate(
        {
            _id: registrationId,
            members: { $elemMatch: { email, inviteStatus: 'pending' } },
        },
        {
            $set: { 'members.$[m].inviteStatus': 'accepted' },
            $addToSet: { participantEmails: email },
        },
        {
            new: true,
            arrayFilters: [{ 'm.email': email, 'm.inviteStatus': 'pending' }],
        },
    );

    if (!updated) {
        // Someone answered in the gap between the read above and this write.
        return conflict('That invitation was just answered.', { code: 'ALREADY_ANSWERED' });
    }

    return NextResponse.json(
        { message: 'Invitation accepted', inviteStatus: 'accepted', data: updated },
        { status: 200 },
    );
}

/**
 * Decline: record the answer and claim nothing.
 *
 * Because a pending invite never held a seat, declining leaves the person free
 * to register on their own or to accept a different team's invitation.
 */
async function decline(registrationId, email) {
    const updated = await EventRegistration.findOneAndUpdate(
        {
            _id: registrationId,
            members: { $elemMatch: { email, inviteStatus: 'pending' } },
        },
        { $set: { 'members.$[m].inviteStatus': 'rejected' } },
        { new: true, arrayFilters: [{ 'm.email': email, 'm.inviteStatus': 'pending' }] },
    );

    if (updated) {
        return NextResponse.json(
            { message: 'Invitation declined', inviteStatus: 'rejected', data: updated },
            { status: 200 },
        );
    }

    // Nothing matched — say precisely why instead of a blanket 404.
    const existing = await EventRegistration.findById(registrationId).select('members').lean();
    if (!existing) return notFound('That invitation no longer exists.');

    const invite = (existing.members ?? []).find((m) => (m.email ?? '').toLowerCase() === email);
    if (!invite) return forbidden('That invitation is not addressed to you.');

    return conflict(`You already ${invite.inviteStatus} this invitation.`, {
        code: 'ALREADY_ANSWERED',
        inviteStatus: invite.inviteStatus,
    });
}

/**
 * DELETE /api/events/invitations?registrationId=&email= — the leader withdraws
 * an invitation that has not been answered.
 *
 * There was no way to take back a mistyped invite, so the wrong person kept a
 * live invitation to the team for the lifetime of the event.
 */
export async function DELETE(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const registrationId = searchParams.get('registrationId');
    const memberEmail = (searchParams.get('email') ?? '').trim().toLowerCase();

    if (!registrationId || !memberEmail) {
        return badRequest('registrationId and email are required');
    }

    const invalid = invalidIdResponse(registrationId, 'registrationId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const registration = await EventRegistration.findById(registrationId)
            .select('email members')
            .lean();

        if (!registration) return notFound('That registration no longer exists.');

        if ((registration.email ?? '').toLowerCase() !== auth.email) {
            return forbidden('Only the team leader can withdraw an invitation.');
        }

        const invite = (registration.members ?? []).find(
            (m) => (m.email ?? '').toLowerCase() === memberEmail,
        );

        if (!invite) return notFound('That person is not on this team.');

        if (invite.inviteStatus === 'accepted') {
            return conflict('They already accepted — removing a seated member is a separate action.', {
                code: 'ALREADY_ACCEPTED',
            });
        }

        const updated = await EventRegistration.findByIdAndUpdate(
            registrationId,
            { $pull: { members: { email: memberEmail } } },
            { new: true },
        );

        return NextResponse.json({ message: 'Invitation withdrawn', data: updated }, { status: 200 });
    } catch (error) {
        return serverError(error, 'events/invitations/withdraw');
    }
}

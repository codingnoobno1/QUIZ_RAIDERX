import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';
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
 * PATCH /api/admin/participants/pass
 * Body: { identifier | registrationId, action: 'entry' | 'exit', eventId?, memberEmail? }
 *
 * Marks someone in or out at the door, per person rather than per team.
 *
 * Differences from the admin app's copy, both of which put a mark on the wrong
 * record:
 *
 *   - It searched every registration at every event. Someone registered for two
 *     events was marked present at whichever one the database returned first.
 *     Pass `eventId` and the search is scoped; leave it out and an identifier
 *     that matches more than one registration is refused instead of guessed.
 *   - Addresses were compared as typed, so a member stored as `Priya@...` could
 *     not be found by a scan of `priya@...`.
 */

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function PATCH(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { identifier, registrationId, memberEmail, action, eventId } = parsed.data;
    const lookup = String(identifier || registrationId || '').trim();

    if (!lookup || !['entry', 'exit'].includes(action)) {
        return badRequest('A participant identifier and an action of "entry" or "exit" are required.');
    }
    if (eventId) {
        const invalid = invalidIdResponse(eventId, 'eventId');
        if (invalid) return invalid;
    }

    const lower = lookup.toLowerCase();
    const sameAddress = new RegExp(`^${escapeRegex(lower)}$`, 'i');

    try {
        await connectDB();

        const who = [
            ...(/^[0-9a-fA-F]{24}$/.test(lookup) ? [{ _id: lookup }] : []),
            { email: sameAddress },
            { enrollmentNumber: lookup },
            { 'members.email': sameAddress },
            { 'members.enrollmentNumber': lookup },
        ];

        const matches = await EventRegistration.find({ ...(eventId ? { eventId } : {}), $or: who }).limit(2);

        if (!matches.length) return notFound('Participant not found.');
        if (matches.length > 1) {
            return conflict('That person is registered for more than one event. Scan from an event to mark them.', {
                code: 'AMBIGUOUS_EVENT',
            });
        }

        const registration = matches[0];
        const target = String(memberEmail || lower).toLowerCase();
        const isRegistrant = String(registration.email ?? '').toLowerCase() === target
            || registration.enrollmentNumber === lookup
            || String(registration._id) === lookup;

        const member = registration.registrationType === 'team' && !isRegistrant
            ? registration.members.find((m) => String(m.email ?? '').toLowerCase() === target
                || (m.enrollmentNumber && m.enrollmentNumber === lookup))
            : null;

        if (registration.registrationType === 'team' && !isRegistrant && !member) {
            return notFound('Team member not found.');
        }

        const participant = member || registration;
        const now = new Date();

        if (action === 'entry') {
            participant.entryTime = now;
            participant.entryCount = (participant.entryCount || 0) + 1;
            if (!member) registration.status = 'attended';
        } else {
            participant.exitTime = now;
            participant.exitCount = (participant.exitCount || 0) + 1;
        }

        await registration.save();

        return NextResponse.json({
            message: `Marked ${action} for ${participant.name}.`,
            participant: {
                name: participant.name,
                email: participant.email,
                enrollmentNumber: participant.enrollmentNumber,
                entryTime: participant.entryTime,
                exitTime: participant.exitTime,
            },
            registrationId: registration._id,
            eventId: registration.eventId,
        });
    } catch (error) {
        return serverError(error, 'admin/participants/pass');
    }
}

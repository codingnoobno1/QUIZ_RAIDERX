import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import User from '@/models/User';
import EventRegistration from '@/models/EventRegistration';
import { requireEventUser, invalidIdResponse, badRequest, serverError } from '@/lib/apiGuards';

/** Never return the whole student directory in one response. */
const MAX_RESULTS = 25;

/**
 * GET /api/events/potential-participants?eventId=&q=
 *
 * People the caller can still invite to a team for this event.
 *
 * Two problems with the previous version. It loaded every registration and
 * every user into memory and filtered in JS — the whole user table on each
 * keystroke of the teammate picker. And it was unauthenticated, so anyone could
 * retrieve the name, email and enrollment number of every student on the
 * platform by calling it once.
 *
 * Now: a verified participant only, filtered in the database, capped, and
 * requiring a search term before it returns anyone at all.
 */
export async function GET(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const q = (searchParams.get('q') ?? '').trim();

    if (!eventId) return badRequest('Missing eventId');

    const invalid = invalidIdResponse(eventId, 'eventId');
    if (invalid) return invalid;

    try {
        await connectDB();

        // Only people who actually hold a seat are excluded. Someone with an
        // unanswered invitation from another team is still invitable — several
        // teams may invite the same person, and whoever they accept wins the
        // seat. Excluding pending invitees was what made a declined invitation
        // permanent.
        const claimed = await EventRegistration.distinct('participantEmails', { eventId });

        const filter = {
            email: { $nin: [...claimed, auth.email] },
        };

        // A directory is only browsable with a search term. Without one this
        // returns nothing rather than everyone.
        if (q) {
            const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { name: { $regex: safe, $options: 'i' } },
                { email: { $regex: safe, $options: 'i' } },
                { enrollmentNumber: { $regex: safe, $options: 'i' } },
            ];
        }

        const users = q
            ? await User.find(filter)
                  .select('name email semester enrollmentNumber')
                  .limit(MAX_RESULTS)
                  .lean()
            : [];

        return NextResponse.json(
            {
                data: users.map((u) => ({
                    name: u.name ?? '',
                    email: u.email ?? '',
                    semester: u.semester ?? '',
                    enrollmentNumber: u.enrollmentNumber ?? '',
                })),
                truncated: users.length === MAX_RESULTS,
                requiresQuery: !q,
            },
            { status: 200 },
        );
    } catch (error) {
        return serverError(error, 'events/potential-participants');
    }
}

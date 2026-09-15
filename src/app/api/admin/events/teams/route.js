import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import EventRegistration from '@/models/EventRegistration';
import { leaderNameOf } from '@/lib/live/rounds';
import { requireAdmin, invalidIdResponse, badRequest, serverError } from '@/lib/apiGuards';

/**
 * GET /api/admin/events/teams?eventId=[id]   (or ?activityId=[id])
 *
 * The teams at an event — what the host console's target picker is built from.
 * The `teamId` returned is the registration's own `teamId`, the same value the
 * round engine resolves a participant to, so a team picked here is a team the
 * engine will recognise on a phone.
 *
 * `leaderName` follows `leaderEmail`. The admin copy returned the registrant's
 * name, which is wrong for any team whose leadership has been handed over.
 */
export async function GET(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const params = new URL(req.url).searchParams;
    let eventId = params.get('eventId');
    const activityId = params.get('activityId');

    try {
        await connectDB();

        if (!eventId && activityId) {
            const invalidActivity = invalidIdResponse(activityId, 'activityId');
            if (invalidActivity) return invalidActivity;
            const activity = await EventActivity.findById(activityId).select('eventId').lean();
            eventId = activity?.eventId ? String(activity.eventId) : null;
        }

        if (!eventId) return badRequest('eventId or activityId is required.');
        const invalid = invalidIdResponse(eventId, 'eventId');
        if (invalid) return invalid;

        const registrations = await EventRegistration.find({ eventId, registrationType: 'team' })
            .select('teamId teamName leaderEmail email name members')
            .sort({ teamName: 1 })
            .lean();

        const teams = registrations
            .filter((r) => r.teamId)
            .map((r) => ({
                teamId: r.teamId,
                teamName: r.teamName ?? r.teamId,
                leaderEmail: String(r.leaderEmail || r.email || '').toLowerCase(),
                leaderName: leaderNameOf(r) ?? '',
                memberCount: 1 + (r.members?.length ?? 0),
                acceptedCount: 1 + (r.members ?? []).filter((m) => m.inviteStatus === 'accepted').length,
            }));

        return NextResponse.json({ success: true, data: teams });
    } catch (error) {
        return serverError(error, 'admin/events/teams');
    }
}

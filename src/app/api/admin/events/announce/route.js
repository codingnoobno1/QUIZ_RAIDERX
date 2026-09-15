import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import { startActivity, validationMessage } from '@/lib/live/activities';
import { requireAdmin, readJson, invalidIdResponse, badRequest, serverError } from '@/lib/apiGuards';

/**
 * POST /api/admin/events/announce — { eventId, message, displaySeconds? }
 *
 * Creates an announcement and puts it live in one step. An announcement is the
 * one activity that is only ever wanted right now, so there is no draft stage.
 *
 * It goes live through the same `startActivity` as everything else, so it stops
 * whatever the room was doing and clears that activity's live state — the copy
 * in the admin app marked other activities complete but left a host-paced
 * round open underneath.
 */
export async function POST(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { eventId, message, displaySeconds = 15 } = parsed.data;
    if (!eventId || !String(message ?? '').trim()) return badRequest('eventId and message are required.');

    const invalid = invalidIdResponse(eventId, 'eventId');
    if (invalid) return invalid;

    const seconds = Number(displaySeconds);
    if (!Number.isFinite(seconds) || seconds < 1 || seconds > 600) {
        return badRequest('displaySeconds must be between 1 and 600.');
    }

    try {
        await connectDB();

        const last = await EventActivity.findOne({ eventId }).sort({ order: -1 }).select('order').lean();
        const activity = new EventActivity({
            eventId,
            type: 'announcement',
            title: 'ANNOUNCEMENT',
            announcement: { message: String(message).trim(), displaySeconds: seconds },
            order: last ? (last.order ?? 0) + 1 : 1,
        });

        await startActivity(activity);
        await activity.save();

        return NextResponse.json({ success: true, data: activity, changedBy: auth.actor?.email || null });
    } catch (error) {
        const detail = validationMessage(error);
        if (detail) return badRequest(detail);
        return serverError(error, 'admin/events/announce');
    }
}

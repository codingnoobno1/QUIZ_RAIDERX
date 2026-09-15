import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import {
    ACTIVITY_TYPES,
    refusedKeys,
    sectionFor,
    startActivity,
    stopActivity,
    updatePaths,
    validationMessage,
} from '@/lib/live/activities';
import {
    requireAdmin,
    readJson,
    invalidIdResponse,
    badRequest,
    notFound,
    conflict,
    serverError,
} from '@/lib/apiGuards';

/**
 * /api/admin/events/activities — create, edit, switch and delete activities.
 *
 * Moved here from the admin app, which wrote `event_activities` directly with
 * its own copy of the schema. The path and body shapes are the admin app's, on
 * purpose: its route becomes a pass-through with nothing to translate.
 *
 * Three behaviours differ from the copy it replaces, all deliberately:
 *
 *   - `update` writes only configuration. The old one did `$set` with the whole
 *     request body, so a console could write `status`, a live round's deadline,
 *     or a KBC contestant — skipping the state machine that owns those.
 *   - `activate` resets live state from a previous run, the same as the
 *     control room's start button. The old one left a KBC show mid-hot-seat.
 *   - `advance_question` and `reset_question` are gone. Host-paced questions
 *     now move through /api/events/live/command, where the round has a
 *     deadline and an instance id; nudging `currentQuestion` directly would
 *     move the question without opening a round.
 */

/** GET ?eventId=[id] — every activity for the event, drafts included. */
export async function GET(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const eventId = new URL(req.url).searchParams.get('eventId');
    const invalid = invalidIdResponse(eventId, 'eventId');
    if (invalid) return invalid;

    try {
        await connectDB();
        const activities = await EventActivity.find({ eventId }).sort({ order: 1 }).lean();
        return NextResponse.json({ success: true, data: activities });
    } catch (error) {
        return serverError(error, 'admin/events/activities/list');
    }
}

/** POST { eventId, type, title, description?, order?, [type]: {...} } — create, inactive. */
export async function POST(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    if (!body.eventId || !body.type || !body.title) {
        return badRequest('eventId, type and title are required.');
    }
    const invalid = invalidIdResponse(body.eventId, 'eventId');
    if (invalid) return invalid;
    if (!ACTIVITY_TYPES.includes(body.type)) {
        return badRequest(`type must be one of ${ACTIVITY_TYPES.join(', ')}.`);
    }

    try {
        await connectDB();

        let order = body.order;
        if (order == null) {
            const last = await EventActivity.findOne({ eventId: body.eventId })
                .sort({ order: -1 }).select('order').lean();
            order = last ? (last.order ?? 0) + 1 : 1;
        }

        // Created inactive, always. Going live is a separate, deliberate step —
        // it stops whatever the room is currently doing.
        const activity = await EventActivity.create({
            eventId: body.eventId,
            type: body.type,
            title: body.title,
            description: body.description,
            order,
            [body.type]: sectionFor(body.type, body),
        });

        return NextResponse.json({ success: true, data: activity }, { status: 201 });
    } catch (error) {
        const message = validationMessage(error);
        if (message) return badRequest(message);
        return serverError(error, 'admin/events/activities/create');
    }
}

/** PATCH { id, action: 'activate' | 'stop' | 'update', ...config } */
export async function PATCH(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;
    const { id, action, ...rest } = parsed.data;

    const invalid = invalidIdResponse(id, 'id');
    if (invalid) return invalid;

    if (action === 'advance_question' || action === 'reset_question') {
        return badRequest(
            'Questions are moved by the live command route now, which opens a round with a deadline. '
            + 'Use POST /api/events/live/command with OPEN_QUESTION or NEXT_QUESTION.',
            { code: 'USE_LIVE_COMMAND' },
        );
    }

    try {
        await connectDB();

        const activity = await EventActivity.findById(id);
        if (!activity) return notFound('Activity not found.');

        if (action === 'activate') {
            if (activity.status === 'active') {
                return conflict('That activity is already running.', { code: 'ALREADY_ACTIVE' });
            }
            await startActivity(activity);
            await activity.save();
            return NextResponse.json({ success: true, data: activity, changedBy: actorOf(auth) });
        }

        if (action === 'stop') {
            stopActivity(activity);
            await activity.save();
            return NextResponse.json({ success: true, data: activity, changedBy: actorOf(auth) });
        }

        if (action === 'update') {
            // Refuse rather than silently drop. A console that thinks it set a
            // field it did not will show the operator something untrue.
            const refused = refusedKeys(activity.type, rest);
            if (refused.length) {
                return badRequest(
                    `These fields are not editable here: ${refused.join(', ')}.`,
                    { code: 'NOT_EDITABLE', refused },
                );
            }

            const $set = updatePaths(activity.type, rest);
            if (!Object.keys($set).length) return badRequest('Nothing to update.');

            const updated = await EventActivity.findByIdAndUpdate(
                id,
                { $set },
                { new: true, runValidators: true },
            );
            return NextResponse.json({ success: true, data: updated, changedBy: actorOf(auth) });
        }

        return badRequest('action must be "activate", "stop" or "update".');
    } catch (error) {
        const message = validationMessage(error);
        if (message) return badRequest(message);
        return serverError(error, 'admin/events/activities/update');
    }
}

/** DELETE ?id=[activityId] — refused while running. */
export async function DELETE(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const id = new URL(req.url).searchParams.get('id');
    const invalid = invalidIdResponse(id, 'id');
    if (invalid) return invalid;

    try {
        await connectDB();

        // Conditional delete, so an activity started between a check and a
        // delete cannot be removed from under a live room.
        const removed = await EventActivity.findOneAndDelete({ _id: id, status: { $ne: 'active' } });
        if (removed) return NextResponse.json({ success: true });

        const exists = await EventActivity.exists({ _id: id });
        return exists
            ? conflict('Stop the activity before deleting it.', { code: 'ACTIVE' })
            : notFound('Activity not found.');
    } catch (error) {
        return serverError(error, 'admin/events/activities/delete');
    }
}

const actorOf = (auth) => auth.actor?.email || auth.actor?.name || null;

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';
import {
    requireAdmin,
    readJson,
    invalidIdResponse,
    notFound,
    badRequest,
    serverError,
} from '@/lib/apiGuards';

/**
 * PATCH /api/admin/event/[id] — switch the event's active mode.
 *
 * This is the control surface for the whole live engine: every phone and
 * browser in the lobby follows whatever this sets, within one poll interval.
 * It ran unauthenticated until now, which meant anyone who knew an event id
 * could take over a running event. It requires an admin session (web console)
 * or an admin Bearer token (organiser app), and logs who actually made the
 * change instead of the literal string 'admin'.
 */
export async function PATCH(request, { params }) {
    const { id } = await params;

    const invalid = invalidIdResponse(id, 'event id');
    if (invalid) return invalid;

    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(request);
    if (!parsed.ok) return parsed.response;

    const { activeMode } = parsed.data; // "quiz" | "voting" | "treasure-hunt" | "none"

    if (activeMode !== undefined && activeMode !== null && typeof activeMode !== 'string') {
        return badRequest('activeMode must be a string, or "none" to stop.');
    }

    try {
        await connectDB();

        const event = await Event.findById(id);
        if (!event) return notFound('Event not found');

        const modeType = !activeMode || activeMode === 'none' ? null : activeMode;

        // Reliability check: the mode must be one the event actually configured.
        if (modeType && !event.modes.some((m) => m.type === modeType)) {
            return badRequest(`Invalid mode: ${modeType} is not configured for this event.`);
        }

        // Nothing to do — don't write a history entry for a no-op double-click.
        const currentMode = event.activeMode?.type ?? null;
        if (currentMode === modeType) {
            return NextResponse.json(
                { message: `Already ${modeType || 'inactive'}`, unchanged: true, event },
                { status: 200 },
            );
        }

        const now = new Date();

        // Close the open history entry before opening the next one.
        if (currentMode) {
            const last = event.modeHistory[event.modeHistory.length - 1];
            if (last && !last.endedAt) last.endedAt = now;
        }

        if (modeType) {
            event.modeHistory.push({
                mode: modeType,
                startedAt: now,
                changedBy: auth.actor.email || auth.actor.name || auth.actor.id,
            });
        }

        event.activeMode = modeType ? { type: modeType, startedAt: now } : null;

        await event.save();

        return NextResponse.json(
            {
                message: `Successfully switched to ${modeType || 'Inactive'}`,
                previousMode: currentMode,
                changedBy: auth.actor.email || auth.actor.name,
                event,
            },
            { status: 200 },
        );
    } catch (error) {
        return serverError(error, 'admin/event/mode');
    }
}

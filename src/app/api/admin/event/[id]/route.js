import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';

export async function PATCH(request, { params }) {
    await connectDB();
    const { id } = await params;

    try {
        const { activeMode } = await request.json(); // Expected: "quiz", "voting", "treasure-hunt", or "none"

        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 });
        }

        const modeType = activeMode === 'none' ? null : activeMode;

        // 1. Reliability Check: Ensure the mode exists in the event's configured modes
        if (modeType && !event.modes.some(m => m.type === modeType)) {
            return NextResponse.json({ message: `Invalid mode: ${modeType} is not configured for this event.` }, { status: 400 });
        }

        const now = new Date();
        const oldMode = event.activeMode?.type || 'none';

        // 2. Mode History Logging
        if (event.activeMode && event.activeMode.type) {
            // Close the previous entry in history if it exists
            const lastHistoryItem = event.modeHistory[event.modeHistory.length - 1];
            if (lastHistoryItem && !lastHistoryItem.endedAt) {
                lastHistoryItem.endedAt = now;
            }
        }

        if (modeType) {
            event.modeHistory.push({
                mode: modeType,
                startedAt: now,
                changedBy: 'admin' // In a real app, use the authenticated user's ID
            });
        }

        // 3. Update activeMode structured object
        event.activeMode = modeType ? {
            type: modeType,
            startedAt: now
        } : null;

        await event.save();

        return NextResponse.json({
            message: `Successfully switched to ${modeType || 'Inactive'}`,
            event: event
        }, { status: 200 });

    } catch (error) {
        console.error('Error patching event mode:', error);
        return NextResponse.json(
            { message: 'Failed to update event mode', error: error.message },
            { status: 500 }
        );
    }
}

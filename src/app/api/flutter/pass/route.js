import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';
import Event from '@/models/Event';

/**
 * GET /api/flutter/pass
 * Fetch event pass details for a participant.
 * Query Parameters: email, eventId
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const eventId = searchParams.get('eventId');

        if (!email || !eventId) {
            return NextResponse.json({ error: 'Missing email or eventId' }, { status: 400 });
        }

        await connectDB();

        // Find registration where user is leader or accepted member
        const registration = await EventRegistration.findOne({
            eventId,
            $or: [
                { email: email.toLowerCase() },
                { 'members.email': email.toLowerCase(), 'members.inviteStatus': 'accepted' }
            ]
        }).populate('eventId');

        if (!registration) {
            return NextResponse.json({
                registered: false,
                message: 'No registration found for this event.'
            }, { status: 404 });
        }

        // Fetch event details if not populated correctly
        const event = registration.eventId;

        return NextResponse.json({
            registered: true,
            passId: registration.teamId || registration._id,
            registrationType: registration.registrationType,
            teamName: registration.teamName,
            status: registration.status,
            entryCount: registration.entryCount,
            exitCount: registration.exitCount,
            event: {
                title: event.title,
                date: event.date,
                time: event.time,
                location: event.location,
                activeMode: event.activeMode
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Pass retrieval error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

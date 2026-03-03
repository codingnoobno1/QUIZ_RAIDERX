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

        const event = registration.eventId;

        // Find the specific user's details (leader or member)
        let attendeeDetails = {
            uuid: registration.email, // Use email as uuid if no student record uuid
            name: registration.name,
            email: registration.email,
            enrollmentNumber: registration.enrollmentNumber || '',
            course: 'B.Tech CS', // Default if not found
            semester: parseInt(registration.semester) || 0,
            role: 'student'
        };

        if (registration.email.toLowerCase() !== email.toLowerCase()) {
            const member = registration.members.find(m => m.email.toLowerCase() === email.toLowerCase());
            if (member) {
                attendeeDetails = {
                    uuid: member.email,
                    name: member.name,
                    email: member.email,
                    enrollmentNumber: member.enrollmentNumber || '',
                    course: 'B.Tech CS',
                    semester: parseInt(member.semester) || 0,
                    role: 'student'
                };
            }
        }

        // Prepare team members list, excluding the current attendee if they are a member
        const teamMembers = registration.members
            .filter(m => m.inviteStatus === 'accepted' && m.email.toLowerCase() !== attendeeDetails.email.toLowerCase())
            .map(m => ({
                name: m.name,
                email: m.email,
                enrollmentNumber: m.enrollmentNumber,
                semester: m.semester,
                role: 'member'
            }));

        // Add the leader to the team members list if the current attendee is a member
        if (attendeeDetails.role === 'member') {
            teamMembers.unshift({
                name: registration.name,
                email: registration.email,
                enrollmentNumber: registration.enrollmentNumber,
                semester: registration.semester,
                role: 'leader'
            });
        }


        return NextResponse.json({
            registered: true,
            passId: registration.teamId || registration._id.toString(),
            eventId: event._id.toString(),
            registrationId: registration._id.toString(),
            userId: attendeeDetails.email,
            timestamp: registration.createdAt,
            qrSignature: `SIG_${registration._id}_${attendeeDetails.email}`, // In production, use high-security signature
            registrationType: registration.registrationType,
            teamName: registration.teamName,
            status: registration.status,
            entryCount: registration.entryCount,
            exitCount: registration.exitCount,
            user: attendeeDetails,
            event: {
                id: event._id,
                title: event.title,
                description: event.description,
                date: event.date,
                time: event.time,
                location: event.location,
                imageUrl: event.imageUrl,
                tags: event.tags,
                activeMode: event.activeMode
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Pass retrieval error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

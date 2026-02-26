import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import User from '@/models/User';
import EventRegistration from '@/models/EventRegistration';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
        }

        await connectDB();

        // 1. Get all registered participants for this event
        const registrations = await EventRegistration.find({ eventId });

        // Collect all emails (leaders and members)
        const registeredEmails = new Set();
        registrations.forEach(reg => {
            registeredEmails.add(reg.email.toLowerCase());
            if (reg.members) {
                reg.members.forEach(m => registeredEmails.add(m.email.toLowerCase()));
            }
        });

        // 2. Get all platform users except those already registered for this event
        const allUsers = await User.find({}).lean();

        const potentialParticipants = allUsers.filter(u => !registeredEmails.has(u.email.toLowerCase()));

        // Return a simplified list
        return NextResponse.json({
            data: potentialParticipants.map(u => ({
                name: u.name,
                email: u.email,
                semester: u.semester,
                enrollmentNumber: u.enrollmentNumber
            }))
        }, { status: 200 });

    } catch (error) {
        console.error('Potential participants error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

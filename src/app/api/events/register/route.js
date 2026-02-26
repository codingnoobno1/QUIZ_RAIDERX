import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            eventId,
            registrationType,
            teamName,
            name,
            email,
            enrollmentNumber,
            semester,
            members = []
        } = body;

        if (!eventId || !name || !email || !registrationType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // 1. Validate team size (Leader + Members)
        const totalParticipants = 1 + members.length;
        if (registrationType === 'team' && totalParticipants > 6) {
            return NextResponse.json({ error: 'Team size cannot exceed 6 members' }, { status: 400 });
        }

        // 2. "One Person, One Team" Constraint
        // Collect all emails in the current registration attempt
        const allNewEmails = [email.toLowerCase(), ...members.map(m => m.email.toLowerCase())].filter(e => !!e);

        // Find any existing registration for this event
        const existingRegistrations = await EventRegistration.find({ eventId });

        for (const reg of existingRegistrations) {
            // Check existing leader
            if (allNewEmails.includes(reg.email.toLowerCase())) {
                return NextResponse.json({
                    error: `Participant with email ${reg.email} is already registered for this event.`
                }, { status: 400 });
            }
            // Check existing members
            if (reg.members && reg.members.length > 0) {
                for (const m of reg.members) {
                    if (allNewEmails.includes(m.email.toLowerCase())) {
                        return NextResponse.json({
                            error: `Participant with email ${m.email} is already registered in team "${reg.teamName || 'Solo'}".`
                        }, { status: 400 });
                    }
                }
            }
        }

        // 3. Generate Team ID if applicable
        let generatedTeamId = null;
        if (registrationType === 'team') {
            generatedTeamId = `TEAM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
        }

        // 4. Create Registration
        const registration = await EventRegistration.create({
            eventId,
            registrationType,
            teamName: registrationType === 'team' ? teamName : null,
            teamId: generatedTeamId,
            name,
            email,
            enrollmentNumber,
            semester,
            members: registrationType === 'team' ? members : [],
            status: 'pending'
        });

        return NextResponse.json({
            message: 'Registered successfully',
            teamId: generatedTeamId,
            data: registration
        }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const eventId = searchParams.get('eventId');

        await connectDB();

        if (email && eventId) {
            // Find registration where user is leader OR an accepted member
            const registration = await EventRegistration.findOne({
                eventId,
                $or: [
                    { email: email.toLowerCase() },
                    { 'members.email': email.toLowerCase(), 'members.inviteStatus': 'accepted' }
                ]
            });
            return NextResponse.json({ registered: !!registration }, { status: 200 });
        }

        if (email) {
            const registrations = await EventRegistration.find({
                $or: [
                    { email: email.toLowerCase() },
                    { 'members.email': email.toLowerCase(), 'members.inviteStatus': 'accepted' }
                ]
            });
            return NextResponse.json({ data: registrations }, { status: 200 });
        }

        return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

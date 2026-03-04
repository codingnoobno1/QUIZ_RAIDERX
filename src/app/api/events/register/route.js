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

        // 2. Normalize and check existing
        const normalizedEmail = email.toLowerCase().trim();
        const allNewEmails = [normalizedEmail, ...members.map(m => m.email?.toLowerCase().trim())].filter(e => !!e);

        const existingRegistrations = await EventRegistration.find({ eventId });

        for (const reg of existingRegistrations) {
            if (allNewEmails.includes(reg.email.toLowerCase())) {
                return NextResponse.json({
                    error: `Participant ${reg.email} is already registered.`
                }, { status: 400 });
            }
            if (reg.members && reg.members.length > 0) {
                for (const m of reg.members) {
                    if (m.email && allNewEmails.includes(m.email.toLowerCase())) {
                        return NextResponse.json({
                            error: `Participant ${m.email} is already registered in team "${reg.teamName || 'Solo'}".`
                        }, { status: 400 });
                    }
                }
            }
        }

        // 3. Prepare data
        const registrationData = {
            eventId,
            registrationType,
            name,
            email: normalizedEmail,
            enrollmentNumber: enrollmentNumber || '',
            semester: semester || '',
            status: 'pending',
            modeProgress: []
        };

        if (registrationType === 'team') {
            registrationData.teamName = teamName;
            registrationData.teamId = `TEAM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
            registrationData.members = members;
        }

        // 4. Create Registration
        const registration = await EventRegistration.create(registrationData);

        return NextResponse.json({
            message: 'Registered successfully',
            teamId: registration.teamId || null,
            data: registration
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error details:', error);
        return NextResponse.json({
            error: 'Registration failed',
            message: error.message
        }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    try {
        // Await params for Next.js 15 compatibility (if this route ever expands to segments)
        await params;

        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const eventId = searchParams.get('eventId');

        await connectDB();

        if (email && eventId) {
            const registration = await EventRegistration.findOne({
                eventId,
                $or: [
                    { email: email.toLowerCase().trim() },
                    { 'members.email': email.toLowerCase().trim(), 'members.inviteStatus': 'accepted' }
                ]
            });
            return NextResponse.json({ registered: !!registration, data: registration }, { status: 200 });
        }

        if (email) {
            const registrations = await EventRegistration.find({
                $or: [
                    { email: email.toLowerCase().trim() },
                    { 'members.email': email.toLowerCase().trim(), 'members.inviteStatus': 'accepted' }
                ]
            }).lean();
            return NextResponse.json({ data: registrations }, { status: 200 });
        }

        return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

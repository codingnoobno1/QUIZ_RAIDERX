import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Missing email' }, { status: 400 });
        }

        await connectDB();

        // Find registrations where this user is a member and status is 'pending'
        const invitations = await EventRegistration.find({
            'members.email': email.toLowerCase(),
            'members.inviteStatus': 'pending'
        }).populate('eventId'); // Assuming you want event details

        return NextResponse.json({ data: invitations }, { status: 200 });
    } catch (error) {
        console.error('Fetch invitations error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { registrationId, email, response } = await req.json();

        if (!registrationId || !email || !response) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['accepted', 'rejected'].includes(response)) {
            return NextResponse.json({ error: 'Invalid response type' }, { status: 400 });
        }

        await connectDB();

        const registration = await EventRegistration.findById(registrationId);
        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        // Find the member in the array
        const memberIndex = registration.members.findIndex(m => m.email.toLowerCase() === email.toLowerCase());

        if (memberIndex === -1) {
            return NextResponse.json({ error: 'Member not found in team' }, { status: 404 });
        }

        // Update status
        registration.members[memberIndex].inviteStatus = response;

        // If rejected, maybe remove them? 
        // User said "accept or reject", if rejected they shouldn't be in the team.
        // Let's keep the record but with 'rejected' status for history, or remove it.
        // The user said "1 person is registering... 2nd do not want so he should have request... add this option"
        // If rejected, they are out.

        await registration.save();

        return NextResponse.json({ message: `Invitation ${response} successfully` }, { status: 200 });
    } catch (error) {
        console.error('Respond invitation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

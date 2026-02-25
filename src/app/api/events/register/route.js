import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';

export async function POST(req) {
    try {
        const { eventId, name, email, enrollmentNumber } = await req.json();

        if (!eventId || !name || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Check if already registered
        const existing = await EventRegistration.findOne({ eventId, email });
        if (existing) {
            return NextResponse.json({ error: 'You are already registered for this event' }, { status: 400 });
        }

        const registration = await EventRegistration.create({
            eventId,
            name,
            email,
            enrollmentNumber
        });

        return NextResponse.json({ message: 'Registered successfully', data: registration }, { status: 201 });
    } catch (error) {
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
            const registration = await EventRegistration.findOne({ eventId, email });
            return NextResponse.json({ registered: !!registration }, { status: 200 });
        }

        if (email) {
            const registrations = await EventRegistration.find({ email });
            return NextResponse.json({ data: registrations }, { status: 200 });
        }

        return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

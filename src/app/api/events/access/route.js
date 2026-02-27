import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';

export async function POST(req) {
    try {
        const body = await req.json();
        const { passId, type } = body; // passId will be teamId or registration _id

        if (!passId || !['entry', 'exit'].includes(type)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        await connectDB();

        // Find registration by teamId or _id
        const registration = await EventRegistration.findOne({
            $or: [
                { teamId: passId },
                { _id: passId }
            ]
        });

        if (!registration) {
            return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
        }

        const now = new Date();

        if (type === 'entry') {
            if (registration.entryCount >= 1) {
                return NextResponse.json({ error: 'Entry already recorded' }, { status: 400 });
            }
            registration.entryTime = now;
            registration.entryCount = 1;
            registration.status = 'attended';
        } else if (type === 'exit') {
            if (registration.entryCount < 1) {
                return NextResponse.json({ error: 'Cannot exit without entry' }, { status: 400 });
            }
            if (registration.exitCount >= 1) {
                return NextResponse.json({ error: 'Exit already recorded' }, { status: 400 });
            }
            registration.exitTime = now;
            registration.exitCount = 1;
        }

        await registration.save();

        return NextResponse.json({
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} recorded successfully`,
            data: registration
        }, { status: 200 });

    } catch (error) {
        console.error('Access error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

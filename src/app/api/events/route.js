import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';

export async function GET() {
  await connectDB();

  try {
    const events = await Event.find({}).lean();
    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Failed to fetch events', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  await connectDB();

  try {
    const eventData = await request.json();
    const newEvent = await Event.create(eventData);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { message: 'Failed to create event', error: error.message },
      { status: 500 }
    );
  }
}

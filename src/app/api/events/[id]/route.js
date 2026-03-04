import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';

export async function GET(request, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const event = await Event.findById(id).lean();

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { message: 'Failed to fetch event', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const eventData = await request.json();
    const updatedEvent = await Event.findByIdAndUpdate(id, eventData, { new: true }).lean();

    if (!updatedEvent) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { message: 'Failed to update event', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const deletedEvent = await Event.findByIdAndDelete(id).lean();

    if (!deletedEvent) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { message: 'Failed to delete event', error: error.message },
      { status: 500 }
    );
  }
}

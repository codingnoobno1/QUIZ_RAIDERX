import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';
import {
  requireAdmin,
  readJson,
  invalidIdResponse,
  notFound,
  badRequest,
  serverError,
} from '@/lib/apiGuards';

/**
 * GET /api/events/[id] — public.
 *
 * A bad id used to reach Mongoose, throw a CastError and come back as a 500, so
 * a mistyped URL read to the client as "the server is down" and the API client
 * retried it three times. It is a 400 now.
 */
export async function GET(request, { params }) {
  const { id } = await params;

  const invalid = invalidIdResponse(id, 'event id');
  if (invalid) return invalid;

  try {
    await connectDB();
    const event = await Event.findById(id).lean();
    if (!event) return notFound('Event not found');
    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    return serverError(error, 'events/detail');
  }
}

/** PUT /api/events/[id] — admin only. */
export async function PUT(request, { params }) {
  const { id } = await params;

  const invalid = invalidIdResponse(id, 'event id');
  if (invalid) return invalid;

  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  // `activeMode` and `modeHistory` belong to the live engine and are owned by
  // PATCH /api/admin/event/[id]. Letting a general edit rewrite them would let
  // an edit silently start or stop a live round.
  const { activeMode, modeHistory, _id, ...editable } = parsed.data;

  if (Object.keys(editable).length === 0) {
    return badRequest('No editable fields were provided.');
  }

  try {
    await connectDB();
    const updatedEvent = await Event.findByIdAndUpdate(id, editable, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedEvent) return notFound('Event not found');
    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return badRequest('Those changes are not valid.', { fields: Object.keys(error.errors ?? {}) });
    }
    return serverError(error, 'events/update');
  }
}

/**
 * DELETE /api/events/[id] — admin only.
 *
 * Refuses while a mode is live: deleting the event out from under a lobby full
 * of participants leaves every poll 404ing with no explanation.
 */
export async function DELETE(request, { params }) {
  const { id } = await params;

  const invalid = invalidIdResponse(id, 'event id');
  if (invalid) return invalid;

  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    await connectDB();

    const event = await Event.findById(id).select('activeMode').lean();
    if (!event) return notFound('Event not found');

    if (event.activeMode?.type) {
      return badRequest(
        `This event is live (${event.activeMode.type}). Stop the active mode before deleting it.`,
      );
    }

    await Event.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error) {
    return serverError(error, 'events/delete');
  }
}

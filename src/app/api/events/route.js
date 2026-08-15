import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';
import { requireAdmin, readJson, badRequest, serverError } from '@/lib/apiGuards';

/** GET /api/events — the public event list. Read is open; writing is not. */
export async function GET() {
  try {
    await connectDB();
    const events = await Event.find({}).sort({ date: 1 }).lean();
    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    return serverError(error, 'events/list');
  }
}

/**
 * POST /api/events — create an event.
 *
 * Previously any visitor could create events on the live site. Restricted to
 * admins, and the payload is no longer passed to the model verbatim: an
 * unvalidated spread lets a caller set fields the schema didn't intend to
 * expose (activeMode, modeHistory) as part of a "create".
 */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const { title, description, date, time, location, imageUrl, tags, modes, onDuty } = parsed.data;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return badRequest('An event needs a title.');
  }

  try {
    await connectDB();

    const newEvent = await Event.create({
      title: title.trim(),
      description: typeof description === 'string' ? description : '',
      date: date ? new Date(date) : undefined,
      time: typeof time === 'string' ? time : undefined,
      location: typeof location === 'string' ? location : undefined,
      imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
      tags: Array.isArray(tags) ? tags.filter((t) => typeof t === 'string') : [],
      modes: Array.isArray(modes) ? modes : [],
      onDuty: typeof onDuty === 'boolean' ? onDuty : false,
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return badRequest('That event is missing required details.', { fields: Object.keys(error.errors ?? {}) });
    }
    return serverError(error, 'events/create');
  }
}

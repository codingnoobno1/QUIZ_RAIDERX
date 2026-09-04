import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import {
  requireAdmin,
  readJson,
  invalidIdResponse,
  badRequest,
  notFound,
  conflict,
  serverError,
} from '@/lib/apiGuards';

/**
 * The activities of one event, and the switch that starts them.
 *
 * This is the piece the platform was missing. Nine activities existed in the
 * database with no screen that could list them and no button that could start
 * one — so the lobby had content nobody could reach, and "start the event" had
 * no answer. The KBC control room asks for an activityId; nothing produced one.
 *
 * GET   -> every activity for this event (admin sees drafts too)
 * POST  -> { activityId, action: 'start' | 'stop' | 'reset' }
 */

/** One event runs one thing at a time; the status poll assumes exactly that. */
async function stopOthers(eventId, exceptId) {
  await EventActivity.updateMany(
    { eventId, status: 'active', ...(exceptId ? { _id: { $ne: exceptId } } : {}) },
    { $set: { status: 'completed' } },
  );
}

export async function GET(req, { params }) {
  const { id } = await params;

  const invalid = invalidIdResponse(id, 'event id');
  if (invalid) return invalid;

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    await connectDB();

    const activities = await EventActivity.find({ eventId: id })
      .select('type title description status activatedAt quiz.quizType quiz.phase quiz.questions')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      data: activities.map((a) => ({
        id: String(a._id),
        type: a.type,
        title: a.title,
        description: a.description ?? '',
        status: a.status,
        activatedAt: a.activatedAt ?? null,
        quizType: a.quiz?.quizType ?? null,
        phase: a.quiz?.phase ?? null,
        // Count only — the questions themselves carry the answers.
        questionCount: a.quiz?.questions?.length ?? 0,
      })),
    });
  } catch (error) {
    return serverError(error, 'events/activities/list');
  }
}

export async function POST(req, { params }) {
  const { id } = await params;

  const invalid = invalidIdResponse(id, 'event id');
  if (invalid) return invalid;

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;

  const { activityId, action } = parsed.data;

  if (!activityId || !action) return badRequest('activityId and action are required.');
  const badActivity = invalidIdResponse(activityId, 'activityId');
  if (badActivity) return badActivity;

  if (!['start', 'stop', 'reset'].includes(action)) {
    return badRequest('action must be "start", "stop" or "reset".');
  }

  try {
    await connectDB();

    const activity = await EventActivity.findOne({ _id: activityId, eventId: id });
    if (!activity) return notFound('That activity does not belong to this event.');

    if (action === 'start') {
      if (activity.status === 'active') {
        return conflict('That activity is already running.', { code: 'ALREADY_ACTIVE' });
      }

      // Starting one thing stops whatever else was running, so the room is
      // never shown two live activities by a poll that returns findOne().
      await stopOthers(id, activity._id);

      activity.status = 'active';
      activity.activatedAt = new Date();

      // A KBC show always re-enters at the lobby: restarting mid-hot-seat with
      // a stale contestant and a burnt lifeline would be worse than restarting
      // clean.
      if (activity.quiz?.quizType === 'kbc') {
        activity.quiz.phase = 'lobby';
        activity.quiz.activeContestant = undefined;
        activity.quiz.answerState = { locked: false, lockedOption: null, lockedAt: null };
        activity.quiz.audiencePoll = { status: 'idle', resultsVisible: false, questionIndex: null };
        activity.quiz.timer = { startedAt: null, endsAt: null, durationSeconds: null };
      }
    }

    if (action === 'stop') activity.status = 'completed';

    if (action === 'reset') {
      activity.status = 'inactive';
      activity.activatedAt = null;
      if (activity.quiz?.quizType === 'kbc') {
        activity.quiz.phase = 'lobby';
        activity.quiz.results = [];
        activity.quiz.currentQuestion = 0;
        activity.quiz.activeContestant = undefined;
        activity.quiz.lifelines = { fiftyFifty: true, audiencePoll: true, skip: true, eliminatedOptions: [] };
      }
    }

    await activity.save();

    return NextResponse.json({
      success: true,
      message: `Activity ${action}${action === 'stop' ? 'ped' : action === 'reset' ? '' : 'ed'}.`,
      activity: { id: String(activity._id), status: activity.status, phase: activity.quiz?.phase ?? null },
      changedBy: auth.actor.email || auth.actor.name,
    });
  } catch (error) {
    return serverError(error, 'events/activities/switch');
  }
}

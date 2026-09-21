import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import { startActivity, stopActivity } from '@/lib/live/activities';
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

export async function GET(req, { params }) {
  const { id } = await params;

  const invalid = invalidIdResponse(id, 'event id');
  if (invalid) return invalid;

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    await connectDB();

    const activities = await EventActivity.find({ eventId: id })
      .select([
        'type title description status activatedAt',
        'quiz.quizType quiz.phase quiz.questions quiz.scope quiz.shuffle',
        'quiz.timePerQuestion quiz.roundDurationSeconds quiz.qualificationRoundId',
        'quiz.advancement',
      ].join(' '))
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
        questionType: a.quiz?.questions?.length
          ? (a.quiz.questions.every((question) => (question.type ?? 'choice') === 'text') ? 'text'
            : a.quiz.questions.every((question) => (question.type ?? 'choice') === 'choice') ? 'choice'
              : 'mixed')
          : 'choice',
        scope: a.quiz?.scope ?? null,
        shuffle: a.quiz?.shuffle ?? null,
        timePerQuestion: a.quiz?.timePerQuestion ?? null,
        roundDurationSeconds: a.quiz?.roundDurationSeconds ?? null,
        qualificationRoundId: a.quiz?.qualificationRoundId
          ? String(a.quiz.qualificationRoundId)
          : null,
        advancement: a.quiz?.advancement
          ? {
              count: a.quiz.advancement.count ?? 0,
              targetRoundId: a.quiz.advancement.targetRoundId
                ? String(a.quiz.advancement.targetRoundId)
                : null,
              confirmedAt: a.quiz.advancement.confirmed?.at ?? null,
            }
          : null,
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

      // Starting one thing stops whatever else was running, and clears live
      // state left over from a previous run. The rules live in one module so
      // the admin API's `activate` cannot quietly disagree with this one.
      await startActivity(activity);
    }

    if (action === 'stop') stopActivity(activity);

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

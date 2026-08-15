import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import FastestFingerSubmission from '@/models/FastestFingerSubmission';
import AudiencePollVote from '@/models/AudiencePollVote';
import { PHASE } from '@/lib/kbc/machine';
import {
    requireEventUser,
    readJson,
    invalidIdResponse,
    badRequest,
    notFound,
    forbidden,
    conflict,
    serverError,
} from '@/lib/apiGuards';

/**
 * POST /api/events/live/answer — the two things a participant may send.
 *
 * Body: { activityId, kind: 'fastest_finger' | 'audience_poll', ... }
 *
 * Neither carries a timestamp or an identity from the client. Elapsed time is
 * measured here against the activity's own `openedAt`, and the participant is
 * taken from the verified session — a body claiming 0.001s or someone else's
 * id changes nothing.
 */
export async function POST(req) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, kind } = parsed.data;

    if (!activityId || !kind) return badRequest('activityId and kind are required.');
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    // Stamped before any database round-trip, so a slow lookup does not count
    // against the participant's reaction time.
    const receivedAt = new Date();

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId).lean();
        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');
        if (activity.status !== 'active') return forbidden('This activity is not running.');

        const quiz = activity.quiz ?? {};

        if (kind === 'fastest_finger') {
            return await submitFastestFinger({ parsed, activity, quiz, auth, receivedAt });
        }
        if (kind === 'audience_poll') {
            return await submitPollVote({ parsed, activity, quiz, auth });
        }
        return badRequest('kind must be "fastest_finger" or "audience_poll".');
    } catch (error) {
        if (error?.code === 11000) {
            return conflict('You have already answered this one.', { code: 'ALREADY_ANSWERED' });
        }
        return serverError(error, 'events/live/answer');
    }
}

async function submitFastestFinger({ parsed, activity, quiz, auth, receivedAt }) {
    if (quiz.phase !== PHASE.FASTEST_FINGER) {
        return conflict('The fastest finger round is not open.', { code: 'ROUND_CLOSED' });
    }

    const openedAt = quiz.fastestFinger?.openedAt;
    if (!openedAt) return conflict('The round has not started.', { code: 'ROUND_CLOSED' });

    // Late answers are refused rather than silently ranked last.
    const endsAt = quiz.timer?.endsAt;
    if (endsAt && receivedAt > new Date(endsAt)) {
        return conflict('Time is up for this round.', { code: 'TOO_LATE' });
    }

    const answer = Array.isArray(parsed.data.answer) ? parsed.data.answer.map(String) : null;
    if (!answer?.length) return badRequest('answer must be an ordered list of options.');

    const elapsedMs = receivedAt.getTime() - new Date(openedAt).getTime();

    await FastestFingerSubmission.create({
        activityId: activity._id,
        eventId: activity.eventId,
        questionIndex: quiz.fastestFinger.questionIndex ?? 0,
        participantId: auth.email,
        name: auth.name,
        teamName: parsed.data.teamName ?? '',
        answer,
        receivedAt,
        elapsedMs,
        // Graded when the host closes the round, never at submit — returning
        // correctness here would tell the room the answer mid-round.
        correct: false,
    });

    return NextResponse.json({
        success: true,
        locked: true,
        // Their own time is safe to return; the ranking is not.
        elapsedMs,
        message: 'Answer locked.',
    });
}

async function submitPollVote({ parsed, activity, quiz, auth }) {
    if (quiz.phase !== PHASE.AUDIENCE_POLL || quiz.audiencePoll?.status !== 'open') {
        return conflict('The audience poll is not open.', { code: 'POLL_CLOSED' });
    }

    // The person in the hot seat cannot vote in their own lifeline.
    if (quiz.activeContestant?.participantId === auth.email) {
        return forbidden('You are on the hot seat — the poll is for the audience.');
    }

    const option = parsed.data.option;
    const index = quiz.audiencePoll.questionIndex ?? quiz.currentQuestion ?? 0;
    const question = quiz.questions?.[index];

    if (!question?.options?.includes(option)) return badRequest('That is not one of the options.');

    await AudiencePollVote.create({
        activityId: activity._id,
        eventId: activity.eventId,
        questionIndex: index,
        participantId: auth.email,
        option,
    });

    const totalVotes = await AudiencePollVote.countDocuments({ activityId: activity._id, questionIndex: index });

    return NextResponse.json({
        success: true,
        myVote: option,
        totalVotes,
        // The split stays hidden until the host closes the poll, so early
        // voters cannot leak the audience's leaning to the contestant.
        resultsVisible: false,
        message: 'Vote locked.',
    });
}

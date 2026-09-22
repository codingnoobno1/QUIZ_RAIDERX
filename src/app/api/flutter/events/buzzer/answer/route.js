import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import BuzzAttempt from '@/models/BuzzAttempt';
import { resolveParticipantTeam } from '@/lib/live/rounds';
import { listEventTeams } from '@/lib/rounds/roster';
import {
    BUZZER_PHASE,
    BUZZ_GRACE_MS,
    buzzerPoints,
    buzzerSettings,
    gradeBuzzerAnswer,
    mayPressFor,
} from '@/lib/buzzer/machine';
import { refreshStandings } from '@/lib/buzzer/scoring';
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
 * POST /api/flutter/events/buzzer/answer — the seated team's answer.
 *
 * Only in `in_app` mode, only from the team holding the seat, and only while
 * its window is open. In `spoken` mode there is nothing to submit: the leader
 * says it out loud and the host presses Correct or Wrong.
 *
 * The response carries no verdict. Telling the seated team whether they were
 * right would tell the room, since the room is looking at them — the same
 * reason `quiz/answer` withholds it. The outcome arrives with the reveal.
 *
 * The host can still override an auto-grade with MARK_CORRECT: the grader is
 * deliberately literal, and a fill-up that is right bar a typo is the host's
 * call rather than a regex's.
 *
 * Body: { activityId, instanceId, answer }
 */
export async function POST(req) {
    const receivedAt = new Date();

    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, instanceId } = parsed.data;
    const answer = parsed.data.answer ?? parsed.data.option;

    if (!activityId || !instanceId) return badRequest('activityId and instanceId are required.');
    if (typeof answer !== 'string' || !answer.trim()) return badRequest('An answer is required.');
    if (answer.length > 1000) return badRequest('The answer is too long.');

    for (const [value, label] of [[activityId, 'activityId'], [instanceId, 'instanceId']]) {
        const invalid = invalidIdResponse(value, label);
        if (invalid) return invalid;
    }

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId)
            .select('type status eventId quiz.quizType quiz.buzzer quiz.questions')
            .lean();

        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');
        if (activity.quiz?.quizType !== 'buzzer') {
            return badRequest('This activity is not an Electric Answers round.');
        }
        if (activity.status !== 'active') return forbidden('This activity is not running.');

        const quiz = activity.quiz;
        const buzzer = quiz.buzzer ?? {};
        const round = buzzer.round ?? {};
        const seat = round.seat ?? {};
        const settings = buzzerSettings(quiz);

        if (!round.instanceId || String(round.instanceId) !== String(instanceId)) {
            return conflict('That question has moved on.', {
                code: 'STALE_QUESTION',
                currentInstanceId: round.instanceId ? String(round.instanceId) : null,
            });
        }

        const team = await resolveParticipantTeam(activity.eventId, auth.email);
        const holdsTheSeat = Boolean(team.teamId)
            && String(seat.teamId ?? '') === String(team.teamId)
            && mayPressFor(buzzer, team, auth.email);

        if (!holdsTheSeat) {
            return forbidden('Another team has the floor.', { code: 'NOT_YOUR_SEAT' });
        }

        const answerMode = round.answerMode ?? settings.answerMode;
        if (answerMode === 'spoken') {
            return conflict('Say it out loud — the host is judging this one.', {
                code: 'SPOKEN_MODE',
            });
        }

        if (seat.answeredAt || round.phase !== BUZZER_PHASE.SEATED) {
            return conflict('Your team has already answered.', { code: 'ALREADY_ANSWERED' });
        }

        // The grace covers the network leg only, exactly as it does for a live
        // answer: a leader who tapped at 14.9s of 15 has answered in time.
        if (seat.answerEndsAt
            && receivedAt.getTime() > new Date(seat.answerEndsAt).getTime() + BUZZ_GRACE_MS) {
            return conflict('Your answer window has closed.', { code: 'TOO_LATE' });
        }

        const question = quiz.questions?.[round.questionIndex ?? 0];
        if (!question) return notFound('That question no longer exists.');

        const isCorrect = gradeBuzzerAnswer(question, answer);
        const outcome = isCorrect ? 'correct' : 'wrong';
        const attempt = seat.attempt || 1;
        const points = buzzerPoints({ question, settings, attempt, outcome });

        // One conditional update decides it, for the same reason the press does:
        // two taps from the same phone must produce one judgement. The filter
        // matches only while this team still holds an unanswered seat.
        const judged = await EventActivity.findOneAndUpdate(
            {
                _id: activity._id,
                'quiz.buzzer.round.instanceId': round.instanceId,
                'quiz.buzzer.round.phase': BUZZER_PHASE.SEATED,
                'quiz.buzzer.round.seat.teamId': String(team.teamId),
                'quiz.buzzer.round.seat.answeredAt': null,
            },
            {
                $set: {
                    'quiz.buzzer.round.phase': isCorrect
                        ? BUZZER_PHASE.JUDGED_CORRECT
                        : BUZZER_PHASE.JUDGED_WRONG,
                    'quiz.buzzer.round.seat.answeredAt': receivedAt,
                    'quiz.buzzer.round.seat.submittedAnswer': answer,
                },
                $addToSet: { 'quiz.buzzer.round.attemptedTeamIds': String(team.teamId) },
            },
            { new: true, projection: { 'quiz.buzzer.round.phase': 1 } },
        ).lean();

        if (!judged) {
            return conflict('Your team has already answered.', { code: 'ALREADY_ANSWERED' });
        }

        const seatedAt = seat.seatedAt ?? seat.pressedAt ?? receivedAt;

        await BuzzAttempt.updateOne(
            { instanceId: round.instanceId, teamId: String(team.teamId) },
            {
                $set: {
                    activityId: activity._id,
                    eventId: activity.eventId,
                    questionIndex: round.questionIndex ?? 0,
                    teamName: team.teamName,
                    attempt,
                    answerMode,
                    submittedAnswer: answer,
                    judgedBy: 'auto',
                    outcome,
                    points,
                    isTiebreak: Boolean(round.isTiebreak),
                    seatMs: Math.max(0, receivedAt.getTime() - new Date(seatedAt).getTime()),
                    decidedAt: receivedAt,
                },
            },
            { upsert: true },
        );

        // Recomputed here, not on the next poll: the phones read the board off
        // the activity document, and a board that only refreshed when the host
        // pressed something would show a stale score for as long as they took.
        await refreshStandings({
            activityId: activity._id,
            teams: await listEventTeams(activity.eventId),
        });

        return NextResponse.json({
            success: true,
            recorded: true,
            // No `isCorrect`, deliberately. It arrives with the reveal.
            message: 'Answer locked.',
        });

    } catch (error) {
        if (error?.code === 11000) {
            return conflict('Your team has already answered.', { code: 'ALREADY_ANSWERED' });
        }
        return serverError(error, 'flutter/events/buzzer/answer');
    }
}

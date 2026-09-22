import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import BuzzPress from '@/models/BuzzPress';
import { resolveParticipantTeam } from '@/lib/live/rounds';
import {
    buzzRefusal,
    buzzerSettings,
    mayPressFor,
    seatClaim,
} from '@/lib/buzzer/machine';
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
 * POST /api/flutter/events/buzzer/press — one press of the BUZZ button.
 *
 * The fastest path in the codebase, and the one place where a few milliseconds
 * decide something. Three deliberate choices:
 *
 *   `receivedAt` is stamped on the first line, before authentication and before
 *   the database connection. A cold function or a slow session lookup is the
 *   server's problem; charging it to a team's reaction time would mean the
 *   first press after a quiet minute always loses.
 *
 *   The seat is claimed by **one conditional update**. Two leaders pressing in
 *   the same millisecond must not both win, and a read-then-write in JavaScript
 *   cannot promise that. The filter only matches while the seat is empty, so
 *   the database picks, and every later press matches nothing.
 *
 *   Presses that lose are still recorded. They are the queue the host walks
 *   with PASS, and their offsets are how the host sees that two presses were
 *   effectively a tie.
 *
 * Body: { activityId, instanceId }
 */
export async function POST(req) {
    const receivedAt = new Date();

    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, instanceId } = parsed.data;
    if (!activityId || !instanceId) return badRequest('activityId and instanceId are required.');

    for (const [value, label] of [[activityId, 'activityId'], [instanceId, 'instanceId']]) {
        const invalid = invalidIdResponse(value, label);
        if (invalid) return invalid;
    }

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId)
            .select('type status eventId quiz.quizType quiz.buzzer')
            .lean();

        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');
        if (activity.quiz?.quizType !== 'buzzer') {
            return badRequest('This activity is not an Electric Answers round.');
        }
        if (activity.status !== 'active') return forbidden('This activity is not running.');

        const quiz = activity.quiz;
        const buzzer = quiz.buzzer ?? {};
        const round = buzzer.round ?? {};
        const settings = buzzerSettings(quiz);

        if (!round.instanceId) {
            return conflict('No question is live.', { code: 'BUZZ_CLOSED' });
        }

        // The host has moved on and this phone had not polled yet. The team did
        // nothing wrong, so the app resyncs rather than showing a scolding.
        if (String(round.instanceId) !== String(instanceId)) {
            return conflict('That question has moved on.', {
                code: 'STALE_QUESTION',
                currentInstanceId: String(round.instanceId),
            });
        }

        const team = await resolveParticipantTeam(activity.eventId, auth.email);
        if (!team.teamId) {
            return forbidden('Electric Answers is played in teams.', { code: 'NOT_ELIGIBLE' });
        }

        // Leadership is resolved from the registration, or from the host's
        // override. Hiding the button on a member's phone is cosmetic; this is
        // the guard.
        if (!mayPressFor(buzzer, team, auth.email)) {
            return forbidden('Only your team leader can buzz.', { code: 'NOT_LEADER' });
        }

        const refusal = buzzRefusal({ round, settings, team, now: receivedAt });

        if (refusal === 'FALSE_START') {
            await lockOutFalseStart({ activity, round, team, auth, receivedAt });
            return conflict('Too early. Your team is out of this question.', {
                code: 'FALSE_START',
                armsAt: round.armsAt,
            });
        }

        if (refusal) return conflict(REFUSAL_TEXT[refusal], { code: refusal });

        const offsetMs = receivedAt.getTime() - new Date(round.armsAt).getTime();

        // The claim. Only one press can match this filter; the rest fall
        // through to the queue. The filter itself lives in the machine, next
        // to the rules it enforces.
        const { filter, update } = seatClaim({
            activityId: activity._id,
            round,
            team,
            leaderEmail: auth.email,
            leaderName: team.leaderName ?? auth.name ?? null,
            receivedAt,
            settings,
        });

        const claimed = await EventActivity.findOneAndUpdate(filter, update, {
            new: true,
            projection: { 'quiz.buzzer.round.seat': 1 },
        }).lean();

        const seated = Boolean(claimed);

        try {
            await BuzzPress.create({
                activityId: activity._id,
                eventId: activity.eventId,
                instanceId: round.instanceId,
                questionIndex: round.questionIndex ?? 0,
                teamId: String(team.teamId),
                teamName: team.teamName,
                teamKey: String(team.teamId),
                participantId: auth.email,
                email: auth.email,
                name: auth.name ?? team.leaderName ?? null,
                receivedAt,
                offsetMs,
                falseStart: false,
            });
        } catch (error) {
            // A duplicate here is this team's own second press. If it somehow
            // won the claim, the seat is still theirs and the answer, so say
            // so rather than refusing a press that took the floor.
            if (error?.code === 11000 && !seated) {
                return conflict('Your team has already buzzed.', { code: 'ALREADY_PRESSED' });
            }
            if (error?.code !== 11000) throw error;
        }

        if (seated) {
            return NextResponse.json({
                success: true,
                seated: true,
                offsetMs,
                answerEndsAt: claimed?.quiz?.buzzer?.round?.seat?.answerEndsAt ?? null,
                answerMode: round.answerMode ?? settings.answerMode,
            });
        }

        // Everyone ahead of this press, the seat included: position 1 is next
        // up if the team on the floor gets it wrong.
        const ahead = await BuzzPress.countDocuments({
            instanceId: round.instanceId,
            falseStart: false,
            receivedAt: { $lt: receivedAt },
        });

        return NextResponse.json({
            success: true,
            seated: false,
            queuePosition: Math.max(1, ahead),
            offsetMs,
        });

    } catch (error) {
        if (error?.code === 11000) {
            return conflict('Your team has already buzzed.', { code: 'ALREADY_PRESSED' });
        }
        return serverError(error, 'flutter/events/buzzer/press');
    }
}

const REFUSAL_TEXT = {
    NOT_ELIGIBLE: 'Your team is not in this question.',
    LOCKED_OUT: 'Your team is out of this question after a false start.',
    ALREADY_PRESSED: 'Your team has already buzzed.',
    BUZZ_CLOSED: 'The buzz window has closed.',
};

/**
 * A press before the button went live.
 *
 * Recorded as well as refused, so the console can show who jumped, and so
 * mashing the button before zero costs something rather than paying off. The
 * lockout is written with `$addToSet`, which makes a second early press from
 * the same team a no-op rather than a second entry.
 */
async function lockOutFalseStart({ activity, round, team, auth, receivedAt }) {
    await EventActivity.updateOne(
        { _id: activity._id, 'quiz.buzzer.round.instanceId': round.instanceId },
        { $addToSet: { 'quiz.buzzer.round.lockedOutTeamIds': String(team.teamId) } },
    );

    try {
        await BuzzPress.create({
            activityId: activity._id,
            eventId: activity.eventId,
            instanceId: round.instanceId,
            questionIndex: round.questionIndex ?? 0,
            teamId: String(team.teamId),
            teamName: team.teamName,
            teamKey: String(team.teamId),
            participantId: auth.email,
            email: auth.email,
            name: auth.name ?? team.leaderName ?? null,
            receivedAt,
            // Negative: how far before the button went live this arrived.
            offsetMs: receivedAt.getTime() - new Date(round.armsAt).getTime(),
            falseStart: true,
        });
    } catch (error) {
        // Already on record as having jumped. The lockout is what matters and
        // it is idempotent, so a second early press is not an error.
        if (error?.code !== 11000) throw error;
    }
}

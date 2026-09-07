import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import LiveAnswer from '@/models/LiveAnswer';
import {
    ROUND_STATE,
    GRACE_MS,
    effectiveRoundState,
    isTargeted,
    gradeLiveAnswer,
    resolveParticipantTeam,
} from '@/lib/live/rounds';
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
 * POST /api/flutter/events/quiz/answer — one answer to one host-opened question.
 *
 * The strict counterpart to `quiz/submit`. Everything that decides the outcome
 * is read from the server's own state:
 *
 *   who      — the verified session, not a `participantId` in the body
 *   which    — the round's `instanceId`, so a late reply to the previous
 *              question cannot land on the current one
 *   when     — `receivedAt`, stamped here, against the round's `endsAt`
 *   for whom — the team resolved from the participant's registration
 *   worth    — graded here against the stored `correctAnswer`
 *
 * The body carries an option and an instance id. Nothing else it could say
 * would change any of the above.
 *
 * Body: { activityId, instanceId, option }
 */
export async function POST(req) {
    // Before authentication and before the database, so neither a slow session
    // lookup nor a cold connection is charged to the participant's reaction time.
    const receivedAt = new Date();

    const auth = await requireEventUser(req);
    if (!auth.ok) return auth.response;

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, instanceId, option } = parsed.data;

    if (!activityId || !instanceId) return badRequest('activityId and instanceId are required.');
    if (typeof option !== 'string' || !option) return badRequest('option is required.');

    for (const [value, label] of [[activityId, 'activityId'], [instanceId, 'instanceId']]) {
        const invalid = invalidIdResponse(value, label);
        if (invalid) return invalid;
    }

    // Hoisted so the duplicate-key handler below can tell a team collision
    // apart from the same person answering twice.
    let teamKeyForRetry = null;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId).lean();
        if (!activity || activity.type !== 'quiz') return notFound('Quiz activity not found.');
        if (activity.status !== 'active') return forbidden('This activity is not running.');

        const quiz = activity.quiz ?? {};
        const round = quiz.liveRound ?? {};

        if (!round.instanceId) {
            return conflict('No question is open.', { code: 'ROUND_CLOSED' });
        }

        // A question the host has already moved on from. Distinguished from a
        // late answer because the participant did nothing wrong — their phone
        // simply had not polled yet — and the app shows the current question
        // rather than a scolding.
        if (String(round.instanceId) !== String(instanceId)) {
            return conflict('That question has moved on.', {
                code: 'STALE_QUESTION',
                currentInstanceId: String(round.instanceId),
            });
        }

        const state = effectiveRoundState(round, receivedAt);
        if (state !== ROUND_STATE.OPEN) {
            const late = round.endsAt
                && receivedAt.getTime() > new Date(round.endsAt).getTime() + GRACE_MS;
            return conflict(
                late ? 'Time is up for this question.' : 'This question is closed.',
                { code: late ? 'TOO_LATE' : 'ROUND_CLOSED' },
            );
        }

        const question = quiz.questions?.[round.questionIndex ?? 0];
        if (!question) return notFound('That question no longer exists.');
        if (!question.options?.includes(option)) {
            return badRequest('That is not one of the options.');
        }

        const isTeamScope = quiz.scope === 'team';
        const team = await resolveParticipantTeam(activity.eventId, auth.email);

        if (isTeamScope && !team.teamId) {
            return forbidden('This round is scored by team, and you are not registered with one.');
        }

        if (isTeamScope) teamKeyForRetry = team.teamId;

        if (!isTargeted(round, team.teamId)) {
            return forbidden('This question is for another team.', { code: 'NOT_YOUR_TURN' });
        }

        const elapsedMs = round.openedAt
            ? receivedAt.getTime() - new Date(round.openedAt).getTime()
            : 0;

        const { isCorrect, pointsAwarded } = gradeLiveAnswer({
            question,
            option,
            receivedAt,
            liveRound: round,
            scoring: quiz.scoring,
        });

        await LiveAnswer.create({
            activityId: activity._id,
            eventId: activity.eventId,
            instanceId: round.instanceId,
            questionIndex: round.questionIndex ?? 0,
            participantId: auth.email,
            name: auth.name,
            teamId: team.teamId,
            teamName: team.teamName,
            // Present only in team scope — that is what makes the unique index
            // partial, and what lets a hundred solo answers coexist.
            ...(isTeamScope ? { teamKey: team.teamId } : {}),
            option,
            receivedAt,
            elapsedMs,
            isCorrect,
            pointsAwarded,
        });

        return NextResponse.json({
            success: true,
            accepted: true,
            locked: true,
            elapsedMs,
            // Deliberately no `isCorrect`. The first person to answer would
            // otherwise be able to tell the room the answer while the round is
            // still open. It arrives in the status poll once the host reveals.
            message: 'Answer locked.',
        });

    } catch (error) {
        if (error?.code === 11000) {
            return await explainDuplicate({
                instanceId,
                teamKey: teamKeyForRetry,
                me: auth.email,
            });
        }
        return serverError(error, 'flutter/events/quiz/answer');
    }
}

/**
 * A duplicate key here means one of two quite different things, and the app
 * shows a different screen for each: you already answered, or a teammate
 * answered for the team. Worth one extra read to say which.
 *
 * Only the team index can be tripped by someone else, so the lookup runs only
 * in team scope.
 */
async function explainDuplicate({ instanceId, teamKey, me }) {
    if (teamKey) {
        try {
            const existing = await LiveAnswer.findOne({ instanceId, teamKey })
                .select('participantId name')
                .lean();

            if (existing && existing.participantId !== me) {
                return conflict(`${existing.name || 'A teammate'} already answered for your team.`, {
                    code: 'ALREADY_ANSWERED_BY_TEAMMATE',
                    answeredBy: existing.name || null,
                });
            }
        } catch {
            // Fall through to the generic message — the team's answer is
            // recorded either way, and failing to name the teammate who beat
            // you to it is not worth turning into a 500.
        }
    }

    return conflict('You have already answered this question.', { code: 'ALREADY_ANSWERED' });
}

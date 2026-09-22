import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import BuzzPress from '@/models/BuzzPress';
import BuzzAttempt from '@/models/BuzzAttempt';
import { buildBuzzerPayload } from '@/lib/buzzer/viewerPayload';
import { invalidIdResponse, notFound, serverError } from '@/lib/apiGuards';

/**
 * GET /api/events/[id]/arena — the projector.
 *
 * The room's view of the buzzer round: every team and its score, the question,
 * the countdown, who got there first and by how much, then the result. No
 * session, because a projector does not have one, and therefore nothing in the
 * payload that is addressed to any one viewer — no emails, no `canBuzz`, and
 * never an answer before the host reveals it.
 *
 * `force-dynamic` and `no-store` are not decoration. This is the one route in
 * the round with no cookie, which makes it the one route Next can statically
 * optimise and Netlify's CDN can cache — and a cached arena leaves the hall
 * staring at a question that was answered two minutes ago.
 */
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    const { id } = await params;

    const invalid = invalidIdResponse(id, 'event id');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findOne({ eventId: id, status: 'active', type: 'quiz' })
            .select('title quiz.quizType quiz.buzzer quiz.questions')
            .lean();

        if (!activity || activity.quiz?.quizType !== 'buzzer') {
            return notFound('No Electric Answers round is running for this event.');
        }

        const quiz = activity.quiz;
        const round = quiz.buzzer?.round ?? {};
        const question = round.instanceId ? quiz.questions?.[round.questionIndex ?? 0] ?? null : null;
        const revealing = round.phase === 'revealed' || round.phase === 'completed';

        const [presses, attempts] = round.instanceId
            ? await Promise.all([
                BuzzPress.find({ instanceId: round.instanceId })
                    .sort({ receivedAt: 1 })
                    .select('teamId teamName offsetMs falseStart')
                    .lean(),
                revealing
                    ? BuzzAttempt.find({ instanceId: round.instanceId }).select('teamId outcome').lean()
                    : [],
            ])
            : [[], []];

        const buzzer = buildBuzzerPayload({
            quiz,
            question,
            presses,
            attempts,
            arena: true,
        });

        return NextResponse.json(
            {
                success: true,
                // Flattened, not nested under `buzzer`: the projector page at
                // /event/arena/[id] reads the round straight off `data`.
                data: {
                    ...buzzer,
                    eventId: id,
                    activityId: String(activity._id),
                    title: activity.title,
                    serverTime: new Date().toISOString(),
                    // The same cadence the phones keep, so the projector and
                    // the room arm on the same beat.
                    pollAfterMs: FAST.has(buzzer.phase) ? 500 : 2000,
                },
            },
            { headers: { 'Cache-Control': 'no-store, max-age=0' } },
        );

    } catch (error) {
        return serverError(error, 'events/arena');
    }
}

const FAST = new Set(['staged', 'countdown', 'buzzing', 'seated']);

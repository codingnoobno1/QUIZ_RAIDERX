import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import EventVote from '@/models/EventVote';
import { readJson, invalidIdResponse, badRequest, notFound, conflict, serverError } from '@/lib/apiGuards';

/**
 * POST /api/flutter/events/vote
 * Body: { participantId, activityId, option }
 */
export async function POST(req) {
    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { participantId, activityId, option } = parsed.data;

    if (!participantId || !activityId || !option) {
        return badRequest('participantId, activityId, and option are all required');
    }

    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId).lean();
        if (!activity || activity.type !== 'voting') {
            return notFound('Voting activity not found');
        }

        if (activity.status !== 'active') {
            return NextResponse.json(
                { error: 'Voting is not currently active. Wait for admin to activate it.' },
                { status: 403 }
            );
        }

        if (!activity.voting?.options?.includes(option)) {
            return badRequest('Invalid option');
        }

        // Prevent duplicate votes (unless allowMultiple). The unique index on
        // (participantId, activityId) is the real guard — two taps in the same
        // instant both pass this read, and the 11000 below catches the loser.
        if (!activity.voting.allowMultiple) {
            const existing = await EventVote.findOne({ participantId, activityId }).select('option').lean();
            if (existing) {
                return conflict('You have already voted in this poll.', {
                    code: 'DUPLICATE_VOTE',
                    myVote: existing.option,
                    ...(activity.voting.showLiveResults ? { results: await tally(activityId, activity) } : {}),
                });
            }
        }

        await EventVote.create({
            participantId,
            activityId,
            eventId: activity.eventId,
            option
        });

        return NextResponse.json({
            success: true,
            message: 'Vote recorded!',
            myVote: option,
            results: activity.voting.showLiveResults ? await tally(activityId, activity) : null
        });

    } catch (err) {
        if (err.code === 11000) {
            // Lost the race against the participant's own second tap. Their vote
            // is recorded either way, so report it as the settled state rather
            // than as a failure.
            return conflict('You have already voted.', { code: 'DUPLICATE_VOTE' });
        }
        return serverError(err, 'flutter/events/vote');
    }
}

/**
 * GET /api/flutter/events/vote?activityId=[id]&participantId=[id]
 *
 * The live tally, plus this participant's own choice when they pass an id —
 * that is what lets a client restore "you voted for X" after a reload instead
 * of offering a vote it will then reject with a 409.
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get('activityId');
    const participantId = searchParams.get('participantId');

    if (!activityId) return badRequest('activityId is required');

    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId).lean();
        if (!activity || activity.type !== 'voting') {
            return notFound('Voting activity not found');
        }

        const results = await tally(activityId, activity);

        let myVote = null;
        if (participantId) {
            const mine = await EventVote.findOne({ activityId, participantId }).select('option').lean();
            myVote = mine?.option ?? null;
        }

        return NextResponse.json({
            success: true,
            data: {
                question: activity.voting?.question,
                total: Object.values(results).reduce((sum, r) => sum + r.count, 0),
                results,
                myVote,
                // Withheld unless the organiser turned live results on, so a
                // client can tell "no votes yet" from "you can't see these yet".
                resultsVisible: Boolean(activity.voting?.showLiveResults),
                activityStatus: activity.status
            }
        });

    } catch (err) {
        return serverError(err, 'flutter/events/vote/tally');
    }
}

/** { option: { count, percentage } } for every configured option. */
async function tally(activityId, activity) {
    const counts = await EventVote.aggregate([
        { $match: { activityId: activity._id } },
        { $group: { _id: '$option', count: { $sum: 1 } } },
    ]);

    const byOption = new Map(counts.map((c) => [c._id, c.count]));
    const total = counts.reduce((sum, c) => sum + c.count, 0);

    return (activity.voting?.options || []).reduce((acc, opt) => {
        const count = byOption.get(opt) ?? 0;
        acc[opt] = { count, percentage: total > 0 ? Math.round((count / total) * 100) : 0 };
        return acc;
    }, {});
}

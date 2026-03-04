import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import EventVote from '@/models/EventVote';

/**
 * POST /api/flutter/events/vote
 * Submit a vote for the currently active voting activity.
 *
 * Body: { participantId, activityId, option }
 */
export async function POST(req) {
    try {
        await connectDB();
        const { participantId, activityId, option } = await req.json();

        if (!participantId || !activityId || !option) {
            return NextResponse.json(
                { error: 'participantId, activityId, and option are all required' },
                { status: 400 }
            );
        }

        const activity = await EventActivity.findById(activityId).lean();

        if (!activity || activity.type !== 'voting') {
            return NextResponse.json({ error: 'Voting activity not found' }, { status: 404 });
        }

        if (activity.status !== 'active') {
            return NextResponse.json(
                { error: 'Voting is not currently active. Wait for admin to activate it.' },
                { status: 403 }
            );
        }

        if (!activity.voting?.options?.includes(option)) {
            return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
        }

        // Prevent duplicate votes (unless allowMultiple)
        if (!activity.voting.allowMultiple) {
            const existing = await EventVote.findOne({ participantId, activityId });
            if (existing) {
                return NextResponse.json(
                    { error: 'You have already voted in this poll.', code: 'DUPLICATE_VOTE' },
                    { status: 409 }
                );
            }
        }

        await EventVote.create({
            participantId,
            activityId,
            eventId: activity.eventId,
            option
        });

        // Return live results if enabled
        let results = null;
        if (activity.voting.showLiveResults) {
            const allVotes = await EventVote.find({ activityId }).lean();
            const total = allVotes.length;
            results = (activity.voting.options).reduce((acc, opt) => {
                const count = allVotes.filter(v => v.option === opt).length;
                acc[opt] = {
                    count,
                    percentage: total > 0 ? Math.round((count / total) * 100) : 0
                };
                return acc;
            }, {});
        }

        return NextResponse.json({
            success: true,
            message: 'Vote recorded!',
            results
        });

    } catch (err) {
        if (err.code === 11000) {
            return NextResponse.json(
                { error: 'You have already voted.', code: 'DUPLICATE_VOTE' },
                { status: 409 }
            );
        }
        console.error('Vote error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * GET /api/flutter/events/vote?activityId=[id]
 * Fetch the live vote tally for a voting activity.
 */
export async function GET(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get('activityId');

        if (!activityId) {
            return NextResponse.json({ error: 'activityId is required' }, { status: 400 });
        }

        const activity = await EventActivity.findById(activityId).lean();
        if (!activity || activity.type !== 'voting') {
            return NextResponse.json({ error: 'Voting activity not found' }, { status: 404 });
        }

        const allVotes = await EventVote.find({ activityId }).lean();
        const total = allVotes.length;
        const results = (activity.voting?.options || []).reduce((acc, opt) => {
            const count = allVotes.filter(v => v.option === opt).length;
            acc[opt] = {
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            };
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            data: {
                question: activity.voting?.question,
                total,
                results,
                activityStatus: activity.status
            }
        });

    } catch (err) {
        console.error('Vote fetch error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

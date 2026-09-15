import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import EventRegistration from '@/models/EventRegistration';
import EventVote from '@/models/EventVote';
import { nameIndex } from '@/lib/live/activities';
import { requireAdmin, invalidIdResponse, notFound, serverError } from '@/lib/apiGuards';

/**
 * GET /api/admin/events/activities/votes?activityId=[id]
 *
 * The tally for a poll, and who voted for what. Admin only: the per-person list
 * is not something the room should be able to read.
 *
 * Percentages are rounded independently, so they can sum to 99 or 101 — the
 * counts are exact and are what any decision should rest on.
 */
export async function GET(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const activityId = new URL(req.url).searchParams.get('activityId');
    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const activity = await EventActivity.findById(activityId)
            .select('type status voting eventId').lean();
        if (!activity || activity.type !== 'voting') return notFound('Voting activity not found.');

        const [votes, registrations] = await Promise.all([
            EventVote.find({ activityId }).sort({ createdAt: -1 }).lean(),
            EventRegistration.find({ eventId: activity.eventId }).select('name email enrollmentNumber members').lean(),
        ]);

        const nameOf = nameIndex(registrations);
        const total = votes.length;
        const counts = votes.reduce((acc, v) => acc.set(v.option, (acc.get(v.option) ?? 0) + 1), new Map());

        const results = Object.fromEntries((activity.voting?.options ?? []).map((opt) => {
            const count = counts.get(opt) ?? 0;
            return [opt, { count, percentage: total ? Math.round((count / total) * 100) : 0 }];
        }));

        return NextResponse.json({
            success: true,
            data: {
                question: activity.voting?.question,
                total,
                results,
                detailedVotes: votes.map((v) => ({
                    participantId: v.participantId,
                    fullName: nameOf(v.participantId),
                    option: v.option,
                    votedAt: v.createdAt,
                })),
                status: activity.status,
            },
        });
    } catch (error) {
        return serverError(error, 'admin/events/activities/votes');
    }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';
import Result from '@/models/Result';
import Project from '@/models/project';
import Research from '@/models/Research';

/**
 * GET /api/user/stats
 *
 * Aggregated student stats: events, quizzes, projects, research, rank.
 *
 * Auth: accepts getServerSession; falls back to query params so the
 * client-side dashboard can pass ?email=&enrollment=&uuid=&name=
 * (next-auth JWT is httpOnly so client cannot send it in fetch body).
 *
 * Returns:
 *   { ok: true, data: { events, quizzes, projects, research, rank } }
 */
export async function GET(req) {
    try {
        // ── Resolve identity ─────────────────────────────────────────────────
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);

        const email = (
            session?.user?.email || searchParams.get('email') || ''
        ).toLowerCase().trim();

        const enrollment = (
            session?.user?.enrollmentNumber || searchParams.get('enrollment') || ''
        ).trim();

        const uuid = (
            session?.user?.uuid || searchParams.get('uuid') || ''
        ).trim();

        const name = (
            session?.user?.name || searchParams.get('name') || ''
        ).trim();

        if (!email) {
            return NextResponse.json({ ok: false, error: 'Unauthorized — email required' }, { status: 401 });
        }

        await connectDB();

        // All string identifiers that Result.studentId might hold
        const identifiers = [email, uuid, enrollment]
            .filter(Boolean)
            .map(v => v.toLowerCase());

        // ── Parallel aggregation ─────────────────────────────────────────────
        const [
            events,
            quizzes,
            projects,
            research,
            myScoreAgg,
        ] = await Promise.all([
            // Events where this user is the registrant OR an accepted team member
            EventRegistration.countDocuments({
                $or: [
                    { email },
                    { 'members.email': email, 'members.inviteStatus': 'accepted' },
                ],
            }),

            // Completed quiz results — studentId can be email / uuid / enrollment
            Result.countDocuments({
                status: 'completed',
                studentId: { $in: identifiers },
            }),

            // Projects submitted by this student (by enrollment)
            enrollment
                ? Project.countDocuments({ 'submittedBy.enrollment': enrollment })
                : 0,

            // Research papers authored by this student (name match)
            name
                ? Research.countDocuments({
                    submitterName: { $regex: `^${name}$`, $options: 'i' },
                })
                : 0,

            // Total score this student has accumulated (for rank computation)
            Result.aggregate([
                {
                    $match: {
                        status: 'completed',
                        studentId: { $in: identifiers },
                    },
                },
                { $group: { _id: null, total: { $sum: '$score' } } },
            ]),
        ]);

        // ── Rank (best-effort) ───────────────────────────────────────────────
        const myTotal = myScoreAgg[0]?.total ?? 0;
        let rank = null;

        if (myTotal > 0) {
            // Count distinct students who scored strictly higher in total
            const aboveMe = await Result.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: '$studentId', total: { $sum: '$score' } } },
                { $match: { total: { $gt: myTotal } } },
                { $count: 'higher' },
            ]);
            rank = (aboveMe[0]?.higher ?? 0) + 1;
        }

        return NextResponse.json({
            ok: true,
            data: {
                events,
                quizzes,
                projects,
                research,
                rank,        // null if user has no quiz scores yet
                totalScore: myTotal,
            },
        });

    } catch (err) {
        console.error('[GET /api/user/stats]', err);
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}

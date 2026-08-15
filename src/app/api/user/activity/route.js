import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongo';
import EventRegistration from '@/models/EventRegistration';
import Result from '@/models/Result';
import Project from '@/models/project';
import Research from '@/models/Research';

/**
 * GET /api/user/activity
 *
 * Unified, sorted activity feed for the authenticated student.
 * Sources: event registrations · quiz results · project submissions · research papers.
 *
 * Auth: same pattern as /api/user/stats — session first, then URL params.
 *
 * Returns:
 *   { ok: true, data: ActivityItem[] }   (sorted newest-first, max 20)
 *
 * ActivityItem shape:
 *   { type: 'event'|'quiz'|'project'|'research', color, title, meta, ts }
 */
export async function GET(req) {
    try {
        // ── Identity ─────────────────────────────────────────────────────────
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

        const identifiers = [email, uuid, enrollment]
            .filter(Boolean)
            .map(v => v.toLowerCase());

        // ── Parallel fetch ───────────────────────────────────────────────────
        const [eventRegs, quizResults, projects, research] = await Promise.all([
            // Event registrations — populate event title + date
            EventRegistration.find({
                $or: [
                    { email },
                    { 'members.email': email, 'members.inviteStatus': 'accepted' },
                ],
            })
                .populate('eventId', 'title date')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),

            // Completed quiz results — populate quiz title
            Result.find({
                status: 'completed',
                studentId: { $in: identifiers },
            })
                .populate('quizId', 'title')
                .sort({ endTime: -1 })
                .limit(10)
                .lean(),

            // Project submissions
            enrollment
                ? Project.find({ 'submittedBy.enrollment': enrollment })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean()
                : [],

            // Research papers
            name
                ? Research.find({
                    submitterName: { $regex: `^${name}$`, $options: 'i' },
                })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean()
                : [],
        ]);

        // ── Normalise to unified items ────────────────────────────────────────
        const items = [];

        const fmt = (d) =>
            d
                ? new Date(d).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                })
                : null;

        for (const r of eventRegs) {
            items.push({
                type: 'event',
                color: '#22d3ee',
                title: `Registered for ${r.eventId?.title || 'an event'}`,
                meta: r.createdAt ? fmt(r.createdAt) : null,
                ts: r.createdAt ? new Date(r.createdAt).getTime() : 0,
            });
        }

        for (const r of quizResults) {
            const pct =
                r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : null;
            items.push({
                type: 'quiz',
                color: '#a855f7',
                title: `Completed ${r.quizId?.title || 'a quiz'}`,
                meta:
                    pct != null
                        ? `Score: ${r.score}/${r.maxScore} (${pct}%)`
                        : r.score != null
                        ? `Score: ${r.score}`
                        : null,
                ts: r.endTime ? new Date(r.endTime).getTime() : (r.createdAt ? new Date(r.createdAt).getTime() : 0),
            });
        }

        for (const p of projects) {
            const badge =
                p.status === 'accepted'
                    ? '✓ Approved'
                    : p.status === 'rejected'
                    ? '✗ Rejected'
                    : '⏳ Pending';
            items.push({
                type: 'project',
                color: '#34d399',
                title: `${p.type ? `[${p.type}] ` : ''}${p.title}`,
                meta: badge,
                ts: p.createdAt ? new Date(p.createdAt).getTime() : 0,
            });
        }

        for (const r of research) {
            const badge =
                r.status === 'approved'
                    ? '✓ Published'
                    : r.status === 'rejected'
                    ? '✗ Rejected'
                    : '⏳ Under Review';
            items.push({
                type: 'research',
                color: '#f59e0b',
                title: r.title,
                meta: `${r.publicationType} · ${badge}`,
                ts: r.createdAt ? new Date(r.createdAt).getTime() : 0,
            });
        }

        // Sort newest-first
        items.sort((a, b) => b.ts - a.ts);

        return NextResponse.json({ ok: true, data: items.slice(0, 20) });

    } catch (err) {
        console.error('[GET /api/user/activity]', err);
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}

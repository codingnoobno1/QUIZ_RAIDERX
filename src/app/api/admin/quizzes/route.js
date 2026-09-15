import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Quiz from '@/models/Quiz';
import { requireAdmin } from '@/lib/apiGuards';

/**
 * GET /api/admin/quizzes — quiz titles for the admin list.
 *
 * Admin-guarded like every other route under /api/admin. It only ever exposed
 * titles, not questions, but an admin path that answers anonymous callers
 * invites the next field added to that `.select()` to leak.
 */
export async function GET(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    await connectDB();
    try {
        const quizzes = await Quiz.find({})
            .select('title availabilityStatus createdAt')
            .sort({ createdAt: -1 })
            .lean();
        return NextResponse.json(quizzes, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching quizzes' }, { status: 500 });
    }
}

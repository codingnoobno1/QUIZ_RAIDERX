import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Research from '@/models/Research';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper to check admin role
async function isAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'student_admin')) {
        return false;
    }
    return true;
}

export async function GET(req) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const pendingResearch = await Research.find({ status: 'pending' }).sort({ createdAt: -1 });
        return NextResponse.json({ data: pendingResearch }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, status } = await req.json();
        if (!id || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        await connectDB();
        const updatedResearch = await Research.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedResearch) {
            return NextResponse.json({ error: 'Research not found' }, { status: 404 });
        }

        return NextResponse.json({ message: `Research ${status}`, data: updatedResearch }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

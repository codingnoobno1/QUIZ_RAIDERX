import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import PortfolioProject from '@/models/PortfolioProject';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === 'admin' || session?.user?.role === 'student_admin';
}

export async function GET() {
    try {
        if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const pendingProjects = await PortfolioProject.find({ status: 'pending' }).sort({ createdAt: -1 });

        return NextResponse.json({ data: pendingProjects }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, status } = await req.json();
        await connectDB();
        const updated = await PortfolioProject.findByIdAndUpdate(id, { status }, { new: true });

        return NextResponse.json({ data: updated }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

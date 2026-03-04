import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Quiz from '@/models/Quiz';

export async function GET() {
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

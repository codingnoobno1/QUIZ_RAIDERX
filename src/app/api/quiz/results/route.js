import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Result from '@/models/Result';
import Quiz from '@/models/Quiz';

// GET /api/quiz/results - Fetch all quiz results for admin
export async function GET(request) {
    await connectDB();

    try {
        const { searchParams } = new URL(request.url);
        const quizId = searchParams.get('quizId');

        // Build query
        const query = {};
        if (quizId) {
            query.quizId = quizId;
        }

        // Only show completed attempts
        query.status = 'completed';

        // Fetch results with quiz info
        const results = await Result.find(query)
            .populate({
                path: 'quizId',
                select: 'title description maxMarks batch semester'
            })
            .sort({ endTime: -1 }) // Most recent first
            .lean();

        // Format for admin display
        const formattedResults = results.map(result => ({
            id: result._id,
            studentName: result.studentId || 'Anonymous',
            quizTitle: result.quizId?.title || 'Unknown Quiz',
            quizBatch: result.quizId?.batch,
            quizSemester: result.quizId?.semester,
            score: result.score?.toFixed(2) || 0,
            maxScore: result.maxScore || result.quizId?.maxMarks || 'N/A',
            percentage: result.maxScore
                ? ((result.score / result.maxScore) * 100).toFixed(1) + '%'
                : 'N/A',
            totalQuestions: result.answers?.length || 0,
            correctAnswers: result.answers?.filter(a => a.isCorrect).length || 0,
            startTime: result.startTime,
            endTime: result.endTime,
            timeTaken: result.endTime && result.startTime
                ? Math.round((new Date(result.endTime) - new Date(result.startTime)) / 60000) + ' min'
                : 'N/A'
        }));

        return NextResponse.json({
            success: true,
            count: formattedResults.length,
            results: formattedResults
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching quiz results:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quiz results', details: error.message },
            { status: 500 }
        );
    }
}

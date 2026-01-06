import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Result from '@/models/Result';
import Quiz from '@/models/Quiz';
import { cookies } from 'next/headers';

export async function POST(request) {
    await connectDB();

    try {
        const { quizId, studentName } = await request.json();

        // Get studentName from request body or cookies
        const cookieStore = await cookies();
        const studentIdentifier = studentName || cookieStore.get('studentName')?.value;

        if (!studentIdentifier) {
            return NextResponse.json({
                error: 'Student identification required'
            }, { status: 400 });
        }

        // Check if student has already submitted this quiz
        const existingSubmission = await Result.findOne({
            quizId,
            studentId: studentIdentifier,
            status: 'completed'
        });

        if (existingSubmission) {
            return NextResponse.json({
                error: 'Quiz already submitted',
                message: `You have already completed this quiz on ${existingSubmission.endTime?.toLocaleDateString() || 'a previous date'}`,
                alreadySubmitted: true,
                score: existingSubmission.score
            }, { status: 403 });
        }

        // Check if quiz exists and student is in submittedBy array
        const quiz = await Quiz.findById(quizId);
        if (quiz && quiz.submittedBy && quiz.submittedBy.includes(studentIdentifier)) {
            return NextResponse.json({
                error: 'Quiz already submitted',
                message: 'You have already completed this quiz',
                alreadySubmitted: true
            }, { status: 403 });
        }

        // Create new attempt
        const newAttempt = await Result.create({
            quizId,
            studentId: studentIdentifier,
            status: 'in-progress',
            startTime: new Date()
        });

        return NextResponse.json({
            success: true,
            attemptId: newAttempt._id
        }, { status: 201 });

    } catch (error) {
        console.error('Error starting quiz attempt:', error);
        return NextResponse.json(
            { error: 'Failed to start quiz attempt' },
            { status: 500 }
        );
    }
}

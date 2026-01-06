import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import Section from '@/models/Section';

export async function GET(request, { params }) {
    await connectDB();
    const { id } = await params;

    try {
        const quiz = await Quiz.findById(id)
            .populate('subjectId', 'name description')
            .populate('sectionId')
            .populate('createdBy', 'name email')
            .populate('questions');



        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        // Check if quiz is available to students
        const now = new Date();
        let isAvailable = false;

        if (quiz.availabilityStatus === 'on') {
            isAvailable = true;
        } else if (quiz.availabilityStatus === 'scheduled') {
            const started = !quiz.scheduledStartTime || now >= new Date(quiz.scheduledStartTime);
            const notEnded = !quiz.scheduledEndTime || now <= new Date(quiz.scheduledEndTime);
            isAvailable = started && notEnded;
        }

        if (!isAvailable) {
            return NextResponse.json({
                error: 'Quiz is not currently available'
            }, { status: 403 });
        }

        // Remove correct answers for students (they'll be validated on submission)
        const sanitizedQuiz = quiz.toObject();
        sanitizedQuiz.questions = sanitizedQuiz.questions.map(q => {
            const question = { ...q };
            delete question.correctAnswer;
            if (question.testCases) {
                question.testCases = question.testCases.map(tc => ({
                    input: tc.input
                    // output removed for security
                }));
            }
            return question;
        });

        return NextResponse.json({
            success: true,
            quiz: sanitizedQuiz
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching quiz:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quiz', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request, { params }) {
    await connectDB();
    const { id } = await params;

    try {
        const { userAnswers } = await request.json();

        // Fetch quiz with all question details (including correct answers)
        const quiz = await Quiz.findById(id).populate('questions');

        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        let totalScore = 0;
        const results = [];

        // Map questions for O(1) access
        const questionMap = new Map(quiz.questions.map(q => [q._id.toString(), q]));

        for (const ua of userAnswers) {
            const questionId = ua.questionId;
            const question = questionMap.get(questionId);

            if (!question) continue;

            let isCorrect = false;
            let points = 0;

            // Simple string comparison for now. 
            // Normalize strings: trim and lowercase
            const normalize = (str) => String(str || '').trim().toLowerCase();

            if (['mcq', 'fillup', 'findoutput', 'truefalse'].includes(question.type)) {
                if (normalize(ua.answer) === normalize(question.correctAnswer)) {
                    isCorrect = true;
                    points = question.points || 1;

                    // Add time bonus if applicable (logic from client reused)
                    // Server relies on 'timeTaken' from client which is not secure but acceptable for this usecase
                    const timeAllowed = question.timeLimit || 30;
                    const saved = Math.max(0, timeAllowed - (ua.timeTaken || timeAllowed));
                    const bonus = Math.floor((saved / timeAllowed) * 10) * 0.5;
                    points += bonus;
                }
            } else {
                // For complex types, assume manual grading or always false for now
                isCorrect = false;
            }

            totalScore += points;

            results.push({
                questionId,
                question: question, // Return full question with correct answer
                userAnswer: ua.answer,
                isCorrect,
                points,
                timeTaken: ua.timeTaken
            });
        }

        return NextResponse.json({
            success: true,
            score: totalScore,
            results: results
        }, { status: 200 });

    } catch (error) {
        console.error('Error submitting quiz:', error);
        return NextResponse.json(
            { error: 'Failed to submit quiz', details: error.message },
            { status: 500 }
        );
    }
}

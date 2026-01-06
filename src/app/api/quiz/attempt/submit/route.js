import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Result from '@/models/Result';
import Quiz from '@/models/Quiz';

export async function POST(request) {
    await connectDB();

    try {
        const { attemptId, userAnswers } = await request.json();

        // 1. Fetch Attempt
        const resultRecord = await Result.findById(attemptId);
        if (!resultRecord) {
            return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
        }

        if (resultRecord.status === 'completed') {
            return NextResponse.json({ error: 'Attempt already submitted' }, { status: 400 });
        }

        // 2. Fetch Quiz to grade
        // 🚀 CRITICAL: Must populate questions to get correctAnswers
        const quiz = await Quiz.findById(resultRecord.quizId).populate({
            path: 'questions',
            select: 'text type correctAnswer points timeLimit options' // Explicitly select fields needed for grading
        });

        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        // 3. Grade Answers using Hash Map (O(n))
        let totalScore = 0;
        const gradedAnswers = [];

        // Create Map of User Answers [QuestionId -> Answer Object]
        const userAnswerMap = new Map();
        userAnswers.forEach(ua => {
            userAnswerMap.set(String(ua.questionId), ua);
        });

        console.log(`[SUBMIT AUTHORITATIVE] Grading ${userAnswers.length} answers against ${quiz.questions.length} questions.`);

        for (const question of quiz.questions) {
            const questionId = String(question._id);
            const userEntry = userAnswerMap.get(questionId);

            let isCorrect = false;
            let pointsAwarded = 0;
            let timeTaken = 0;
            let userAnswerValue = null;

            if (userEntry) {
                userAnswerValue = userEntry.answer;
                timeTaken = userEntry.timeTaken || 0;

                // Normalization for string-based answers
                const normalize = (val) => String(val || '').trim().toLowerCase();
                const normalizedUserAnswer = normalize(userAnswerValue);
                const normalizedCorrectAnswer = normalize(question.correctAnswer);

                if (['mcq', 'fillup', 'findoutput', 'truefalse'].includes(question.type)) {
                    if (normalizedUserAnswer === normalizedCorrectAnswer) {
                        isCorrect = true;
                        pointsAwarded = question.points || 1;

                        // Optional Time Bonus Calculation
                        const timeLimit = question.timeLimit || 30;
                        if (timeTaken < timeLimit) {
                            const saved = timeLimit - timeTaken;
                            const bonus = Math.floor((saved / timeLimit) * 10) * 0.1; // Reduced bonus weight
                            pointsAwarded += bonus;
                        }
                    }
                } else if (['simplecode', 'blockcode', 'testcasecode'].includes(question.type)) {
                    // Basic Code Grading Strategy (Placeholder for Sandbox)
                    // Currently checks for exact match or creates a 'manual review' flag (not implemented yet)
                    // Let's do a loose string match ignoring whitespace for now
                    const looseUser = normalizedUserAnswer.replace(/\s+/g, '');
                    const looseCorrect = normalizedCorrectAnswer.replace(/\s+/g, '');

                    if (looseUser === looseCorrect && looseCorrect.length > 0) {
                        isCorrect = true;
                        pointsAwarded = question.points || 1;
                    }
                    // Future: Add keyword checks or external runner invocation here
                }
            }

            if (isCorrect) {
                totalScore += pointsAwarded;
            }

            // Push authoritative result for this question
            gradedAnswers.push({
                questionId: question._id,
                // We return the FULL question object structure expected by UI, or at least text/correctAnswer
                question: {
                    text: question.text,
                    correctAnswer: question.correctAnswer,
                    type: question.type,
                    options: question.options // if needed for review display
                },
                userAnswer: userAnswerValue,
                isCorrect,
                points: pointsAwarded, // Return points awarded for this specific question
                timeTaken
            });
        }

        console.log(`[SUBMIT AUTHORITATIVE] Grading complete. Total Score: ${totalScore}`);

        // 4. Update Result Record
        resultRecord.score = totalScore;
        resultRecord.answers = gradedAnswers;
        resultRecord.status = 'completed';
        resultRecord.endTime = new Date();
        await resultRecord.save();

        // 4.5 Add student to Quiz's submittedBy array
        if (resultRecord.studentId) {
            await Quiz.findByIdAndUpdate(
                resultRecord.quizId,
                { $addToSet: { submittedBy: resultRecord.studentId } }
            );
        }

        // 5. Structure Response for Client
        // We need to send back the FULL comparison (including correct answers) for the UI
        // 5. Structure Response for Client
        // Flatten to match requested Data Contract exactly
        const review = gradedAnswers.map(ga => {
            // ga.question has the populated doc
            // We'll flatten it here for the client
            return {
                questionId: ga.questionId,
                questionText: ga.question.text,
                userAnswer: ga.userAnswer,
                correctAnswer: ga.question.correctAnswer, // AUTHORITATIVE SOURCE
                isCorrect: ga.isCorrect,
                pointsAwarded: ga.points,
                timeTaken: ga.timeTaken,
                explanation: ga.question.explanation // Optional if you have it
            };
        });

        return NextResponse.json({
            success: true,
            score: totalScore,
            review: review // Using 'review' as requested
        }, { status: 200 });

    } catch (error) {
        console.error('Error submitting quiz attempt:', error);
        return NextResponse.json(
            { error: 'Failed to submit quiz attempt' },
            { status: 500 }
        );
    }
}

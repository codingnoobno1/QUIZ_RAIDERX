import mongoose from 'mongoose';

/**
 * QuizSubmission — stores every participant's quiz attempt.
 * Written by QUIZ_RAIDERX on submit, read by stud_admin for reporting.
 * Collection: quiz_submissions (shared QUIZ database)
 */

const AnswerSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    questionText: { type: String },
    selectedOption: { type: String },
    correctAnswer: { type: String },
    isCorrect: { type: Boolean, default: false },
    pointsAwarded: { type: Number, default: 0 }
}, { _id: false });

const QuizSubmissionSchema = new mongoose.Schema({
    // Identity
    activityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventActivity',
        required: true,
        index: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    participantId: {
        type: String,
        required: true,
        index: true
    },

    // Result
    answers: [AnswerSchema],
    score: { type: Number, default: 0 },
    totalPossible: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },

    // Meta
    quizType: { type: String }, // rapid_fire | custom_live | preloaded
    timeTakenSeconds: { type: Number },
    submittedAt: { type: Date, default: Date.now }

}, {
    collection: 'quiz_submissions',
    timestamps: true
});

// One submission per participant per activity
QuizSubmissionSchema.index({ activityId: 1, participantId: 1 }, { unique: true });

export default mongoose.models.QuizSubmission
    || mongoose.model('QuizSubmission', QuizSubmissionSchema);

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
    pointsAwarded: { type: Number, default: 0 },
    /** A power question, earned by submitting early. */
    isPower: { type: Boolean, default: false }
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

    /**
     * Resolved from the participant's registration when the attempt is graded,
     * not matched by string at report time.
     *
     * The leaderboard used to reconstruct team identity afterwards by looking
     * a `participantId` up against enrollment number, email, registration id
     * and teamId in turn — so an id that matched none of them silently became a
     * new solo entrant on the board. Storing the resolution at write time makes
     * the join an id lookup instead of a guess.
     *
     * `teamKey` mirrors `teamId` and exists only in team scope, so the unique
     * index below can be partial on its presence.
     */
    teamId: { type: String, default: null },
    teamName: { type: String, default: null },
    teamKey: { type: String },
    scope: { type: String, enum: ['individual', 'team'], default: 'individual' },

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

// One submission per participant per activity.
QuizSubmissionSchema.index({ activityId: 1, participantId: 1 }, { unique: true });

// Team scope: one attempt for the whole team, whoever gets there first. The
// constraint simply does not exist for individual rounds, where `teamKey` is
// absent.
QuizSubmissionSchema.index(
    { activityId: 1, teamKey: 1 },
    {
        unique: true,
        name: 'uniq_submission_team',
        partialFilterExpression: { teamKey: { $exists: true } },
    },
);

export default mongoose.models.QuizSubmission
    || mongoose.model('QuizSubmission', QuizSubmissionSchema);

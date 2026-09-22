import mongoose from 'mongoose';

/**
 * One team's go at one question — where the score comes from.
 *
 * Kept apart from the press that won the seat because they answer different
 * questions: a press is "who got there first", an attempt is "what it was
 * worth". A question can produce several attempts as the host passes it down
 * the queue, and each is scored on its own.
 *
 * Scores are a sum over these rows rather than a running total on the activity.
 * A negative row for a wrong answer then needs no special case, and a host who
 * overrides a grade changes one row instead of arithmetic nobody can audit.
 */
const BuzzAttemptSchema = new mongoose.Schema({
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventActivity', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },

    instanceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    questionIndex: { type: Number, required: true },

    teamId: { type: String, required: true },
    teamName: { type: String, default: null },

    /** 1 = won the buzz, 2 = the first pass, and so on down the queue. */
    attempt: { type: Number, default: 1 },

    answerMode: { type: String, enum: ['in_app', 'spoken'], default: 'in_app' },
    submittedAnswer: { type: String, default: null },

    /** `auto` for an in-app grade, otherwise the host's address. */
    judgedBy: { type: String, default: 'auto' },
    outcome: { type: String, enum: ['correct', 'wrong', 'timeout'], required: true },
    points: { type: Number, default: 0 },

    /**
     * A sudden-death win breaks a tie without inflating the score that caused
     * it, so it is counted here and ranked after score rather than added to it.
     */
    isTiebreak: { type: Boolean, default: false },

    /** How long the team held the seat before it was decided. Ranks ties. */
    seatMs: { type: Number, default: 0 },

    decidedAt: { type: Date, required: true },
}, {
    collection: 'buzz_attempts',
    timestamps: true,
});

// One attempt per team per staging — a host who marks the same seat twice
// updates the row rather than scoring it twice.
BuzzAttemptSchema.index(
    { instanceId: 1, teamId: 1 },
    { unique: true, name: 'uniq_buzz_attempt_team' },
);

// The standings rollup.
BuzzAttemptSchema.index({ activityId: 1, teamId: 1 }, { name: 'buzz_attempt_rollup' });

export default mongoose.models.BuzzAttempt || mongoose.model('BuzzAttempt', BuzzAttemptSchema);

import mongoose from 'mongoose';

/**
 * One answer to one host-opened question.
 *
 * The design mirrors FastestFingerSubmission, for the same reasons: the client
 * sends an option and nothing else, `receivedAt` and `elapsedMs` are measured
 * here, and a unique index — not a disabled button — is what stops a second
 * attempt.
 *
 * `instanceId` is the piece that makes a round re-runnable. It is minted fresh
 * every time the host opens a question, so re-asking question 3 (a tie-break, a
 * projector failure, a round the host wants to redo) produces a new instance
 * whose answers cannot collide with the abandoned one. Grouping by
 * `questionIndex` instead would have made the second attempt a duplicate-key
 * error for everyone who answered the first.
 */
const LiveAnswerSchema = new mongoose.Schema({
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventActivity', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },

    /** The specific opening of a question. New on every OPEN_QUESTION. */
    instanceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    questionIndex: { type: Number, required: true },

    /** Taken from the verified session, never from the request body. */
    participantId: { type: String, required: true, index: true },
    name: { type: String },

    /**
     * Resolved server-side from the participant's EventRegistration.
     *
     * `teamKey` exists only in team scope and carries the same value as
     * `teamId`. It is a separate field so the unique index below can be partial
     * on its presence — in individual scope every row omits it, and a hundred
     * solo answers to the same question do not collide.
     */
    teamId: { type: String, default: null },
    teamName: { type: String, default: null },
    teamKey: { type: String },

    option: { type: String, required: true },

    receivedAt: { type: Date, required: true },
    /** Measured from the round's own `openedAt`. Ties break on this. */
    elapsedMs: { type: Number, required: true },

    /**
     * Graded on write, but withheld from every participant-facing payload until
     * the host reveals. Returning it at submit would let the first person to
     * answer tell the room whether they were right.
     */
    isCorrect: { type: Boolean, default: false },
    pointsAwarded: { type: Number, default: 0 },
}, {
    collection: 'live_answers',
    timestamps: true,
});

// One answer per person per opening.
LiveAnswerSchema.index(
    { instanceId: 1, participantId: 1 },
    { unique: true, name: 'uniq_live_answer_participant' },
);

// Team scope: the first teammate to answer answers for the team. Partial, so
// the constraint simply does not exist for solo rounds.
LiveAnswerSchema.index(
    { instanceId: 1, teamKey: 1 },
    {
        unique: true,
        name: 'uniq_live_answer_team',
        partialFilterExpression: { teamKey: { $exists: true } },
    },
);

// The leaderboard aggregation's match stage.
LiveAnswerSchema.index({ activityId: 1, teamKey: 1 });

export default mongoose.models.LiveAnswer || mongoose.model('LiveAnswer', LiveAnswerSchema);

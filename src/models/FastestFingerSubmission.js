import mongoose from 'mongoose';

/**
 * A fastest-finger answer.
 *
 * `elapsedMs` is computed on the server from the activity's own
 * `fastestFinger.openedAt` and the moment the request lands. The client never
 * sends a duration — a browser claiming 0.001s would otherwise win every round,
 * and there is no way to tell that apart from a genuinely fast answer.
 *
 * The unique index is the real guard against a second attempt, for the same
 * reason the registration seat index is: a UI that disables a button is not a
 * constraint, and two requests in flight together both pass any read-then-write
 * check.
 */
const FastestFingerSubmissionSchema = new mongoose.Schema({
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventActivity', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    /** Which qualification question — a round may run several. */
    questionIndex: { type: Number, required: true },

    participantId: { type: String, required: true, index: true },
    name: { type: String },
    teamName: { type: String },

    /** Ordering answer, e.g. ['C','B','A','D']. */
    answer: [{ type: String }],

    receivedAt: { type: Date, required: true },
    elapsedMs: { type: Number, required: true },

    /** Graded server-side on submit, but withheld from clients until reveal. */
    correct: { type: Boolean, default: false },
}, {
    collection: 'fastest_finger_submissions',
    timestamps: true,
});

// One attempt per participant per question. No second guess.
FastestFingerSubmissionSchema.index(
    { activityId: 1, questionIndex: 1, participantId: 1 },
    { unique: true, name: 'uniq_ff_attempt' },
);

// The ranking query: correct answers first, then fastest.
FastestFingerSubmissionSchema.index({ activityId: 1, questionIndex: 1, correct: -1, elapsedMs: 1 });

export default mongoose.models.FastestFingerSubmission
    || mongoose.model('FastestFingerSubmission', FastestFingerSubmissionSchema);

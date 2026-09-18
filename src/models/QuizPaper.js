import mongoose from 'mongoose';

/**
 * One entrant's dealt paper: which questions, in which order, with which
 * option order, and what they have answered so far.
 *
 * It exists because a generated paper has to be *the same paper* every time it
 * is opened. Regenerating on each request would let a team reload until the
 * questions looked easier, and would make "what was team 7 actually asked?"
 * unanswerable after the fact.
 *
 * Answers are saved as they are chosen rather than only on submit. A thirty
 * minute round ends on its own deadline, and a team whose laptop dies at minute
 * 28 should keep the 22 answers they had made, not lose the round.
 */

const PaperItemSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    /** Decided when the paper is dealt, so a later config edit cannot change what a sat paper was worth. */
    points: { type: Number, required: true },
    /** A permutation of option indexes: the order this entrant sees them in. */
    optionOrder: [{ type: Number }],
}, { _id: false });

const QuizPaperSchema = new mongoose.Schema({
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventActivity', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },

    /**
     * Who sits this paper: a `teamId` in team scope, an email otherwise. One
     * key, one paper — every member of a team opens the same one and shares its
     * answers, because the team sits one exam.
     */
    ownerKey: { type: String, required: true },
    scope: { type: String, enum: ['individual', 'team'], default: 'individual' },
    teamId: { type: String, default: null },
    teamName: { type: String, default: null },
    /** Whoever opened it first. Attribution only; the paper belongs to `ownerKey`. */
    issuedTo: { type: String },

    items: [PaperItemSchema],

    /**
     * Power stage. Set when the regular paper is submitted before the cutoff:
     * the regular answers lock, `powerItems` are dealt, and the paper stays open
     * for them until the same `endsAt`.
     */
    regularSubmittedAt: { type: Date, default: null },
    powerItems: [PaperItemSchema],
    regularScore: { type: Number, default: 0 },
    powerScore: { type: Number, default: 0 },

    /** The clock starts when the paper is first opened, not when the round does. */
    startedAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    durationSeconds: { type: Number, required: true },

    /** questionId -> the option text chosen. Ids are hex, so they are safe map keys. */
    answers: { type: Map, of: String, default: () => new Map() },

    submittedAt: { type: Date, default: null },
    score: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    totalPossible: { type: Number, default: 0 },
}, {
    collection: 'quiz_papers',
    timestamps: true,
});

// One paper per entrant per activity. This is what makes issuing idempotent:
// two devices opening at once race for a single insert and one of them loses.
QuizPaperSchema.index({ activityId: 1, ownerKey: 1 }, { unique: true, name: 'uniq_paper_owner' });

export default mongoose.models.QuizPaper || mongoose.model('QuizPaper', QuizPaperSchema);

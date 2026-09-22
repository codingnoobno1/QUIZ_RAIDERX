import mongoose from 'mongoose';

/**
 * One press of the BUZZ button, and collectively the buzz queue.
 *
 * Modelled on LiveAnswer and FastestFingerSubmission, for the same reasons:
 * the client sends nothing that could decide the outcome, `receivedAt` is
 * stamped on the server, and a unique index — not a disabled button — is what
 * stops a team pressing twice.
 *
 * Every press is kept, not just the winning one. The ones behind the winner
 * are the queue the host walks with PASS when an answer is wrong, and the
 * offsets between them are what tells the host whether two presses were
 * effectively a tie.
 *
 * `offsetMs` is measured from `armsAt`, the instant the button went live on
 * every phone at once — so it is comparable between teams in a way that a
 * measurement from anybody's own clock would not be. A false start has a
 * negative offset.
 */
const BuzzPressSchema = new mongoose.Schema({
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventActivity', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },

    /** The specific staging of a question. New on every STAGE_QUESTION. */
    instanceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    questionIndex: { type: Number, required: true },

    teamId: { type: String, required: true },
    teamName: { type: String, default: null },
    /**
     * Mirrors `teamId`, and exists so the unique index below can be partial on
     * its presence — the same shape as LiveAnswer's team index. Electric
     * Answers is team-only in v1, so in practice it is always written.
     */
    teamKey: { type: String },

    /** Taken from the verified session, never from the request body. */
    participantId: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, default: null },

    receivedAt: { type: Date, required: true },
    /** `receivedAt − armsAt`. Negative on a false start. */
    offsetMs: { type: Number, required: true },
    falseStart: { type: Boolean, default: false },
}, {
    collection: 'buzz_presses',
    timestamps: true,
});

// One press per team per staging. The second one is a 409, not a second seat.
BuzzPressSchema.index(
    { instanceId: 1, teamKey: 1 },
    { unique: true, name: 'uniq_buzz_press_team', partialFilterExpression: { teamKey: { $exists: true } } },
);

// The queue, in the order the presses arrived.
BuzzPressSchema.index({ instanceId: 1, receivedAt: 1 }, { name: 'buzz_press_queue' });

export default mongoose.models.BuzzPress || mongoose.model('BuzzPress', BuzzPressSchema);

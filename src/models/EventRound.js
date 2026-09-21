import mongoose from 'mongoose';

/**
 * EventRound — who is still in, round by round.
 *
 * The engine can already rank a quiz and cut the top N from it
 * (`quiz.advancement`), but that only works for a round it ran. Round 1 of
 * QuizQuest is sat on paper, in a hall, and marked by hand: nothing about who
 * survived it exists in any collection. Thirty teams register, ten go out, and
 * the twenty that remain are a fact only the organiser holds.
 *
 * So this is the hand-maintained list. A round here is not an activity and does
 * not run anything — it is the roster the organiser curates and publishes, and
 * the lobby reads. Where a computed cut does exist, confirm it on the activity
 * and then copy it in (`copyFromRoundId`, or add the teams); the two are
 * deliberately not wired together, because a roster that silently followed a
 * re-grade would change who is in the room after the room already knows.
 *
 * `teams[].teamName` is a snapshot. Names are refreshed from the registration
 * on read when it still exists, so a rename shows — but a withdrawn team leaves
 * the published list intact rather than putting a hole in it.
 */

const RoundTeamSchema = new mongoose.Schema({
    /** The registration's own `teamId` — the same value the round engine resolves a participant to. */
    teamId: { type: String, required: true },
    teamName: { type: String, required: true },
    /** Why this team is on the list: "3rd on paper", "walkover", "replaced Team 7". */
    note: { type: String, trim: true },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: String },
}, { _id: false });

/**
 * Every change to a published roster, kept. Removing a team from a round is
 * telling six people they are out of the competition; it should never be a
 * thing that happened with nobody's name on it.
 */
const RoundAuditSchema = new mongoose.Schema({
    at: { type: Date, default: Date.now },
    by: { type: String },
    action: { type: String, required: true },
    teamIds: [{ type: String }],
    detail: { type: String },
}, { _id: false });

const EventRoundSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true,
    },

    /** 1, 2, 3… Unique within the event, and what the lobby orders by. */
    roundNumber: { type: Number, required: true, min: 1 },

    title: { type: String, required: true, trim: true },

    /**
     * How the round is sat. `paper` is the case this model exists for — a round
     * the platform does not run and therefore cannot score.
     */
    format: {
        type: String,
        enum: ['paper', 'live', 'online', 'other'],
        default: 'other',
    },

    /**
     * `draft` is the organiser's working copy: eliminations are decided in a
     * back room while the hall is still full, and the list must not appear on
     * thirty phones one team at a time as it is edited. Nothing leaves the
     * console until it is published.
     */
    status: {
        type: String,
        enum: ['draft', 'published', 'completed'],
        default: 'draft',
        index: true,
    },

    teams: [RoundTeamSchema],

    publishedAt: { type: Date, default: null },
    updatedBy: { type: String },
    audit: [RoundAuditSchema],

}, {
    collection: 'event_rounds',
    timestamps: true,
});

// One Round 2 per event. Without this, a double-submit in the console leaves
// two rosters with the same number and the lobby picks whichever sorts first.
EventRoundSchema.index({ eventId: 1, roundNumber: 1 }, { unique: true });

export default mongoose.models.EventRound || mongoose.model('EventRound', EventRoundSchema);

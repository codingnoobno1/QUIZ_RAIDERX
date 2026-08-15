import mongoose from 'mongoose';

const EventRegistrationSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    registrationType: {
        type: String,
        enum: ['solo', 'team'],
        required: true,
        default: 'solo'
    },
    teamName: {
        type: String,
        trim: true
    },
    teamId: {
        type: String,
        unique: true,
        sparse: true // Only unique among those that have it
    },
    // The person who registers the entry
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    enrollmentNumber: {
        type: String
    },
    semester: {
        type: String
    },
    // Additional members for team registration (up to 5 others, total 6)
    members: [{
        name: String,
        email: String,
        enrollmentNumber: String,
        semester: String,
        inviteStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
    }],
    status: {
        type: String,
        enum: ['pending', 'attended', 'cancelled'],
        default: 'pending'
    },
    // Entry and Exit Tracking
    entryTime: { type: Date },
    exitTime: { type: Date },
    entryCount: { type: Number, default: 0 },
    exitCount: { type: Number, default: 0 },

    // Pass and Mode Logic
    passGenerated: { type: Boolean, default: false },
    passUrl: { type: String },
    modeProgress: [{
        mode: String,
        status: String,
        score: Number,
        data: mongoose.Schema.Types.Mixed
    }],

    /**
     * Every person who currently holds a seat in this registration: the leader,
     * plus each member who has ACCEPTED their invite. Maintained by the register
     * and invitation routes, and covered by the unique index below.
     *
     * Pending and declined invitees are absent by design — see the index note.
     */
    participantEmails: {
        type: [String],
        default: undefined,
        index: true
    }
}, {
    timestamps: true
});

// ── Seat claims ──────────────────────────────────────────────────────────────
//
// A registration row can hold several people, so "one person, one registration
// per event" cannot be expressed as a unique index on `email`. It can be
// expressed on an array.
//
// Mongo indexes each element of an array separately (a multikey index), and a
// UNIQUE multikey index rejects a write when any element collides with an
// element of another document sharing the same eventId. One constraint therefore
// covers the leader and every accepted member at once, and it is enforced by the
// database rather than by a read-then-write check that two concurrent requests
// can both pass.
//
// Pending and declined invitees are deliberately NOT claimed. Holding a seat on
// an invitation nobody accepted would lock that person out of registering
// themselves — the exact trap this replaces.
EventRegistrationSchema.index(
    { eventId: 1, participantEmails: 1 },
    { unique: true, name: 'uniq_event_participant' },
);

// Lookup paths. The registration route used to load every registration for an
// event and loop over it in JS — a full collection scan on every signup, growing
// with the guest list.
EventRegistrationSchema.index({ eventId: 1, email: 1 });
EventRegistrationSchema.index({ eventId: 1, 'members.email': 1 });
EventRegistrationSchema.index({ email: 1 });

// Index builds belong to the migration script (scripts/registration-seats.mjs),
// not to whichever web request happens to connect first. An automatic build
// against a collection that already holds duplicates fails in the background and
// leaves the constraint missing while the app assumes it is enforced.
EventRegistrationSchema.set('autoIndex', false);

// Prevent model recompilation error
if (process.env.NODE_ENV !== 'production') delete mongoose.models.EventRegistration;

export default mongoose.models.EventRegistration || mongoose.model('EventRegistration', EventRegistrationSchema);

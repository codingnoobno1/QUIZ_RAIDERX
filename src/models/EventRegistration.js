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
    }]
}, {
    timestamps: true
});

// The registration route used to load every registration for an event and loop
// over it in JS to find a duplicate email — a full collection scan on each
// signup, and it grew with the guest list. These make that one indexed lookup.
//
// Not unique on purpose: a unique (eventId, email) index is the only thing that
// closes the double-submit race for good, but it cannot be built on a
// collection that already holds duplicates. Dedupe first, then tighten it.
EventRegistrationSchema.index({ eventId: 1, email: 1 });
EventRegistrationSchema.index({ eventId: 1, 'members.email': 1 });
EventRegistrationSchema.index({ email: 1 });

// Prevent model recompilation error
if (process.env.NODE_ENV !== 'production') delete mongoose.models.EventRegistration;

export default mongoose.models.EventRegistration || mongoose.model('EventRegistration', EventRegistrationSchema);

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
    exitCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Prevent model recompilation error
if (process.env.NODE_ENV !== 'production') delete mongoose.models.EventRegistration;

export default mongoose.models.EventRegistration || mongoose.model('EventRegistration', EventRegistrationSchema);

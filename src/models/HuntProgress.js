import mongoose from 'mongoose';

const HuntProgressSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    participantId: { type: String, required: true, index: true }, // enrollmentNumber or email
    teamId: { type: String, index: true },
    checkpointsReached: [{
        checkpointId: { type: String, required: true },
        discoveredAt: { type: Date, default: Date.now },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        pointsAwarded: { type: Number, default: 0 }
    }],
    totalScore: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'finished'], default: 'active' }
}, {
    collection: 'hunt_progress', // same collection as stud_admin
    timestamps: true
});

// Compound index — one progress doc per participant per event
HuntProgressSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

export default mongoose.models.HuntProgress || mongoose.model('HuntProgress', HuntProgressSchema);

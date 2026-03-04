import mongoose from 'mongoose';

const EventVoteSchema = new mongoose.Schema({
    participantId: { type: String, required: true, index: true },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventActivity', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    option: { type: String, required: true },
    votedAt: { type: Date, default: Date.now }
}, {
    collection: 'event_votes',
    timestamps: true
});

EventVoteSchema.index({ participantId: 1, activityId: 1 }, { unique: true });

export default mongoose.models.EventVote || mongoose.model('EventVote', EventVoteSchema);

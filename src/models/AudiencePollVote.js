import mongoose from 'mongoose';

/**
 * An audience vote on a hot-seat question.
 *
 * Deliberately NOT EventVote. That model is unique on
 * (participantId, activityId), which permits exactly one poll for the whole
 * activity — a KBC round runs one poll per question, so reusing it would make
 * the second lifeline silently impossible to cast.
 */
const AudiencePollVoteSchema = new mongoose.Schema({
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventActivity', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    /** The hot-seat question this poll is helping with. */
    questionIndex: { type: Number, required: true },

    participantId: { type: String, required: true },
    option: { type: String, required: true },
    votedAt: { type: Date, default: Date.now },
}, {
    collection: 'audience_poll_votes',
    timestamps: true,
});

// One vote per person per question.
AudiencePollVoteSchema.index(
    { activityId: 1, questionIndex: 1, participantId: 1 },
    { unique: true, name: 'uniq_poll_vote' },
);

export default mongoose.models.AudiencePollVote
    || mongoose.model('AudiencePollVote', AudiencePollVoteSchema);

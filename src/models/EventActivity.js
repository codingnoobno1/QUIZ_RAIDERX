import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    points: { type: Number, default: 10 },
    imageUrl: { type: String }
}, { _id: true });

const CheckpointSchema = new mongoose.Schema({
    checkpointId: { type: String, required: true },
    hint: { type: String, required: true },
    location: { type: String },
    challengeType: {
        type: String,
        enum: ['quiz', 'hint-only', 'external-game'],
        default: 'hint-only'
    },
    quizRef: { type: mongoose.Schema.Types.ObjectId, ref: 'EventActivity' },
    externalUrl: { type: String },
    points: { type: Number, default: 100 },
    order: { type: Number, required: true }
}, { _id: true });

const EventActivitySchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
        type: String,
        enum: ['quiz', 'voting', 'hunt', 'external', 'announcement'],
        required: true, index: true
    },
    status: {
        type: String,
        enum: ['inactive', 'active', 'completed'],
        default: 'inactive', index: true
    },
    quiz: {
        quizType: { type: String, enum: ['rapid_fire', 'custom_live', 'preloaded'], default: 'rapid_fire' },
        questions: [QuestionSchema],
        timePerQuestion: { type: Number, default: 10 },
        scoring: { type: String, enum: ['correct_only', 'speed_bonus', 'partial'], default: 'correct_only' },
        shuffle: { type: Boolean, default: true },
        autoAdvance: { type: Boolean, default: true },
        maxParticipants: { type: Number, default: 500 },
        currentQuestion: { type: Number, default: 0 }
    },
    voting: {
        question: { type: String },
        options: [{ type: String }],
        allowMultiple: { type: Boolean, default: false },
        showLiveResults: { type: Boolean, default: true },
        votingDurationSeconds: { type: Number, default: 60 }
    },
    hunt: {
        checkpoints: [CheckpointSchema],
        ordered: { type: Boolean, default: true }
    },
    external: {
        url: { type: String },
        points: { type: Number, default: 200 },
        durationMinutes: { type: Number, default: 20 },
        secretKey: { type: String }
    },
    announcement: {
        message: { type: String },
        displaySeconds: { type: Number, default: 15 }
    },
    activatedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    order: { type: Number, default: 0 }
}, {
    collection: 'event_activities',
    timestamps: true
});

export default mongoose.models.EventActivity || mongoose.model('EventActivity', EventActivitySchema);

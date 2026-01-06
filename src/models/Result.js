import mongoose from 'mongoose';

const ResultSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    studentId: {
        type: String  // Changed from ObjectId to String to support student names
        // Will store student name until proper authentication is implemented
    },
    status: {
        type: String,
        enum: ['in-progress', 'completed'],
        default: 'in-progress'
    },
    score: {
        type: Number,
        default: 0
    },
    maxScore: {
        type: Number,
        default: 0
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Question'
        },
        userAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        points: { type: Number, default: 0 },
        timeTaken: Number
    }]
}, {
    timestamps: true
});

// Prevent model recompilation error
if (process.env.NODE_ENV !== 'production') delete mongoose.models.Result;

export default mongoose.models.Result || mongoose.model('Result', ResultSchema);

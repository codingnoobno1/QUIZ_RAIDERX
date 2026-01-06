// models/Question.js
import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: [
            'mcq',
            'fillup',
            'truefalse',
            'shortanswer',
            'longanswer',
            'ordering',
            'matchup',
            'diagram',
            'assertionreason',
            'comprehension',
            'simplecode',
            'blockcode',
            'testcasecode',
            'findoutput'
        ],
        required: true
    },

    // MCQ specific
    options: [String],

    // Generic answer field (supports string, boolean, array, etc.)
    correctAnswer: mongoose.Schema.Types.Mixed,

    // Matchup specific
    pairs: [{
        left: String,
        right: String
    }],

    // Ordering specific
    order: [String],

    // Comprehension specific
    passages: String,
    subQuestions: [String],

    // Coding specific
    codeTemplate: String,
    testCases: [{
        input: String,
        output: String
    }],

    // Common metadata
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },

    points: {
        type: Number,
        default: 1
    },

    timeLimit: Number, // in seconds

    // References
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for performance
QuestionSchema.index({ type: 1, subjectId: 1 });
QuestionSchema.index({ createdBy: 1 });

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);

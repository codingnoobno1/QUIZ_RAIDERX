// models/Section.js
import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    course: {
        type: String,
        required: true,
        trim: true
    },

    batch: {
        type: String,
        required: true
    },

    semester: {
        type: String,
        required: true
    },

    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },

    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    faculty: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Indexes
SectionSchema.index({ batch: 1, semester: 1, course: 1 });
SectionSchema.index({ subjectId: 1 });

export default mongoose.models.Section || mongoose.model('Section', SectionSchema);

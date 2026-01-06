import mongoose from 'mongoose';

const ResearchRequestSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: true,
        trim: true
    },

    studentEmail: {
        type: String,
        trim: true
    },

    studentEnrollment: {
        type: String,
        trim: true
    },

    facultyName: {
        type: String,
        required: true,
        trim: true
    },

    researchArea: {
        type: String,
        required: true,
        enum: ['AI/ML', 'Blockchain', 'IoT', 'Cybersecurity', 'Web Development', 'Mobile Development', 'Data Science', 'Other']
    },

    proposedTopic: {
        type: String,
        trim: true
    },

    motivation: {
        type: String,
        required: true
    },

    skills: [{
        type: String,
        trim: true
    }],

    previousWork: {
        type: String,
        trim: true
    },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    adminNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Indexes
ResearchRequestSchema.index({ status: 1 });
ResearchRequestSchema.index({ facultyName: 1 });
ResearchRequestSchema.index({ studentName: 1 });

// Prevent model recompilation
if (process.env.NODE_ENV !== 'production') delete mongoose.models.ResearchRequest;

export default mongoose.models.ResearchRequest || mongoose.model('ResearchRequest', ResearchRequestSchema);

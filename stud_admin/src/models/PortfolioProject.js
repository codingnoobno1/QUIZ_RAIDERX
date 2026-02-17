import mongoose from 'mongoose';

const PortfolioProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    tags: [{
        type: String,
        trim: true
    }],

    category: {
        type: String,
        enum: ['Web App', 'Mobile App', 'AI/ML', 'Blockchain', 'IoT', 'Game Dev', 'Other'],
        default: 'Other'
    },

    imageUrl: {
        type: String,
        default: null
    },

    githubUrl: {
        type: String,
        default: null
    },

    liveUrl: {
        type: String,
        default: null
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    authorName: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
PortfolioProjectSchema.index({ category: 1, status: 1 });
PortfolioProjectSchema.index({ authorName: 1 });
PortfolioProjectSchema.index({ featured: 1 });

// Prevent model recompilation
if (process.env.NODE_ENV !== 'production') delete mongoose.models.PortfolioProject;

export default mongoose.models.PortfolioProject || mongoose.model('PortfolioProject', PortfolioProjectSchema);

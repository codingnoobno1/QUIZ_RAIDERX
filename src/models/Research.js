import mongoose from 'mongoose';

const ResearchSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    abstract: {
        type: String,
        required: true
    },

    authors: [{
        type: String,
        trim: true
    }],

    publicationType: {
        type: String,
        enum: ['Journal', 'Conference', 'Preprint', 'Workshop', 'Book Chapter'],
        required: true
    },

    publisher: {
        type: String,
        trim: true
    },

    publishedDate: {
        type: Date
    },

    doi: {
        type: String,
        default: null
    },

    pdfUrl: {
        type: String,
        default: null
    },

    keywords: [{
        type: String,
        trim: true
    }],

    coAuthors: [{
        type: String,
        trim: true
    }],

    conference: {
        type: String,
        trim: true,
        default: null
    },

    journal: {
        type: String,
        trim: true,
        default: null
    },

    references: [{
        type: String,
        trim: true
    }],

    patent: {
        type: String,
        trim: true,
        default: null
    },

    citationCount: {
        type: Number,
        default: 0
    },

    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    submitterName: {
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
ResearchSchema.index({ publicationType: 1, status: 1 });
ResearchSchema.index({ submitterName: 1 });
ResearchSchema.index({ featured: 1 });
ResearchSchema.index({ publishedDate: -1 });

// Prevent model recompilation
if (process.env.NODE_ENV !== 'production') delete mongoose.models.Research;

export default mongoose.models.Research || mongoose.model('Research', ResearchSchema);

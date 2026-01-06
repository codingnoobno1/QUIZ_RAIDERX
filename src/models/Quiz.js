// models/Quiz.js
import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },

  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },

  batch: {
    type: String,
    required: true
  },

  semester: {
    type: String,
    required: true
  },

  timeLimit: {
    type: Number,
    required: true,
    min: 1
  }, // in minutes

  maxMarks: Number,

  startTime: Date,
  endTime: Date,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty', // Updated to match QUIZ_RAIDERX generic ref logic if needed, but safer to match Admin
    required: true
  },

  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },

  // Quiz availability status
  availabilityStatus: {
    type: String,
    enum: ['off', 'on', 'scheduled'],
    default: 'off'
  },

  // For scheduled auto-enable
  scheduledStartTime: {
    type: Date,
    default: null
  },

  scheduledEndTime: {
    type: Date,
    default: null
  },

  // Track students who have submitted this quiz
  submittedBy: [String]  // Changed to String array to store student names
}, {
  timestamps: true
});

// Virtual field to check if quiz is currently active
QuizSchema.virtual('isActive').get(function () {
  if (this.availabilityStatus === 'on') return true;
  if (this.availabilityStatus === 'off') return false;
  if (this.availabilityStatus === 'scheduled') {
    const now = new Date();
    const started = !this.scheduledStartTime || now >= this.scheduledStartTime;
    const notEnded = !this.scheduledEndTime || now <= this.scheduledEndTime;
    return started && notEnded;
  }
  return false;
});

// Indexes for efficient querying
QuizSchema.index({ batch: 1, semester: 1, subjectId: 1 });
QuizSchema.index({ createdBy: 1 });
QuizSchema.index({ status: 1 });

// Prevent Mongoose model compilation errors during hot reloads
if (process.env.NODE_ENV !== 'production') delete mongoose.models.Quiz;

export default mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

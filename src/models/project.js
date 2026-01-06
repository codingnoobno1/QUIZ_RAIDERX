import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: String,
  enrollment: String,
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  abstract: { type: String, required: true },
  type: {
    type: String,
    enum: ['internship', 'minor', 'major'],
    required: true,
  },

  submittedBy: {
    name: { type: String, required: true },
    enrollment: { type: String, required: true },
    major: { type: String, default: '' },
  },

  members: [memberSchema], // Optional members

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },

  allowResubmit: {
    type: Boolean,
    default: false,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }, // for tracking resubmission updates
});

export default mongoose.models.Project || mongoose.model('Project', projectSchema);

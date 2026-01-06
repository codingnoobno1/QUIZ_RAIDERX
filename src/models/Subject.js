import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

import mongoose from 'mongoose';

const FacultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  subjects: {
    type: [String],
    required: true,
    validate: {
      validator: function (arr) {
        return arr.length > 0;
      },
      message: 'At least one subject required',
    },
  },
}, {
  timestamps: true,
});

export default mongoose.models.Faculty || mongoose.model('Faculty', FacultySchema);

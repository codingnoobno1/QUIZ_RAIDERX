// src/models/facultycard.js
import mongoose, { Schema } from 'mongoose';

const FacultyCardSchema = new Schema(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    classAssignments: [
      {
        batch: String,
        semester: Number,
        section: String,
        roomNumber: String,
        subjects: [String],
      },
    ],
    quizzes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'QuizTemplate',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const FacultyCard =
  mongoose.models.FacultyCard || mongoose.model('FacultyCard', FacultyCardSchema);

export default FacultyCard;
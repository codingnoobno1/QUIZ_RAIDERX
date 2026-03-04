import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  imageUrl: { type: String },
  tags: [{ type: String }],
  onDuty: { type: Boolean, default: false },
  modes: [{
    type: { type: String, enum: ['quiz', 'voting', 'treasure-hunt', 'custom'] },
    config: { type: mongoose.Schema.Types.Mixed }
  }],
  activeMode: {
    type: { type: String },
    startedAt: { type: Date }
  },
  modeHistory: [{
    mode: String,
    startedAt: Date,
    endedAt: Date,
    changedBy: String
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Event || mongoose.model('Event', eventSchema);

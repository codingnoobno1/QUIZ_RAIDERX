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
    config: { type: mongoose.Schema.Types.Mixed } // Stores specific settings like rapid-fire vs long-thinking
  }],
  activeMode: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Event || mongoose.model('Event', eventSchema);

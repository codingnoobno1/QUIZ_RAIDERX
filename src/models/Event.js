import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  imageUrl: { type: String },
  tags: [{ type: String }],

  // ── Event page content ───────────────────────────────────────────────────
  // All optional. The detail page renders a section only when its field is
  // filled, so an event with nothing here looks deliberate rather than broken,
  // and an organiser who fills them gets a fuller page with no code change.
  organizer: {
    name: { type: String },
    subtitle: { type: String },   // e.g. "Amity School of Engineering"
    logoUrl: { type: String },
    contact: { type: String },
  },
  /** "Open to Amity students", "Valid student ID required" */
  eligibility: [{ type: String }],
  rules: [{ type: String }],
  prizes: [{
    place: { type: String },      // "Winner", "Runner up"
    reward: { type: String },
  }],
  /** Published running order. Distinct from modeHistory, which is what happened. */
  schedule: [{
    time: { type: String },       // "02:30 PM"
    label: { type: String },      // "Check-in opens"
  }],
  faq: [{
    question: { type: String },
    answer: { type: String },
  }],
  /** After this, the register button closes. Null means open until the event. */
  registrationClosesAt: { type: Date },
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

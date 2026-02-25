import mongoose from 'mongoose';

const EventRegistrationSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    enrollmentNumber: {
        type: String
    }
}, {
    timestamps: true
});

// Prevent model recompilation error
if (process.env.NODE_ENV !== 'production') delete mongoose.models.EventRegistration;

export default mongoose.models.EventRegistration || mongoose.model('EventRegistration', EventRegistrationSchema);

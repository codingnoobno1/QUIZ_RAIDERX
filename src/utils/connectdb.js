// src/utils/connectDb.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      // If already connected, use the existing connection
      return;
    }

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixelclub';

    // Warn if falling back to localhost in production (optional)
    if (!process.env.MONGODB_URI) {
      console.warn('Warning: MONGODB_URI not defined, using localhost fallback.');
    }

    await mongoose.connect(uri);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;

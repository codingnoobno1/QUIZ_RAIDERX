// src/utils/connectDb.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      // Use existing connection if already established
      return;
    }

    const uri = 'mongodb://localhost:27017/pixelclub'; // Direct string used

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;

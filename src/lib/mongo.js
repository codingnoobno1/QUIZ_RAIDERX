// lib/mongo.js
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable");
}

let isConnected = false;

export async function connectDB() {
  if (isConnected || mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "QUIZ", // ✅ Shared database for both admin and QUIZ_RAIDERX
    });

    isConnected = true;
    console.log("✅ MongoDB connected to QUIZ database");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

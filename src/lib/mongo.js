// lib/mongo.js
import mongoose from "mongoose";
import dns from "dns";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const DB_NAME = process.env.MONGO_DB_NAME || "QUIZ";

if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI or MONGODB_URI environment variable");
}

/**
 * Prefer reliable public DNS for SRV/TXT lookups.
 *
 * `mongodb+srv://` requires a DNS SRV lookup. On machines where a local DNS
 * proxy (e.g. Cloudflare WARP at 127.0.2.x) is intermittently unavailable,
 * that lookup is refused -> `querySrv ECONNREFUSED`. We prepend public
 * resolvers so the query goes straight to them, and keep the existing
 * resolvers as fallback in case public DNS is blocked on this network.
 */
try {
  const preferred = ["1.1.1.1", "1.0.0.1", "8.8.8.8"];
  const existing = dns.getServers().filter((s) => !preferred.includes(s));
  dns.setServers([...preferred, ...existing]);
} catch {
  // Non-fatal: fall back to whatever the runtime provides.
}

// Cache across dev HMR reloads and serverless invocations.
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { promise: null };
}

const options = {
  dbName: DB_NAME,
  bufferCommands: false, // fail fast instead of buffering queries for 10s
  serverSelectionTimeoutMS: 8000, // give SRV + server selection some room, then error
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
};

export async function connectDB() {
  // Already connected — reuse it.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // No in-flight attempt — start one (concurrent callers share this promise).
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, options)
      .then((m) => {
        console.log(`✅ MongoDB connected to "${DB_NAME}"`);
        return m;
      })
      .catch((err) => {
        // Clear the cache so the NEXT request retries once DNS/network recovers.
        cached.promise = null;
        console.error("❌ MongoDB connection error:", err.message);
        throw err;
      });
  }

  await cached.promise;
  return mongoose.connection;
}

import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Since we cannot easily import the model file if it has other dependencies or is outside module structure,
// I will replicate the schema EXACTLY as it is in src/models/base_user.js to verify if Mongoose setup matches.
// Actually, let's try to import it if possible. Node 16+ supports importing local files.
// But `src` might resolve differently.
// To be safe and test the DATA, I will use a schema that includes 'role'.

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not defined");
    process.exit(1);
}

const BaseUserSchema = new mongoose.Schema(
    {
        name: String,
        email: String,
        role: {
            type: String,
            default: "user",
            enum: ["user", "student", "admin"],
        },
    },
    { strict: true } // Enforce strict mode to simulate Model behavior
);

const User = mongoose.models.BaseUser || mongoose.model("BaseUser", BaseUserSchema);

async function checkUserRole() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to DB");

        const email = 'admin@test.com'; // The user we are testing
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User ${email} not found.`);
        } else {
            console.log(`✅ User found: ${user.email}`);
            console.log(`🔹 Role: '${user.role}'`);
            console.log(`🔹 ID: ${user._id}`);

            if (user.role === 'admin') {
                console.log("✅ Role is 'admin'. Login should work if password matches.");
            } else {
                console.log(`⚠️ Role is '${user.role}', NOT 'admin'. This might be the issue.`);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

checkUserRole();

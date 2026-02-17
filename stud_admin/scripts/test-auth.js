const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in .env.local");
    process.exit(1);
}

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: { type: String, required: false }, // Relaxed for testing
    role: String,
}, { strict: false }); // Strict false to see all fields

const User = mongoose.model('BaseUser', userSchema, 'baseusers'); // Explicit collection name if needed, usually passed as 3rd arg or pluralized

async function testAuth() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'studentadmins' });
        console.log("✅ Connected to DB 'studentadmins'");

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log(`Checking user: ${user.email} (${user._id})`);
            if (!user.password) {
                console.error(`❌ User ${user.email} HAS NO PASSWORD! This will cause the login error.`);
            } else {
                console.log(`✅ User ${user.email} has a password hash.`);
            }
        }

        // Create a test admin user if none exist
        if (users.length === 0) {
            console.log("Creating test admin user...");
            const hashedPassword = await bcrypt.hash('testpassword', 10);
            const newAdmin = new User({
                name: 'Test Admin',
                email: 'admin@test.com',
                password: hashedPassword,
                enrollmentNumber: `ADMIN-${Date.now()}`,
                course: 'B.Tech',
                semester: '1',
                role: 'admin'
            });
            await newAdmin.save();
            console.log("✅ Created test admin: admin@test.com / testpassword");
        }

        // Test login simulation
        const testEmail = 'admin@test.com';
        const testPassword = 'testpassword';

        const user = await User.findOne({ email: testEmail });
        if (user) {
            console.log(`Testing login for ${testEmail}...`);
            if (user.password) {
                const isMatch = await bcrypt.compare(testPassword, user.password);
                if (isMatch) {
                    console.log("✅ Login simulation SUCCESS");
                } else {
                    console.error("❌ Login simulation FAILED: Password mismatch");
                }
            } else {
                console.log("⚠️ User has no password (should be handled by app now)");
            }
        } else {
            console.log("⚠️ Test user not found for login test");
        }

        // Disconnect
        await mongoose.disconnect();
        console.log("✅ Disconnected");

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

testAuth();

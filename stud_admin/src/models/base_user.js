import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs"; // Import bcryptjs

const BaseUserSchema = new mongoose.Schema(
    {
        uuid: {
            type: String,
            default: uuidv4,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        enrollmentNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        course: {
            type: String,
            required: true,
            trim: true,
        },
        semester: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            default: "user",
            enum: ["user", "student", "admin"],
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving the user document
// Hash password before saving the user document
BaseUserSchema.pre("save", async function () {
    if (!this.isModified("password")) return; // Only hash if password is modified

    try {
        const salt = await bcrypt.genSalt(10); // Generate salt
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
    } catch (err) {
        throw new Error(err); // Throw error to be caught by Mongoose
    }
});

// Method to compare passwords (useful for login)
BaseUserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.BaseUser || mongoose.model("BaseUser", BaseUserSchema);

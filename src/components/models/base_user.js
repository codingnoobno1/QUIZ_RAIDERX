// src/models/base_user.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Define the User schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    enrollmentNumber: { type: String, required: true, unique: true },
    course: { type: String, required: true },
    semester: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

// Hash the user's password before saving it to the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the model
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

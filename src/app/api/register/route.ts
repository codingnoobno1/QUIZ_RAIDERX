import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import BaseUser from '@/models/base_user';

export async function POST(req) {
  try {
    const {
      name,
      enrollmentNumber,
      course,
      semester,
      email,
      password,
      confirmPassword,
    } = await req.json();

    // --- 1. Input Validation ---
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedEnrollment = enrollmentNumber?.trim();
    const trimmedCourse = course?.trim();
    const trimmedSemester = semester?.trim();

    if (
      !trimmedName ||
      !trimmedEnrollment ||
      !trimmedCourse ||
      !trimmedSemester ||
      !trimmedEmail ||
      !password ||
      !confirmPassword
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // --- 2. Connect to MongoDB ---
    await connectDB();

    // --- 3. Check for existing user ---
    const existingUser = await BaseUser.findOne({
      $or: [{ email: trimmedEmail }, { enrollmentNumber: trimmedEnrollment }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or enrollment number already exists" },
        { status: 400 }
      );
    }

    // --- 4. Create and Save User ---
    // The BaseUser model handles UUID generation and Password Hashing via pre-save hook
    const newUser = new BaseUser({
      name: trimmedName,
      enrollmentNumber: trimmedEnrollment,
      course: trimmedCourse,
      semester: trimmedSemester,
      email: trimmedEmail,
      password: password, // Will be hashed by the model
      role: 'user', // Default role
    });

    await newUser.save();

    return NextResponse.json(
      { message: "User registered successfully." },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

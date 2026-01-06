import { connectDb, sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const pool = await connectDb();
    const {
      name,
      enrollmentNumber,
      course,
      semester,
      email,
      password,
      confirmPassword,
    } = await req.json();

    // Trim & normalize inputs
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedEnrollment = enrollmentNumber?.trim();
    const trimmedCourse = course?.trim();
    const trimmedSemester = semester?.trim();

    // Basic required fields validation
    if (
      !trimmedName ||
      !trimmedEnrollment ||
      !trimmedCourse ||
      !trimmedSemester ||
      !trimmedEmail ||
      !password ||
      !confirmPassword
    ) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400 }
      );
    }

    // Email format validation (simple regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400 }
      );
    }

    // Password length check
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400 }
      );
    }

    // Confirm password check
    if (password !== confirmPassword) {
      return new Response(
        JSON.stringify({ error: "Passwords do not match" }),
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await pool
      .request()
      .input("email", sql.VarChar, trimmedEmail)
      .query("SELECT 1 FROM Users WHERE email = @email");

    if (existingUser.recordset.length > 0) {
      return new Response(
        JSON.stringify({ error: "Email is already registered" }),
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await pool
      .request()
      .input("uuid", sql.UniqueIdentifier, crypto.randomUUID())
      .input("name", sql.NVarChar, trimmedName)
      .input("enrollmentNumber", sql.NVarChar, trimmedEnrollment)
      .input("course", sql.NVarChar, trimmedCourse)
      .input("semester", sql.NVarChar, trimmedSemester)
      .input("email", sql.NVarChar, trimmedEmail)
      .input("password", sql.NVarChar, hashedPassword)
      .input("role", sql.NVarChar, "user")
      .query(`
        INSERT INTO Users (uuid, name, enrollmentNumber, course, semester, email, password, role, createdAt, updatedAt)
        VALUES (@uuid, @name, @enrollmentNumber, @course, @semester, @email, @password, @role, GETDATE(), GETDATE())
      `);

    return new Response(
      JSON.stringify({ message: "User registered successfully" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

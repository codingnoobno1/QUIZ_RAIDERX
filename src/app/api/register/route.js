import connectDb from "@utils/connectdb";
import User from "@models/base_user";
import bcrypt from "bcryptjs"; // Use bcrypt to hash the password

export async function POST(req) {
  try {
    await connectDb();

    const { name, enrollmentNumber, course, semester, email, password, confirmPassword } = await req.json();

    // Ensure all required fields are provided
    if (!name || !enrollmentNumber || !course || !semester || !email || !password || !confirmPassword) {
      return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400 });
    }

    // Ensure password and confirmPassword match
    if (password !== confirmPassword) {
      return new Response(JSON.stringify({ error: "Passwords do not match" }), { status: 400 });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds of 10 is a good balance

    // Create a new user
    const newUser = new User({
      name,
      enrollmentNumber,
      course,
      semester,
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    return new Response(JSON.stringify({ message: "User registered successfully!" }), { status: 201 });
  } catch (error) {
    console.error("Error during registration:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

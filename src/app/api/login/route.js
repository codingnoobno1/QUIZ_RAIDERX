import connectDb from '@utils/connectdb';
import User from '@models/base_user';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: 'Email and password are required' }),
      { status: 400 }
    );
  }

  try {
    await connectDb();

    const user = await User.findOne({ email });

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401 }
      );
    }

    // Optional: Track login time (you may store this in DB or zustand/session later)
    const loginTime = new Date().toISOString();

    return new Response(
      JSON.stringify({
        message: 'Login successful',
        username: user.name,     // ✅ Fixed field
        email: user.email,
        uuid: user.uuid,         // Optional: useful for secure routing
        loginTime,               // ✅ You can store this in zustand client-side
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
}

import { connectDb, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // for sessionId generation

export async function POST(req) {
  try {
    const pool = await connectDb();

    const { email, password } = await req.json();

    // Basic validation
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Fetch user by email
    const result = await pool
      .request()
      .input('email', sql.NVarChar, trimmedEmail)
      .query(`
        SELECT uuid, name, enrollmentNumber, email, password AS hashedPassword
        FROM Users
        WHERE email = @email
      `);

    const user = result.recordset[0];

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
      });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
      });
    }

    // Session info
    const sessionId = crypto.randomUUID();
    const loginTime = Date.now();
    const expiryTime = loginTime + 15 * 60 * 1000; // 15 minutes

    // Send response with all info needed for store.js
    return new Response(
      JSON.stringify({
        sessionId,
        loginTime,
        expiryTime,
        user: {
          uuid: user.uuid,
          name: user.name,
          email: user.email,
          enrollmentNumber: user.enrollmentNumber,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

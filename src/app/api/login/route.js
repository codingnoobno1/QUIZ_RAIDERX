import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import User from '@/models/User';
import { attachEventSession, badRequest, serverError, readJson } from '@/lib/apiGuards';

/**
 * POST /api/login — event portal sign-in.
 *
 * The password check here was always sound. What was missing is that the
 * response handed back a `sessionId` generated with `crypto.randomUUID()` and
 * stored nowhere, and set no cookie — so nothing the client sent afterwards
 * could be attributed to a real user. Every downstream route had to take the
 * caller's word for who they were.
 *
 * It now also sets a signed, httpOnly session cookie. The JSON body is
 * unchanged, so the existing client keeps working exactly as before; routes
 * that need a verified identity read the cookie via `requireEventUser`.
 */
export async function POST(req) {
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;

  const { email, password } = parsed.data;

  if (!email || !password) {
    return badRequest('Email and password are required');
  }

  try {
    await connectDB();

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    // One message for "no such user" and "wrong password" — telling them apart
    // turns this endpoint into a way to enumerate who has an account.
    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const loginTime = Date.now();

    const response = NextResponse.json({
      loginTime,
      expiryTime: loginTime + 15 * 60 * 1000,
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        enrollmentNumber: user.enrollmentNumber,
        semester: user.semester,
        course: user.course,
      },
    });

    return attachEventSession(response, user);
  } catch (error) {
    return serverError(error, 'login');
  }
}

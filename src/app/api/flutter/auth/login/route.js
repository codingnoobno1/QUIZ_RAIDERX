import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { SESSION } from '@/config/constants';

export async function POST(request) {
    try {
        await connectDB();

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user and select password (in case it's excluded by default)
        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Use the model's comparePassword method
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Create JWT token
        const token = jwt.sign(
            {
                sub: user.uuid,
                id: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
                enrollmentNumber: user.enrollmentNumber,
                course: user.course,
                semester: user.semester,
            },
            process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev',
            /*
             * The same window the web session gets, from the same constant.
             *
             * Nothing renews this token: the app stores it at sign-in and sends
             * it as a bearer on every call, and a 401 makes the app clear its
             * credentials and sign the participant out. At 15 minutes that
             * happened *during* the event — a team leader who signed in before
             * the round was refused partway through it, losing the status poll
             * and the buzzer at the same moment, with no way back except
             * signing in again and finding the question gone.
             *
             * A sliding session would be better than a long one, and the note
             * on SESSION.DURATION_MS says so. Until something re-issues the
             * token on an authenticated response, the honest fix is a window
             * that outlasts a whole event sitting.
             */
            { expiresIn: Math.floor(SESSION.DURATION_MS / 1000) }
        );

        return NextResponse.json({
            token,
            user: {
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
                enrollmentNumber: user.enrollmentNumber,
                course: user.course,
                semester: user.semester,
            },
        }, { status: 200 });

    } catch (error) {
        console.error('Flutter Auth Error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

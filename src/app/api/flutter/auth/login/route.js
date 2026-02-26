import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

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
            { expiresIn: '15m' }
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

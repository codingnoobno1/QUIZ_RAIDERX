import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import BaseUser from '@/models/base_user';
import bcrypt from 'bcryptjs';

const MASTER_ADMIN_SECRET = process.env.MASTER_ADMIN_SECRET || 'supersecretadmin123'; // Fallback for dev

export async function POST(req) {
    try {
        const { name, email, password, enrollmentNumber, course, semester, adminSecret } = await req.json();

        if (adminSecret !== MASTER_ADMIN_SECRET) {
            return NextResponse.json({ error: 'Invalid Master Admin Secret' }, { status: 403 });
        }

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        const existingUser = await BaseUser.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Role is explicitly set to 'admin' because the secret was valid
        const newUser = new BaseUser({
            name,
            email,
            password, // Pre-save hook will hash this
            enrollmentNumber: enrollmentNumber || `ADMIN-${Date.now()}`,
            course,
            semester,
            role: 'admin'
        });

        await newUser.save();

        return NextResponse.json({ message: 'Admin registered successfully' }, { status: 201 });

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

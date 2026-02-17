import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL?.split('@')[1], // Fallback parsing
    api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_URL?.split(':')[1].split('//')[1],
    api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_URL?.split(':')[2].split('@')[0],
});
// Note: It's better to set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET explicitly in .env.local 
// if CLOUDINARY_URL parsing is fragile. 
// However, the CLOUDINARY_URL env var itself is often enough for the SDK if set correctly.

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === 'admin' || session?.user?.role === 'student_admin';
}

export async function POST(req) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'stud_admin_events' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        return NextResponse.json({ url: result.secure_url }, { status: 200 });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

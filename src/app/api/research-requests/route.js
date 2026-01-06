import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import ResearchRequest from '@/models/ResearchRequest';

// GET /api/research-requests - Fetch research requests (admin use)
export async function GET(request) {
    await connectDB();

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const facultyName = searchParams.get('facultyName');

        // Build query
        const query = {};
        if (status) query.status = status;
        if (facultyName) query.facultyName = facultyName;

        const requests = await ResearchRequest.find(query)
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            count: requests.length,
            requests
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching research requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch research requests', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/research-requests - Submit new research request
export async function POST(request) {
    await connectDB();

    try {
        const body = await request.json();
        const {
            studentName, studentEmail, studentEnrollment,
            facultyName, researchArea, proposedTopic,
            motivation, skills, previousWork
        } = body;

        // Validation
        if (!studentName || !facultyName || !researchArea || !motivation) {
            return NextResponse.json({
                error: 'Missing required fields: studentName, facultyName, researchArea, motivation'
            }, { status: 400 });
        }

        const newRequest = await ResearchRequest.create({
            studentName,
            studentEmail,
            studentEnrollment,
            facultyName,
            researchArea,
            proposedTopic,
            motivation,
            skills: skills || [],
            previousWork,
            status: 'pending'
        });

        return NextResponse.json({
            success: true,
            message: 'Research request submitted successfully',
            requestId: newRequest._id
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating research request:', error);
        return NextResponse.json(
            { error: 'Failed to submit research request', details: error.message },
            { status: 500 }
        );
    }
}

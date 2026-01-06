import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Research from '@/models/Research';

// GET /api/research - Fetch all approved research papers (or user's own)
export async function GET(request) {
    await connectDB();

    try {
        const { searchParams } = new URL(request.url);
        const publicationType = searchParams.get('publicationType');
        const featured = searchParams.get('featured');
        const limit = searchParams.get('limit');
        const submitterName = searchParams.get('submitterName'); // For "My Research"
        const showAll = searchParams.get('showAll'); // For admin/testing - shows all including pending

        // Build query
        const query = {};

        if (publicationType) query.publicationType = publicationType;
        if (featured) query.featured = featured === 'true';

        // Show only approved papers unless:
        // 1. Fetching own papers (submitterName provided)
        // 2. Admin/testing mode (showAll=true)
        if (!submitterName && showAll !== 'true') {
            query.status = 'approved';
        } else if (submitterName) {
            query.submitterName = submitterName;
        }
        // If showAll=true, no status filter is applied (shows all papers)

        let researchQuery = Research.find(query).sort({ publishedDate: -1 });

        if (limit) {
            researchQuery = researchQuery.limit(parseInt(limit));
        }

        const papers = await researchQuery.lean();

        return NextResponse.json({
            success: true,
            count: papers.length,
            papers
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching research papers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch research papers', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/research - Submit new research paper
export async function POST(request) {
    await connectDB();

    try {
        const body = await request.json();
        const {
            title, abstract, authors, coAuthors, publicationType, publisher,
            conference, journal, publishedDate, doi, pdfUrl, keywords,
            references, patent, submitterName
        } = body;

        // Validation
        if (!title || !abstract || !publicationType || !submitterName) {
            return NextResponse.json({
                error: 'Missing required fields: title, abstract, publicationType, submitterName'
            }, { status: 400 });
        }

        const newPaper = await Research.create({
            title,
            abstract,
            authors: authors || [],
            coAuthors: coAuthors || [],
            publicationType,
            publisher,
            conference,
            journal,
            publishedDate: publishedDate ? new Date(publishedDate) : new Date(),
            doi,
            pdfUrl,
            keywords: keywords || [],
            references: references || [],
            patent,
            citationCount: 0,
            submitterName,
            status: 'pending',
            featured: false
        });

        return NextResponse.json({
            success: true,
            message: 'Research paper submitted for review',
            paper: newPaper
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating research paper:', error);
        return NextResponse.json(
            { error: 'Failed to create research paper', details: error.message },
            { status: 500 }
        );
    }
}

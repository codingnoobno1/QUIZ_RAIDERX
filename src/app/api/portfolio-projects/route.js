import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import PortfolioProject from '@/models/PortfolioProject';

// GET /api/portfolio-projects - Fetch all approved projects (or user's own)
export async function GET(request) {
    await connectDB();

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const featured = searchParams.get('featured');
        const limit = searchParams.get('limit');
        const authorName = searchParams.get('authorName'); // For "My Projects"

        // Build query
        const query = {};

        if (category) query.category = category;
        if (featured) query.featured = featured === 'true';

        // Show only approved projects unless fetching own projects
        if (!authorName) {
            query.status = 'approved';
        } else {
            query.authorName = authorName;
        }

        let projectsQuery = PortfolioProject.find(query).sort({ createdAt: -1 });

        if (limit) {
            projectsQuery = projectsQuery.limit(parseInt(limit));
        }

        const projects = await projectsQuery.lean();

        return NextResponse.json({
            success: true,
            count: projects.length,
            projects
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching portfolio projects:', error);
        return NextResponse.json(
            { error: 'Failed to fetch projects', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/portfolio-projects - Submit new project
export async function POST(request) {
    await connectDB();

    try {
        const body = await request.json();
        const { title, description, tags, category, imageUrl, githubUrl, liveUrl, authorName } = body;

        // Validation
        if (!title || !description || !authorName) {
            return NextResponse.json({
                error: 'Missing required fields: title, description, authorName'
            }, { status: 400 });
        }

        const newProject = await PortfolioProject.create({
            title,
            description,
            tags: tags || [],
            category: category || 'Other',
            imageUrl,
            githubUrl,
            liveUrl,
            authorName,
            status: 'pending',
            featured: false
        });

        return NextResponse.json({
            success: true,
            message: 'Project submitted for review',
            project: newProject
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating portfolio project:', error);
        return NextResponse.json(
            { error: 'Failed to create project', details: error.message },
            { status: 500 }
        );
    }
}

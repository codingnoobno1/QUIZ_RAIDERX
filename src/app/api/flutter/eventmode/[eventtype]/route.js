import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';

/**
 * GET /api/flutter/eventmode/[eventtype]
 * Get mode-specific data and configuration.
 * Query Parameters: eventId, email (optional for personalization)
 */
export async function GET(req, { params }) {
    try {
        const { eventtype } = await params;
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');
        const email = searchParams.get('email');

        if (!eventId) {
            return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
        }

        await connectDB();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Verify if the requested mode is available for this event
        const modeConfig = event.modes.find(m => m.type === eventtype);

        let responseData = {
            mode: eventtype,
            active: event.activeMode?.type === eventtype,
            activeMode: event.activeMode || null, // Returns { type, startedAt }
            config: modeConfig ? modeConfig.config : {}
        };

        // If email provided, fetch user's progress in this mode
        if (email) {
            const registration = await EventRegistration.findOne({
                eventId,
                $or: [
                    { email: email.toLowerCase() },
                    { 'members.email': email.toLowerCase(), 'members.inviteStatus': 'accepted' }
                ]
            });

            if (registration) {
                const userProgress = registration.modeProgress.find(p => p.mode === eventtype);
                responseData.userProgress = userProgress || { status: 'not-started', score: 0 };
            }
        }

        // Mode specific logic/data structures
        switch (eventtype) {
            case 'quiz':
                // Add quiz specific fields (e.g. sub-categories)
                responseData.subModes = [
                    { id: 'rapid-fire', name: 'Rapid Fire', description: 'Quick questions, 10s each' },
                    { id: 'long-thinking', name: 'Deep Dive', description: 'Complex problems' },
                    { id: 'teachers-quiz', name: 'Professor Challenge', description: 'Curated by faculty' },
                    { id: 'custom-quiz', name: 'Themed Quiz', description: 'Event specific themes' }
                ];
                break;
            case 'voting':
                responseData.options = [
                    { id: 'in-favour', label: 'In Favour' },
                    { id: 'against', label: 'Against' }
                ];
                // In a real scenario, you'd fetch live voting tallies here
                responseData.votingTopics = modeConfig?.config?.topics || ['Is AI the future?', 'Hybrid vs Native Apps'];
                break;
            case 'treasure-hunt':
                responseData.status = 'Ready to Hunt';
                responseData.clueCount = modeConfig?.config?.clueCount || 5;
                break;
            default:
                break;
        }

        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error('Event Mode error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/flutter/eventmode/[eventtype]
 * Update user progress or submission for a specific mode.
 */
export async function POST(req, { params }) {
    try {
        const { eventtype } = await params;
        const body = await req.json();
        const { eventId, email, score, status, data } = body;

        if (!eventId || !email) {
            return NextResponse.json({ error: 'Missing eventId or email' }, { status: 400 });
        }

        await connectDB();

        const registration = await EventRegistration.findOne({
            eventId,
            $or: [
                { email: email.toLowerCase() },
                { 'members.email': email.toLowerCase(), 'members.inviteStatus': 'accepted' }
            ]
        });

        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        // 4. Reliability & Security: Prevent Fake Requests
        // Never trust Flutter state. Check backend truth for active mode.
        const event = await Event.findById(eventId);
        if (!event || event.activeMode?.type !== eventtype) {
            return NextResponse.json({
                error: `Submission rejected. ${eventtype} is not currently active for this event.`,
                activeMode: event?.activeMode?.type || 'none'
            }, { status: 403 });
        }

        // Find or create progress entry for this mode
        let progressIndex = registration.modeProgress.findIndex(p => p.mode === eventtype);

        if (progressIndex > -1) {
            // Update existing
            registration.modeProgress[progressIndex].status = status || registration.modeProgress[progressIndex].status;
            registration.modeProgress[progressIndex].score = score !== undefined ? score : registration.modeProgress[progressIndex].score;
            registration.modeProgress[progressIndex].data = data ? { ...registration.modeProgress[progressIndex].data, ...data } : registration.modeProgress[progressIndex].data;
        } else {
            // Add new
            registration.modeProgress.push({
                mode: eventtype,
                status: status || 'completed',
                score: score || 0,
                data: data || {}
            });
        }

        await registration.save();

        return NextResponse.json({
            success: true,
            message: `Progress updated for ${eventtype}`,
            userProgress: registration.modeProgress.find(p => p.mode === eventtype)
        }, { status: 200 });

    } catch (error) {
        console.error('Event Mode update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

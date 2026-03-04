import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';
import EventActivity from '@/models/EventActivity';

/**
 * GET /api/flutter/events/timeline?eventId=[id]
 *
 * One-time fetch when Flutter enters an event.
 * Returns the full activity schedule so the app can cache it locally.
 * Only heavy data (quiz packs) is preloaded. Sensitive fields are stripped.
 */
export async function GET(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const event = await Event.findById(eventId)
            .select('title description date time location imageUrl onDuty')
            .lean();

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const activities = await EventActivity.find({ eventId })
            .sort({ order: 1 })
            .lean();

        // Build safe timeline entries
        const timeline = activities.map(act => {
            const entry = {
                _id: act._id,
                type: act.type,
                title: act.title,
                description: act.description,
                status: act.status,
                order: act.order,
                activatedAt: act.activatedAt
            };

            // Preload quiz questions (strip answers for preloaded packs)
            if (act.type === 'quiz') {
                entry.quiz = {
                    quizType: act.quiz?.quizType,
                    timePerQuestion: act.quiz?.timePerQuestion,
                    totalQuestions: act.quiz?.questions?.length || 0,
                    autoAdvance: act.quiz?.autoAdvance,
                    shuffle: act.quiz?.shuffle,
                    // Only preload for rapid_fire/preloaded — custom_live is served question-by-question
                    questions: act.quiz?.quizType !== 'custom_live'
                        ? (act.quiz?.questions || []).map(q => ({
                            _id: q._id,
                            text: q.text,
                            options: q.options,
                            points: q.points,
                            imageUrl: q.imageUrl
                            // correctAnswer intentionally omitted
                        }))
                        : undefined
                };
            }

            // Voting metadata (no current tallies — use /vote GET for that)
            if (act.type === 'voting') {
                entry.voting = {
                    question: act.voting?.question,
                    options: act.voting?.options,
                    allowMultiple: act.voting?.allowMultiple,
                    showLiveResults: act.voting?.showLiveResults,
                    votingDurationSeconds: act.voting?.votingDurationSeconds
                };
            }

            // Hunt: only expose checkpoint IDs and hints (not quiz answers)
            if (act.type === 'hunt') {
                entry.hunt = {
                    totalCheckpoints: act.hunt?.checkpoints?.length || 0,
                    ordered: act.hunt?.ordered,
                    checkpoints: (act.hunt?.checkpoints || []).map(cp => ({
                        checkpointId: cp.checkpointId,
                        order: cp.order,
                        hint: cp.hint,
                        challengeType: cp.challengeType
                    }))
                };
            }

            // External game info
            if (act.type === 'external') {
                entry.external = {
                    url: act.external?.url,
                    points: act.external?.points,
                    durationMinutes: act.external?.durationMinutes
                };
            }

            // Announcement text
            if (act.type === 'announcement') {
                entry.announcement = {
                    message: act.announcement?.message,
                    displaySeconds: act.announcement?.displaySeconds
                };
            }

            return entry;
        });

        return NextResponse.json({
            success: true,
            data: {
                event,
                timeline,
                totalActivities: timeline.length,
                fetchedAt: new Date().toISOString()
            }
        });

    } catch (err) {
        console.error('Timeline fetch error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

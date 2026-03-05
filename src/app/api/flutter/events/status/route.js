import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';
import EventActivity from '@/models/EventActivity';

/**
 * GET /api/flutter/events/status?eventId=[id]
 *
 * Lightweight poll — Flutter calls this every 5-10 seconds to know what is LIVE.
 * Returns the currently active EventActivity with a safe, type-specific payload.
 * No correct answers or secret keys are ever exposed.
 */
export async function GET(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const event = await Event.findById(eventId).select('title onDuty').lean();
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const activeActivity = await EventActivity.findOne({ eventId, status: 'active' }).lean();

        if (!activeActivity) {
            return NextResponse.json({
                success: true,
                data: {
                    eventId,
                    onDuty: event.onDuty,
                    activeActivity: null,
                    serverTime: new Date().toISOString()
                }
            });
        }

        // Build a safe, stripped payload per activity type
        const safe = {
            _id: activeActivity._id,
            type: activeActivity.type,
            title: activeActivity.title,
            description: activeActivity.description,
            status: activeActivity.status,
            activatedAt: activeActivity.activatedAt,
        };

        if (activeActivity.type === 'quiz') {
            const q = activeActivity.quiz;
            safe.quiz = {
                quizType: q.quizType,
                timePerQuestion: q.timePerQuestion,
                totalQuestions: q.questions?.length || 0,
                currentQuestion: q.currentQuestion || 0,
                autoAdvance: q.autoAdvance,
                shuffle: q.shuffle,
                // custom_live: only the current question (no answer)
                activeQuestion: q.quizType === 'custom_live' && q.questions?.length > 0 ? {
                    index: q.currentQuestion,
                    text: q.questions[q.currentQuestion]?.text,
                    options: q.questions[q.currentQuestion]?.options,
                    points: q.questions[q.currentQuestion]?.points
                } : null,
                // rapid_fire / preloaded: all questions WITH correctAnswer for local grading
                questions: q.quizType !== 'custom_live'
                    ? (q.questions || []).map(qu => ({
                        _id: qu._id,
                        text: qu.text,
                        options: qu.options,
                        correctAnswer: qu.correctAnswer,
                        points: qu.points,
                        imageUrl: qu.imageUrl
                    }))
                    : undefined
            };
        }

        if (activeActivity.type === 'voting') {
            safe.voting = {
                question: activeActivity.voting?.question,
                options: activeActivity.voting?.options,
                allowMultiple: activeActivity.voting?.allowMultiple,
                showLiveResults: activeActivity.voting?.showLiveResults,
                votingDurationSeconds: activeActivity.voting?.votingDurationSeconds
            };
        }

        if (activeActivity.type === 'hunt') {
            safe.hunt = {
                totalCheckpoints: activeActivity.hunt?.checkpoints?.length || 0,
                ordered: activeActivity.hunt?.ordered,
                checkpoints: (activeActivity.hunt?.checkpoints || []).map(cp => ({
                    checkpointId: cp.checkpointId,
                    hint: cp.hint,
                    challengeType: cp.challengeType,
                    order: cp.order
                    // Note: quizRef and externalUrl are revealed only after scanning
                }))
            };
        }

        if (activeActivity.type === 'external') {
            safe.external = {
                url: activeActivity.external?.url,
                points: activeActivity.external?.points,
                durationMinutes: activeActivity.external?.durationMinutes
                // secretKey is NEVER exposed
            };
        }

        if (activeActivity.type === 'announcement') {
            safe.announcement = {
                message: activeActivity.announcement?.message,
                displaySeconds: activeActivity.announcement?.displaySeconds
            };
        }

        return NextResponse.json({
            success: true,
            data: {
                eventId,
                onDuty: event.onDuty,
                activeActivity: safe,
                serverTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Flutter status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

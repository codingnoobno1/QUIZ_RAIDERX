import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';
import EventActivity from '@/models/EventActivity';
import QuizSubmission from '@/models/QuizSubmission';
import EventVote from '@/models/EventVote';
import HuntProgress from '@/models/HuntProgress';
import { invalidIdResponse, notFound, serverError } from '@/lib/apiGuards';

/**
 * GET /api/flutter/events/status?eventId=[id]&participantId=[id]
 *
 * The poll. Every phone in the room and every browser in the lobby hits this on
 * a 7-30s cadence, so it is the one route that must never throw and must stay
 * cheap: three indexed lookups, no population, projection everywhere.
 *
 * Secrets withheld: the hunt's `quizRef`/`externalUrl` (revealed on scan) and
 * the external activity's `secretKey`.
 *
 * KNOWN EXPOSURE: for `rapid_fire`/`preloaded` the payload includes each
 * question's `correctAnswer`, because both clients grade locally for instant
 * feedback. Anyone reading the network tab can therefore score full marks.
 * That is a deliberate contract with the shipped mobile client — changing it
 * needs both clients updated together, so it is left alone here.
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const participantId = searchParams.get('participantId');

    if (!eventId) {
        return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    // A malformed id used to become a CastError -> 500, which reads to a client
    // as an outage and gets retried. It is a 400.
    const invalid = invalidIdResponse(eventId, 'eventId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const event = await Event.findById(eventId).select('title onDuty').lean();
        if (!event) return notFound('Event not found');

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

        // Has this participant already taken part? Previously answered for
        // quizzes only, so the lobby offered "Join now" for a poll you had
        // already voted in, and a hunt you were already running.
        const hasSubmitted = await participantHasSubmitted(activeActivity, participantId);

        const safe = {
            _id: activeActivity._id,
            type: activeActivity.type,
            title: activeActivity.title,
            description: activeActivity.description,
            status: activeActivity.status,
            activatedAt: activeActivity.activatedAt,
            hasSubmitted
        };

        if (activeActivity.type === 'quiz') {
            const q = activeActivity.quiz ?? {};
            const questions = Array.isArray(q.questions) ? q.questions : [];

            // Clamp: a host who advances past the last question (or a config
            // written by hand) must not produce an out-of-range read.
            const index = Math.min(Math.max(Number(q.currentQuestion) || 0, 0), Math.max(questions.length - 1, 0));
            const current = questions[index];

            safe.quiz = {
                quizType: q.quizType,
                timePerQuestion: q.timePerQuestion,
                totalQuestions: questions.length,
                currentQuestion: index,
                autoAdvance: q.autoAdvance,
                shuffle: q.shuffle,
                // custom_live: only the current question, and never its answer.
                activeQuestion: q.quizType === 'custom_live' && current ? {
                    // The id is what the grader matches on. Without it the client
                    // could only send the index, which matched nothing — every
                    // host-paced answer scored zero.
                    _id: current._id,
                    index,
                    text: current.text,
                    options: current.options,
                    points: current.points
                } : null,
                // rapid_fire / preloaded: full pack for local grading (see note above).
                questions: q.quizType !== 'custom_live'
                    ? questions.map(qu => ({
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
                    // quizRef and externalUrl are revealed only after scanning
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
        return serverError(error, 'flutter/events/status');
    }
}

/**
 * One indexed `_id`-only lookup per type. A failure here must not fail the
 * poll — the participant would lose the whole lobby over a "have you voted?"
 * question, so it degrades to false.
 */
async function participantHasSubmitted(activity, participantId) {
    if (!participantId) return false;

    try {
        switch (activity.type) {
            case 'quiz': {
                const found = await QuizSubmission.findOne({ activityId: activity._id, participantId })
                    .select('_id').lean();
                return Boolean(found);
            }
            case 'voting': {
                const found = await EventVote.findOne({ activityId: activity._id, participantId })
                    .select('_id').lean();
                return Boolean(found);
            }
            case 'hunt': {
                const found = await HuntProgress.findOne({ eventId: activity.eventId, participantId })
                    .select('status').lean();
                return found?.status === 'finished';
            }
            default:
                return false;
        }
    } catch (error) {
        console.error('[api:flutter/events/status] hasSubmitted lookup failed', error);
        return false;
    }
}

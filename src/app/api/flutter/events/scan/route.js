import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import HuntProgress from '@/models/HuntProgress';

/**
 * POST /api/flutter/events/scan
 *
 * Called after Flutter scans a QR code.
 * QR format: pixel://hunt/[eventId]/[checkpointId]
 *
 * Body: { participantId, eventId, checkpointId }
 *
 * Returns the checkpoint challenge (hint / quiz pack / external URL).
 * Validates order if hunt is ordered. Prevents duplicate scans.
 */
export async function POST(req) {
    try {
        await connectDB();
        const { participantId, eventId, checkpointId } = await req.json();

        if (!participantId || !eventId || !checkpointId) {
            return NextResponse.json(
                { error: 'participantId, eventId, and checkpointId are required' },
                { status: 400 }
            );
        }

        // Find the active hunt activity
        const huntActivity = await EventActivity.findOne({
            eventId,
            type: 'hunt',
            status: 'active'
        }).lean();

        if (!huntActivity) {
            return NextResponse.json(
                { error: 'No active treasure hunt found for this event.' },
                { status: 403 }
            );
        }

        const checkpoint = huntActivity.hunt?.checkpoints?.find(
            cp => cp.checkpointId === checkpointId
        );

        if (!checkpoint) {
            return NextResponse.json(
                { error: 'Invalid checkpoint ID. QR code may be outdated.' },
                { status: 404 }
            );
        }

        // ── Order check ──────────────────────────────────────────────────────
        if (huntActivity.hunt.ordered && checkpoint.order > 1) {
            const prevCheckpoint = huntActivity.hunt.checkpoints.find(
                cp => cp.order === checkpoint.order - 1
            );
            if (prevCheckpoint) {
                const progress = await HuntProgress.findOne({ eventId, participantId }).lean();
                const prevDone = progress?.checkpointsReached?.some(
                    r => r.checkpointId === prevCheckpoint.checkpointId && r.completed
                );
                if (!prevDone) {
                    return NextResponse.json(
                        { error: 'Complete the previous checkpoint first.', code: 'OUT_OF_ORDER' },
                        { status: 400 }
                    );
                }
            }
        }

        // ── Duplicate scan check ─────────────────────────────────────────────
        const existingProgress = await HuntProgress.findOne({ eventId, participantId }).lean();
        const alreadyScanned = existingProgress?.checkpointsReached?.some(
            r => r.checkpointId === checkpointId
        );
        if (alreadyScanned) {
            return NextResponse.json(
                { error: 'You have already scanned this checkpoint.', code: 'DUPLICATE_SCAN' },
                { status: 409 }
            );
        }

        // ── Record scan in HuntProgress ──────────────────────────────────────
        await HuntProgress.findOneAndUpdate(
            { eventId, participantId },
            {
                $setOnInsert: { eventId, participantId, totalScore: 0, status: 'active' },
                $push: {
                    checkpointsReached: {
                        checkpointId,
                        discoveredAt: new Date(),
                        completed: checkpoint.challengeType === 'hint-only',
                        completedAt: checkpoint.challengeType === 'hint-only' ? new Date() : null,
                        pointsAwarded: checkpoint.challengeType === 'hint-only' ? checkpoint.points : 0
                    }
                },
                $inc: {
                    totalScore: checkpoint.challengeType === 'hint-only' ? checkpoint.points : 0
                }
            },
            { upsert: true }
        );

        // ── Build response ────────────────────────────────────────────────────
        const totalCheckpoints = huntActivity.hunt.checkpoints.length;
        const updatedProgress = await HuntProgress.findOne({ eventId, participantId }).lean();
        const completedCount = updatedProgress?.checkpointsReached?.filter(r => r.completed).length || 0;

        const response = {
            success: true,
            checkpointId,
            order: checkpoint.order,
            points: checkpoint.points,
            challengeType: checkpoint.challengeType,
            totalCheckpoints,
            completedCheckpoints: completedCount,
            totalScore: updatedProgress?.totalScore || 0,
        };

        if (checkpoint.challengeType === 'hint-only') {
            response.challenge = {
                type: 'hint',
                hint: checkpoint.hint,
                location: checkpoint.location || null,
                message: `✓ Checkpoint ${checkpoint.order}/${totalCheckpoints} reached! +${checkpoint.points} pts`
            };
        } else if (checkpoint.challengeType === 'quiz') {
            // Load the linked quiz activity
            const quizAct = checkpoint.quizRef
                ? await EventActivity.findById(checkpoint.quizRef).lean()
                : null;

            response.challenge = {
                type: 'quiz',
                activityId: quizAct?._id || null,
                title: quizAct?.title || 'Quiz Challenge',
                // Strip answers
                questions: (quizAct?.quiz?.questions || []).map(q => ({
                    _id: q._id,
                    text: q.text,
                    options: q.options,
                    points: q.points
                })),
                timePerQuestion: quizAct?.quiz?.timePerQuestion || 20,
                hint: checkpoint.hint
            };
        } else if (checkpoint.challengeType === 'external-game') {
            response.challenge = {
                type: 'external',
                url: checkpoint.externalUrl,
                hint: checkpoint.hint,
                points: checkpoint.points
            };
        }

        // Hunt completed?
        if (completedCount >= totalCheckpoints) {
            response.huntCompleted = true;
            response.finalScore = updatedProgress?.totalScore || 0;
            response.message = `🏆 Hunt Complete! Final score: ${updatedProgress?.totalScore || 0} pts`;

            // Mark hunt progress as finished
            await HuntProgress.updateOne(
                { eventId, participantId },
                { $set: { status: 'finished' } }
            );
        }

        return NextResponse.json(response);

    } catch (err) {
        console.error('Scan error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

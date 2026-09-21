import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';
import QuizSubmission from '@/models/QuizSubmission';
import QuizPaper from '@/models/QuizPaper';
import LiveAnswer from '@/models/LiveAnswer';
import EventVote from '@/models/EventVote';
import HuntProgress from '@/models/HuntProgress';
import {
    requireAdmin,
    invalidIdResponse,
    badRequest,
    conflict,
    notFound,
    serverError,
} from '@/lib/apiGuards';

/**
 * /api/admin/events/registrations — clear the entrants for one event.
 *
 *   GET    ?eventId=              what a reset would remove. Changes nothing.
 *   DELETE ?eventId=&confirm=     removes it.
 *
 * This exists for rehearsals: an organiser testing the flow needs to register,
 * play, and start again, and nothing in the platform could undo a registration
 * at all — the only delete in the whole API removes an entire event.
 *
 * It is the most destructive route here, so it is built to be hard to fire by
 * accident. It takes one event and never a filter that could widen. It refuses
 * unless `confirm` repeats the event id, so a bookmarked or copied URL cannot
 * do it in one click. And it refuses outright once anyone has played, because
 * deleting a registration under a submitted paper orphans the score from the
 * person who earned it — `force=true` says you mean it anyway.
 */

/** Everything keyed to this event, counted the same way by preview and delete. */
async function tally(eventId) {
    const [registrations, submissions, papers, answers, votes, hunts] = await Promise.all([
        EventRegistration.countDocuments({ eventId }),
        QuizSubmission.countDocuments({ eventId }),
        QuizPaper.countDocuments({ eventId }),
        LiveAnswer.countDocuments({ eventId }),
        EventVote.countDocuments({ eventId }),
        HuntProgress.countDocuments({ eventId }),
    ]);

    return {
        registrations,
        play: { submissions, papers, answers, votes, hunts },
        playTotal: submissions + papers + answers + votes + hunts,
    };
}

/** GET ?eventId= — the preview. Safe to call, and the number the UI shows. */
export async function GET(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const eventId = new URL(req.url).searchParams.get('eventId');
    const invalid = invalidIdResponse(eventId, 'eventId');
    if (invalid) return invalid;

    try {
        await connectDB();

        const event = await Event.findById(eventId).select('title').lean();
        if (!event) return notFound('Event not found.');

        const counts = await tally(eventId);
        return NextResponse.json({
            success: true,
            data: { event: { id: eventId, title: event.title }, ...counts },
        });
    } catch (error) {
        return serverError(error, 'admin/events/registrations/preview');
    }
}

/**
 * DELETE ?eventId=<id>&confirm=<id>[&force=true][&includePlay=true]
 *
 * Removes every registration for the event — solo and team alike. Activities,
 * their questions and the round rosters are left alone: this resets who is
 * entered, not what is being run.
 *
 * `includePlay` also clears what those entrants did: submissions, dealt papers,
 * live answers, votes and hunt progress. Without it a rehearsal leaves its own
 * wreckage on the board — a scoreless entry from an attempt that was refused
 * still ranks on the standings of the "fresh" run that follows.
 */
export async function DELETE(req) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const params = new URL(req.url).searchParams;
    const eventId = params.get('eventId');
    const confirm = params.get('confirm');
    const includePlay = params.get('includePlay') === 'true';
    // Clearing the play data removes the very thing the refusal protects, so
    // asking for it is also answering it.
    const force = params.get('force') === 'true' || includePlay;

    const invalid = invalidIdResponse(eventId, 'eventId');
    if (invalid) return invalid;

    // Deliberately not a boolean. Typing the event's own id is the difference
    // between "I meant this event" and "I clicked the wrong row".
    if (confirm !== eventId) {
        return badRequest('Pass confirm= the same event id to delete its registrations.', {
            code: 'CONFIRM_MISMATCH',
        });
    }

    try {
        await connectDB();

        const event = await Event.findById(eventId).select('title').lean();
        if (!event) return notFound('Event not found.');

        const before = await tally(eventId);

        if (before.playTotal > 0 && !force) {
            return conflict(
                'People have already played this event. Deleting their registrations would leave '
                + 'their scores with nobody attached. Send force=true if that is what you want.',
                { code: 'HAS_PLAY_DATA', ...before },
            );
        }

        const result = await EventRegistration.deleteMany({ eventId });

        let playDeleted = null;
        if (includePlay) {
            const [submissions, papers, answers, votes, hunts] = await Promise.all([
                QuizSubmission.deleteMany({ eventId }),
                QuizPaper.deleteMany({ eventId }),
                LiveAnswer.deleteMany({ eventId }),
                EventVote.deleteMany({ eventId }),
                HuntProgress.deleteMany({ eventId }),
            ]);
            playDeleted = {
                submissions: submissions.deletedCount,
                papers: papers.deletedCount,
                answers: answers.deletedCount,
                votes: votes.deletedCount,
                hunts: hunts.deletedCount,
            };
        }

        console.warn(
            `[api:admin/registrations/reset] ${result.deletedCount} registration(s)`
            + `${includePlay ? ` and play data ${JSON.stringify(playDeleted)}` : ''} deleted for `
            + `"${event.title}" (${eventId}) by ${auth.actor?.email || auth.actor?.name || 'admin'}`,
        );

        return NextResponse.json({
            success: true,
            data: {
                event: { id: eventId, title: event.title },
                deleted: result.deletedCount,
                playDeleted,
                playDataLeftBehind: !includePlay && before.playTotal > 0 ? before.play : null,
                remaining: await tally(eventId),
            },
        });
    } catch (error) {
        return serverError(error, 'admin/events/registrations/reset');
    }
}

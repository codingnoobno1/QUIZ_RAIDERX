/**
 * Scoring for Electric Answers: attempts in, standings out.
 *
 * The board is a sum over `buzz_attempts`, recomputed whenever a seat is
 * judged and written back onto the activity as `quiz.buzzer.standings`. Every
 * reader — the phones, the projector, the console, the event leaderboard —
 * then reads one array instead of running the same aggregation, which is the
 * difference between a few dozen aggregations a minute and a few dozen a
 * second (see the note on the field itself).
 *
 * Teams with no attempts are still on the board, at zero. A round that showed
 * only the teams that had scored would leave a team wondering whether it was
 * in the game at all.
 */

import mongoose from 'mongoose';
import BuzzAttempt from '@/models/BuzzAttempt';
import EventActivity from '@/models/EventActivity';

/** Per-team totals, straight out of the attempts. */
export async function rollupAttempts(activityId) {
    const rows = await BuzzAttempt.aggregate([
        { $match: { activityId: new mongoose.Types.ObjectId(String(activityId)) } },
        {
            $group: {
                _id: '$teamId',
                score: { $sum: '$points' },
                // A sudden-death win breaks the tie it was called for without
                // inflating the score that caused it, so it is counted apart.
                tiebreakWins: {
                    $sum: {
                        $cond: [
                            { $and: ['$isTiebreak', { $eq: ['$outcome', 'correct'] }] },
                            1,
                            0,
                        ],
                    },
                },
                seatMs: { $sum: { $ifNull: ['$seatMs', 0] } },
                attempts: { $sum: 1 },
                correct: { $sum: { $cond: [{ $eq: ['$outcome', 'correct'] }, 1, 0] } },
                teamName: { $last: '$teamName' },
            },
        },
    ]);

    return new Map(rows.filter((r) => r._id).map((r) => [String(r._id), r]));
}

/**
 * The board for these teams, in ranking order.
 *
 * `teams` is the roster — everyone eligible — so the shape of the board does
 * not change as the round is played.
 */
export async function buildStandings({ activityId, teams }) {
    const totals = await rollupAttempts(activityId);

    const rows = teams.map((team) => {
        const t = totals.get(String(team.teamId));
        return {
            teamId: String(team.teamId),
            teamName: team.teamName ?? t?.teamName ?? String(team.teamId),
            score: t?.score ?? 0,
            tiebreakWins: t?.tiebreakWins ?? 0,
            seatMs: t?.seatMs ?? 0,
        };
    });

    // A team that has since left the roster but has attempts on record still
    // counts — dropping it would quietly change a score that was already played.
    for (const [teamId, t] of totals) {
        if (!rows.some((r) => r.teamId === teamId)) {
            rows.push({
                teamId,
                teamName: t.teamName ?? teamId,
                score: t.score ?? 0,
                tiebreakWins: t.tiebreakWins ?? 0,
                seatMs: t.seatMs ?? 0,
            });
        }
    }

    return rows.sort((a, b) =>
        (b.score - a.score) || (b.tiebreakWins - a.tiebreakWins) || (a.seatMs - b.seatMs));
}

/** Recompute and store. Returns the new board. */
export async function refreshStandings({ activityId, teams }) {
    const standings = await buildStandings({ activityId, teams });

    await EventActivity.updateOne(
        { _id: activityId },
        { $set: { 'quiz.buzzer.standings': standings, 'quiz.buzzer.standingsAt': new Date() } },
    );

    return standings;
}

/**
 * The same totals in the shape `lib/quiz/standings.js` ranks, so the phone
 * leaderboard, the console and the organiser's advancement screen cannot
 * disagree about who came sixth.
 */
export async function fromBuzzAttempts(activityId) {
    const totals = await rollupAttempts(activityId);

    return [...totals.entries()].map(([teamId, t]) => ({
        key: teamId,
        name: t.teamName || teamId,
        teamId,
        teamName: t.teamName ?? null,
        score: t.score ?? 0,
        correct: t.correct ?? 0,
        answered: t.attempts ?? 0,
        // Time on the seat, so the slower of two level teams ranks below the
        // quicker one — the buzzer round's equivalent of finishing early.
        totalElapsedMs: t.seatMs ?? 0,
        tiebreakWins: t.tiebreakWins ?? 0,
    }));
}

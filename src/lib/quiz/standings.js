import mongoose from 'mongoose';
import LiveAnswer from '@/models/LiveAnswer';
import QuizSubmission from '@/models/QuizSubmission';

/**
 * The ranking for one quiz activity, and who goes through.
 *
 * Moved out of the leaderboard route so that the participant board and the
 * organiser's advancement screen rank from one function. Two copies of a
 * ranking rule are how "you came 6th" on a phone and "7th" on the console
 * happen.
 *
 * Order is score, highest first; then accumulated time, lowest first. Time is
 * measured on the server — for a paper, from opening it to handing in the
 * regular section — so the tie-break rewards finishing early, which is what the
 * format asks for, and cannot be improved by a client.
 */

export async function rankActivity(activity) {
    const isTeamScope = activity.quiz?.scope === 'team';
    const rows = activity.quiz?.quizType === 'custom_live'
        ? await fromLiveAnswers(activity._id, isTeamScope)
        : await fromSubmissions(activity._id, isTeamScope);

    rows.sort((a, b) => (b.score - a.score) || (a.totalElapsedMs - b.totalElapsedMs));

    // Competition ranking: entrants level on both score and time share a rank,
    // and the next rank skips accordingly (1, 2, 2, 4). A dense rank would put
    // someone "3rd" with three entrants ahead of them.
    let previous = null;
    return rows.map((row, i) => {
        const tied = previous
            && previous.score === row.score
            && previous.totalElapsedMs === row.totalElapsedMs;
        const rank = tied ? previous.rank : i + 1;
        previous = { ...row, rank };
        return previous;
    });
}

/**
 * Mark who advances.
 *
 * A tie that straddles the cut — the last qualifying place and the first
 * non-qualifying one level on score *and* time — cannot be resolved by the
 * ranking rule, and is reported rather than broken arbitrarily by array order.
 * The organiser decides it, and the decision is recorded when they confirm.
 */
export function applyCut(ranked, count) {
    if (!count || count <= 0) {
        return { rankings: ranked.map((r) => ({ ...r, advancing: false })), tieAtCut: [], cutScore: null };
    }

    const lastIn = ranked[count - 1];
    const firstOut = ranked[count];
    const straddles = Boolean(lastIn && firstOut && lastIn.rank === firstOut.rank);

    const tieAtCut = straddles ? ranked.filter((r) => r.rank === lastIn.rank).map((r) => r.key) : [];

    const rankings = ranked.map((r) => ({
        ...r,
        // Clear of the cut, or part of an unresolved tie on it.
        advancing: straddles ? r.rank < lastIn.rank : r.rank <= count,
        tiedAtCut: tieAtCut.includes(r.key),
    }));

    return { rankings, tieAtCut, cutScore: lastIn?.score ?? null };
}

async function fromLiveAnswers(activityId, isTeamScope) {
    const grouped = await LiveAnswer.aggregate([
        { $match: { activityId: new mongoose.Types.ObjectId(String(activityId)) } },
        {
            $group: {
                _id: isTeamScope ? '$teamKey' : '$participantId',
                score: { $sum: '$pointsAwarded' },
                correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
                answered: { $sum: 1 },
                totalElapsedMs: { $sum: '$elapsedMs' },
                displayName: { $first: isTeamScope ? '$teamName' : '$name' },
                teamId: { $first: '$teamId' },
                teamName: { $first: '$teamName' },
            },
        },
    ]);

    return grouped
        .filter((row) => row._id)
        .map((row) => ({
            key: String(row._id),
            name: row.displayName || String(row._id),
            teamId: row.teamId ?? null,
            teamName: row.teamName ?? null,
            score: row.score ?? 0,
            correct: row.correct ?? 0,
            answered: row.answered ?? 0,
            totalElapsedMs: row.totalElapsedMs ?? 0,
        }));
}

async function fromSubmissions(activityId, isTeamScope) {
    const grouped = await QuizSubmission.aggregate([
        { $match: { activityId: new mongoose.Types.ObjectId(String(activityId)) } },
        {
            $group: {
                _id: isTeamScope ? '$teamId' : '$participantId',
                // One submission per entrant is the intent, enforced by the
                // unique index. $max is the safety net for rows written before
                // that index existed.
                score: { $max: '$score' },
                correct: { $max: '$correctCount' },
                answered: { $max: '$totalQuestions' },
                totalElapsedMs: { $min: { $multiply: [{ $ifNull: ['$timeTakenSeconds', 0] }, 1000] } },
                teamName: { $first: '$teamName' },
                submittedAt: { $min: '$submittedAt' },
            },
        },
    ]);

    return grouped
        .filter((row) => row._id)
        .map((row) => ({
            key: String(row._id),
            name: (isTeamScope ? row.teamName : null) || String(row._id),
            teamId: isTeamScope ? String(row._id) : null,
            teamName: row.teamName ?? null,
            score: row.score ?? 0,
            correct: row.correct ?? 0,
            answered: row.answered ?? 0,
            totalElapsedMs: row.totalElapsedMs ?? 0,
            submittedAt: row.submittedAt ?? null,
        }));
}

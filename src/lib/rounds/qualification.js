import EventRound from '@/models/EventRound';

/**
 * Server-side eligibility check shared by paper, self-paced and host-paced
 * quizzes. A client can hide a button, but only this check keeps an eliminated
 * team from opening or answering the next round with a crafted request.
 */
export async function teamIsQualified({ quiz, eventId, teamId }) {
    const roundId = quiz?.qualificationRoundId;
    if (!roundId) return true;
    if (!teamId) return false;

    return Boolean(await EventRound.exists({
        _id: roundId,
        eventId,
        'teams.teamId': String(teamId),
    }));
}

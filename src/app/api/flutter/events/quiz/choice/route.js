import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongo';
import EventActivity from '@/models/EventActivity';
import {
    DIFFICULTY_TIERS,
    applyTeamChoice,
    choiceIsOpen,
    resolveParticipantTeam,
} from '@/lib/live/rounds';
import { teamIsQualified } from '@/lib/rounds/qualification';
import {
    requireEventUser,
    readJson,
    invalidIdResponse,
    badRequest,
    notFound,
    forbidden,
    conflict,
    serverError,
} from '@/lib/apiGuards';

/**
 * /api/flutter/events/quiz/choice — the team names its own difficulty.
 *
 *   GET  ?activityId=   what this team may choose, and what it has chosen
 *   POST { activityId, difficulty }
 *
 * The counterpart to `quiz/answer`, and strict in the same way: who is asking
 * comes from the verified session, whose turn it is comes from the server's
 * `quiz.choice`, and whether the window is still open is decided against the
 * server's clock. The body carries a tier and nothing else that could matter.
 *
 * A team may change its mind until the host locks the choice. The tap that
 * counts is the last one — a first tap that could not be undone would make a
 * mis-tap cost a round, and the host's lock is the moment of truth anyway.
 */

/** The tiers on offer, with what each is worth and what it costs to be wrong. */
function tiersFor(quiz) {
    const penalties = quiz?.penalties ?? {};
    const byTier = new Map();

    for (const question of quiz?.questions ?? []) {
        const tier = question.difficulty ?? 'medium';
        if (!byTier.has(tier)) byTier.set(tier, { points: Number(question.points) || 0, count: 0 });
        byTier.get(tier).count += 1;
    }

    return DIFFICULTY_TIERS.map((tier) => ({
        difficulty: tier,
        // What a question at this tier is worth, taken from the bank rather
        // than from a table that could drift away from the questions.
        points: byTier.get(tier)?.points ?? 0,
        penalty: penalties.enabled ? Math.max(0, Number(penalties[tier]) || 0) : 0,
        available: (byTier.get(tier)?.count ?? 0) > 0,
    }));
}

async function load(req, activityId) {
    const auth = await requireEventUser(req);
    if (!auth.ok) return { response: auth.response };

    const invalid = invalidIdResponse(activityId, 'activityId');
    if (invalid) return { response: invalid };

    await connectDB();

    const activity = await EventActivity.findById(activityId);
    if (!activity) return { response: notFound('Activity not found.') };
    if (activity.status !== 'active') {
        return { response: conflict('That activity is not running.', { code: 'NOT_ACTIVE' }) };
    }

    const quiz = activity.quiz ?? {};
    if (quiz.quizType !== 'custom_live') {
        return { response: badRequest('This round does not ask teams to choose.', { code: 'NOT_A_CHOICE_ROUND' }) };
    }

    const team = await resolveParticipantTeam(activity.eventId, auth.email);
    if (!(await teamIsQualified({ quiz, eventId: activity.eventId, teamId: team.teamId }))) {
        return { response: forbidden('Your team did not qualify for this round.', { code: 'NOT_QUALIFIED' }) };
    }

    return { auth, activity, quiz, team };
}

/** GET ?activityId= — the tiers, the deadline, and whether it is this team's turn. */
export async function GET(req) {
    const activityId = new URL(req.url).searchParams.get('activityId');

    try {
        const loaded = await load(req, activityId);
        if (loaded.response) return loaded.response;

        const { quiz, team } = loaded;
        const choice = quiz.choice ?? {};
        const isYourTurn = Boolean(team.teamId) && String(choice.teamId ?? '') === String(team.teamId);

        return NextResponse.json({
            success: true,
            data: {
                state: choice.state ?? 'idle',
                isYourTurn,
                open: isYourTurn && choiceIsOpen(choice),
                endsAt: choice.endsAt ?? null,
                // Another team's pick is public — the room can see it on the
                // board anyway, and hiding it here would only desync the two.
                teamId: choice.teamId ?? null,
                teamName: choice.teamName ?? null,
                difficulty: choice.difficulty ?? null,
                tiers: tiersFor(quiz),
                serverTime: new Date().toISOString(),
            },
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        return serverError(error, 'flutter/quiz/choice/read');
    }
}

/** POST { activityId, difficulty } */
export async function POST(req) {
    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response;

    const { activityId, difficulty } = parsed.data;

    try {
        const loaded = await load(req, activityId);
        if (loaded.response) return loaded.response;

        const { auth, activity, quiz, team } = loaded;

        if (!team.teamId) {
            return forbidden('This round is played in teams.', { code: 'NOT_ON_A_TEAM' });
        }

        const result = applyTeamChoice(quiz, {
            teamId: team.teamId,
            difficulty,
            email: auth.email,
        });

        if (!result.ok) {
            // Not your turn is a permission answer; the rest are about timing,
            // which is a conflict rather than a refusal of who you are.
            const status = result.code === 'NOT_YOUR_TURN' ? forbidden : conflict;
            return status(result.reason, { code: result.code });
        }

        activity.markModified('quiz.choice');
        await activity.save();

        return NextResponse.json({
            success: true,
            data: {
                difficulty: result.choice.difficulty,
                chosenAt: result.choice.chosenAt,
                endsAt: result.choice.endsAt,
                // Still changeable until the host locks it, and the client
                // should say so rather than implying the decision is final.
                locked: false,
            },
        });
    } catch (error) {
        return serverError(error, 'flutter/quiz/choice/write');
    }
}

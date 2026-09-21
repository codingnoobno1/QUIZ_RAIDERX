/**
 * Round rosters — the team list for a round, and the pool it is drawn from.
 *
 * Not to be confused with `lib/live/rounds.js`, which is the state machine for
 * one host-paced *question*. This module is about who is in the competition at
 * all: the `EventRound` documents the organiser curates by hand.
 *
 * Both the console and the lobby read a roster through here, so the two can
 * never disagree about who is on the list — only about how much of each entry
 * they are allowed to see.
 */

import EventRegistration from '@/models/EventRegistration';
import { leaderNameOf } from '@/lib/live/rounds';

/**
 * Every team registered for an event — the pool a round is drawn from.
 *
 * Also what `admin/events/teams` returns, and deliberately the same function,
 * because a team that shows up in the console's picker but not in the round
 * editor would be a team the organiser cannot advance.
 */
export async function listEventTeams(eventId) {
    const registrations = await EventRegistration.find({ eventId, registrationType: 'team' })
        .select('teamId teamName leaderEmail email name members')
        .sort({ teamName: 1 })
        .lean();

    return registrations
        .filter((r) => r.teamId)
        .map((r) => ({
            teamId: r.teamId,
            teamName: r.teamName ?? r.teamId,
            leaderEmail: String(r.leaderEmail || r.email || '').toLowerCase(),
            leaderName: leaderNameOf(r) ?? '',
            memberCount: 1 + (r.members?.length ?? 0),
            acceptedCount: 1 + (r.members ?? []).filter((m) => m.inviteStatus === 'accepted').length,
        }));
}

/** teamId -> pool entry, for resolving a roster's snapshots against live registrations. */
export const indexTeams = (teams) => new Map(teams.map((t) => [t.teamId, t]));

/**
 * Trim, de-duplicate and preserve order. The console sends whatever the
 * operator clicked, which on a fast hand is the same team twice.
 */
export function normaliseTeamIds(value) {
    const ids = Array.isArray(value) ? value : [value];
    const seen = new Set();
    const out = [];
    for (const raw of ids) {
        const id = String(raw ?? '').trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}

/**
 * The roster as the organiser sees it: the live registration where there still
 * is one, the snapshot where there is not.
 *
 * A `withdrawn` entry is a team that was on this list and whose registration has
 * since gone. It stays visible, because an organiser who cannot see it cannot
 * decide what to do about it.
 */
export function shapeRoundForAdmin(round, poolById) {
    return {
        id: String(round._id),
        eventId: String(round.eventId),
        roundNumber: round.roundNumber,
        title: round.title,
        format: round.format ?? 'other',
        status: round.status ?? 'draft',
        teamCount: round.teams?.length ?? 0,
        publishedAt: round.publishedAt ?? null,
        updatedAt: round.updatedAt ?? null,
        updatedBy: round.updatedBy ?? null,
        teams: (round.teams ?? []).map((t) => {
            const live = poolById.get(t.teamId);
            return {
                teamId: t.teamId,
                teamName: live?.teamName ?? t.teamName,
                leaderName: live?.leaderName ?? '',
                memberCount: live?.memberCount ?? null,
                note: t.note ?? '',
                addedAt: t.addedAt ?? null,
                addedBy: t.addedBy ?? null,
                withdrawn: !live,
            };
        }),
        audit: (round.audit ?? []).slice(-20).reverse(),
    };
}

/**
 * The roster as the room sees it: names and nothing else.
 *
 * No leader name, no member count, no audit. This list is read by anyone with
 * an event session, and a qualifier board is a public artefact — who advanced,
 * not who is on which team or who leads it.
 */
export function shapeRoundForParticipant(round, poolById, yourTeamId) {
    const teams = (round.teams ?? []).map((t) => ({
        teamId: t.teamId,
        teamName: poolById.get(t.teamId)?.teamName ?? t.teamName,
        isYou: Boolean(yourTeamId) && t.teamId === yourTeamId,
    }));

    return {
        id: String(round._id),
        roundNumber: round.roundNumber,
        title: round.title,
        format: round.format ?? 'other',
        status: round.status ?? 'published',
        teamCount: teams.length,
        publishedAt: round.publishedAt ?? null,
        // Answered here rather than left to the client to work out, because
        // "am I through?" is the only question this screen exists to answer and
        // every client would otherwise derive it slightly differently.
        youAreIn: teams.some((t) => t.isYou),
        teams,
    };
}

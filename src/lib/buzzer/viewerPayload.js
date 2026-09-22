/**
 * The buzzer round as one particular viewer is allowed to see it.
 *
 * The same job `lib/kbc/viewerPayload.js` does for the game show, and it exists
 * for the same reason: what a phone may know depends on who is holding it and
 * what phase the round is in, and that decision belongs on the server. A client
 * that decided for itself could show the answer to whoever opened the developer
 * tools.
 *
 * Three things are never in a participant payload: an answer before the host
 * reveals it, anybody's email address, and the options to a question the host
 * chose to withhold until somebody has buzzed.
 *
 * The shape is fixed by the shipped Flutter client (`lib/models/buzzer_round.dart`).
 * Every key here is one that client reads; renaming one means shipping a new
 * app build, so don't.
 */

import {
    BUZZER_PHASE,
    buzzRefusal,
    buzzerQuestionType,
    buzzerSettings,
    effectiveBuzzerPhase,
    mayPressFor,
} from './machine.js';   // explicit, so `node --test` can load this module too

/** Phases in which nobody has buzzed yet, so hidden options stay hidden. */
const BEFORE_THE_BUZZ = new Set([
    BUZZER_PHASE.STAGED,
    BUZZER_PHASE.COUNTDOWN,
    BUZZER_PHASE.BUZZING,
]);

const REVEALING = new Set([BUZZER_PHASE.REVEALED, BUZZER_PHASE.COMPLETED]);

const iso = (value) => (value ? new Date(value).toISOString() : null);

const shapeTeam = (teamId, teamName, leaderName) =>
    (teamId ? { teamId: String(teamId), teamName: teamName ?? null, leaderName: leaderName ?? null } : null);

/**
 * @param {object}   args
 * @param {object}   args.quiz      the activity's `quiz` sub-document
 * @param {object}   args.question  the staged question, or null
 * @param {object}   args.team      `resolveParticipantTeam()` for this viewer
 * @param {Array}    args.presses   this instance's presses, oldest first
 * @param {Array}    args.attempts  this instance's attempts — only read at reveal
 * @param {string}   args.viewerEmail the verified address, never one from a query
 * @param {boolean}  args.arena     drop everything viewer-specific (projector)
 */
export function buildBuzzerPayload({
    quiz,
    question = null,
    team = null,
    presses = [],
    attempts = [],
    viewerEmail = null,
    now = new Date(),
    arena = false,
}) {
    const buzzer = quiz?.buzzer ?? {};
    const round = buzzer.round ?? {};
    const settings = buzzerSettings(quiz);
    const phase = effectiveBuzzerPhase(round, now);

    const optionsHidden = round.showOptionsBeforeBuzz === false && BEFORE_THE_BUZZ.has(phase);

    const payload = {
        phase,
        instanceId: round.instanceId ? String(round.instanceId) : '',
        question: question
            ? {
                  text: question.text,
                  type: buzzerQuestionType(question),
                  ...(optionsHidden ? {} : { options: question.options ?? [] }),
              }
            : null,
        armsAt: iso(round.armsAt),
        buzzClosesAt: iso(round.buzzClosesAt),
        answerEndsAt: iso(round.seat?.answerEndsAt),
        answerMode: round.answerMode ?? settings.answerMode,
        isTiebreak: Boolean(round.isTiebreak),
        seat: shapeTeam(round.seat?.teamId, round.seat?.teamName, round.seat?.leaderName),
        scoreboard: scoreboard(buzzer),
        // Only ever non-null once the host has revealed. The client refuses to
        // parse an answer from anywhere else, and this is the reason it can.
        reveal: REVEALING.has(phase)
            ? {
                  correctAnswer: question?.correctAnswer ?? null,
                  outcomeByTeam: Object.fromEntries(
                      attempts.map((a) => [String(a.teamId), a.outcome]),
                  ),
              }
            : null,
    };

    if (arena) {
        // The projector shows the race, not the racers' phones: who pressed,
        // how far behind, and nothing addressed to any one viewer. Named
        // `presses` because that is what the arena page already reads.
        payload.presses = presses
            .filter((p) => !p.falseStart)
            .map((p, i) => ({
                position: i,
                teamId: String(p.teamId),
                teamName: p.teamName ?? null,
                offsetMs: p.offsetMs,
            }));
        return payload;
    }

    const teamId = team?.teamId ? String(team.teamId) : null;
    const queue = presses.filter((p) => !p.falseStart);
    const myIndex = teamId ? queue.findIndex((p) => String(p.teamId) === teamId) : -1;
    const mySeat = Boolean(teamId) && String(round.seat?.teamId ?? '') === teamId;
    const amLeader = mayPressFor(buzzer, team, viewerEmail);

    return {
        ...payload,
        myTeam: shapeTeam(teamId, team?.teamName, team?.leaderName),
        amLeader,
        // The same function the press endpoint refuses with, so a phone is
        // never shown a live button for a press that would be turned away.
        canBuzz: amLeader && buzzRefusal({
            round,
            settings,
            team,
            now,
            hasPressed: myIndex >= 0,
        }) === null,
        lockedOut: Boolean(teamId)
            && (round.lockedOutTeamIds ?? []).map(String).includes(teamId),
        mySeat,
        // Where this team stands behind whoever has the floor: 1 is next up.
        // Null while they hold the seat themselves, or have not pressed.
        myQueuePosition: !mySeat && myIndex > 0 ? myIndex : null,
    };
}

/**
 * The board, off the activity document rather than out of an aggregation —
 * see the note on `quiz.buzzer.standings`. Sorted the way the round ranks:
 * score, then sudden-death wins, then time spent holding the seat.
 */
function scoreboard(buzzer) {
    return [...(buzzer.standings ?? [])]
        .sort((a, b) =>
            ((b.score ?? 0) - (a.score ?? 0))
            || ((b.tiebreakWins ?? 0) - (a.tiebreakWins ?? 0))
            || ((a.seatMs ?? 0) - (b.seatMs ?? 0)))
        .map((row) => ({
            teamId: String(row.teamId),
            teamName: row.teamName ?? null,
            score: row.score ?? 0,
            tiebreakWins: row.tiebreakWins ?? 0,
        }));
}

/** How long is left on a clock, floored at zero, for a console that counts down. */
export function msRemaining(until, now = new Date()) {
    if (!until) return null;
    return Math.max(0, new Date(until).getTime() - now.getTime());
}

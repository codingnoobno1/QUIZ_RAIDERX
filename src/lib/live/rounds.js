import EventRegistration from '@/models/EventRegistration';

/**
 * The host-paced question round — the engine behind `custom_live`.
 *
 * KBC has its own machine (`lib/kbc/machine.js`) because a game show has phases
 * a plain quiz does not: a hot seat, lifelines, an audience. This one is the
 * small version, and it is what both team-wise and individual live questioning
 * run on. The two deliberately do not share a state enum — folding a hot seat
 * into a machine that has no contestant is how the KBC fields ended up on
 * activities that never used them.
 *
 * The whole design rests on one idea: the round's deadline is an absolute
 * instant (`endsAt`) written by the server, not a duration handed to a client.
 * A phone can be wrong about the time, be backgrounded, or be restarted; none
 * of that moves `endsAt`.
 */

export const ROUND_STATE = {
    IDLE: 'idle',
    OPEN: 'open',
    LOCKED: 'locked',
    REVEALED: 'revealed',
};

export const LIVE_COMMAND = {
    OPEN_QUESTION: 'OPEN_QUESTION',
    LOCK_QUESTION: 'LOCK_QUESTION',
    REVEAL_QUESTION: 'REVEAL_QUESTION',
    NEXT_QUESTION: 'NEXT_QUESTION',
    END_ROUND: 'END_ROUND',
};

/**
 * Allowance for the network leg.
 *
 * A participant who taps at 14.98s has answered in time; the request still
 * needs to cross a phone network to get here. Without this, the last fraction
 * of every round is dead time that punishes a slow connection rather than a
 * slow answer. It is small enough that it cannot be played for advantage — the
 * question is off the screen by then.
 */
export const GRACE_MS = 800;

/** Whether the overall host-paced envelope has elapsed. */
export function roundClockExpired(roundClock, now = new Date()) {
    return Boolean(roundClock?.endsAt)
        && now.getTime() > new Date(roundClock.endsAt).getTime() + GRACE_MS;
}

/**
 * What the round actually is right now, as opposed to what was last written.
 *
 * A round opened for 15 seconds is closed 15 seconds later whether or not the
 * host pressed anything — they may be talking, or their laptop may have slept.
 * Deriving the lock from `endsAt` rather than storing it means no scheduled job
 * has to run for a deadline to take effect, and every reader (the poll, the
 * answer endpoint, the console) reaches the same verdict from the same fields.
 */
export function effectiveRoundState(liveRound, now = new Date()) {
    const stored = liveRound?.state ?? ROUND_STATE.IDLE;
    if (stored !== ROUND_STATE.OPEN) return stored;
    if (!liveRound?.endsAt) return stored;
    return now.getTime() > new Date(liveRound.endsAt).getTime() + GRACE_MS
        ? ROUND_STATE.LOCKED
        : ROUND_STATE.OPEN;
}

/** Is this participant's team among those the host asked? */
export function isTargeted(liveRound, teamId) {
    const target = liveRound?.target;
    if (!target || target.kind !== 'teams') return true;
    const ids = Array.isArray(target.teamIds) ? target.teamIds : [];
    if (!ids.length) return true;
    return Boolean(teamId) && ids.map(String).includes(String(teamId));
}

// ── Command legality ─────────────────────────────────────────────────────────

const ALLOWED_FROM = {
    [LIVE_COMMAND.OPEN_QUESTION]: [ROUND_STATE.IDLE, ROUND_STATE.LOCKED, ROUND_STATE.REVEALED],
    [LIVE_COMMAND.LOCK_QUESTION]: [ROUND_STATE.OPEN],
    [LIVE_COMMAND.REVEAL_QUESTION]: [ROUND_STATE.OPEN, ROUND_STATE.LOCKED],
    [LIVE_COMMAND.NEXT_QUESTION]: [ROUND_STATE.LOCKED, ROUND_STATE.REVEALED],
    [LIVE_COMMAND.END_ROUND]: Object.values(ROUND_STATE),
};

const NEXT_STATE = {
    [LIVE_COMMAND.OPEN_QUESTION]: ROUND_STATE.OPEN,
    [LIVE_COMMAND.LOCK_QUESTION]: ROUND_STATE.LOCKED,
    [LIVE_COMMAND.REVEAL_QUESTION]: ROUND_STATE.REVEALED,
    [LIVE_COMMAND.NEXT_QUESTION]: ROUND_STATE.OPEN,
    [LIVE_COMMAND.END_ROUND]: ROUND_STATE.IDLE,
};

const GUARDS = {
    [LIVE_COMMAND.OPEN_QUESTION]: (quiz, payload) => {
        const total = quiz.questions?.length ?? 0;
        if (!total) return 'This quiz has no questions.';
        const index = Number(payload?.questionIndex);
        if (!Number.isInteger(index) || index < 0 || index >= total) {
            return `Question ${payload?.questionIndex} does not exist.`;
        }
        return null;
    },

    [LIVE_COMMAND.NEXT_QUESTION]: (quiz) => {
        const total = quiz.questions?.length ?? 0;
        const next = (quiz.liveRound?.questionIndex ?? 0) + 1;
        return next < total ? null : 'That was the last question.';
    },
};

/**
 * @returns {{ ok: true, nextState: string } | { ok: false, reason: string }}
 */
export function canRunLive(action, quiz, payload) {
    const allowed = ALLOWED_FROM[action];
    if (!allowed) return { ok: false, reason: `Unknown command ${action}.` };

    // The derived state, not the stored one — a host whose round has already
    // timed out may open the next question without first pressing lock.
    const state = effectiveRoundState(quiz?.liveRound);
    if (!allowed.includes(state)) {
        return { ok: false, reason: `Cannot ${action} while the round is ${state}.` };
    }

    if (
        (action === LIVE_COMMAND.OPEN_QUESTION || action === LIVE_COMMAND.NEXT_QUESTION)
        && roundClockExpired(quiz?.roundClock)
    ) {
        return { ok: false, reason: 'The overall round time is up.' };
    }

    const reason = GUARDS[action]?.(quiz, payload);
    if (reason) return { ok: false, reason };

    return { ok: true, nextState: NEXT_STATE[action] };
}

/**
 * Perform a command's effects. Mutates `quiz.liveRound`; the caller sets state.
 *
 * `newInstanceId` is supplied by the caller rather than minted here so the route
 * keeps its single dependency on mongoose and this module stays pure enough to
 * test without a database.
 */
export function applyLiveEffects({ action, payload = {}, quiz, now, newInstanceId }) {
    const round = quiz.liveRound ?? {};

    if (action === LIVE_COMMAND.OPEN_QUESTION || action === LIVE_COMMAND.NEXT_QUESTION) {
        ensureRoundClock(quiz, now);
    }

    switch (action) {
        case LIVE_COMMAND.OPEN_QUESTION:
            openQuestion(quiz, Number(payload.questionIndex), payload, now, newInstanceId);
            break;

        case LIVE_COMMAND.NEXT_QUESTION:
            openQuestion(quiz, (round.questionIndex ?? 0) + 1, payload, now, newInstanceId);
            break;

        case LIVE_COMMAND.LOCK_QUESTION:
            // Pull the deadline back to now, so a round locked early reads as
            // closed to a client that has not polled yet.
            quiz.liveRound.endsAt = now;
            break;

        case LIVE_COMMAND.REVEAL_QUESTION:
            quiz.liveRound.revealedAt = now;
            if (!quiz.liveRound.endsAt || new Date(quiz.liveRound.endsAt) > now) {
                quiz.liveRound.endsAt = now;
            }
            break;

        case LIVE_COMMAND.END_ROUND:
            quiz.liveRound = {
                instanceId: null,
                questionIndex: round.questionIndex ?? 0,
                state: ROUND_STATE.IDLE,
                openedAt: null,
                endsAt: null,
                durationSeconds: null,
                revealedAt: null,
                target: { kind: 'all', teamIds: [] },
            };
            if (quiz.roundClock?.startedAt) {
                const scheduledEnd = new Date(quiz.roundClock.endsAt ?? now);
                quiz.roundClock.endsAt = scheduledEnd < now ? scheduledEnd : now;
            }
            break;

        default:
            break;
    }
}

function openQuestion(quiz, index, payload, now, newInstanceId) {
    const duration = Number(payload.durationSeconds) > 0
        ? Number(payload.durationSeconds)
        : (quiz.timePerQuestion ?? 15);

    const teamIds = Array.isArray(payload.target?.teamIds)
        ? payload.target.teamIds.map(String).filter(Boolean)
        : [];

    const requestedEnd = new Date(now.getTime() + duration * 1000);
    const overallEnd = quiz.roundClock?.endsAt ? new Date(quiz.roundClock.endsAt) : null;
    const endsAt = overallEnd && overallEnd < requestedEnd ? overallEnd : requestedEnd;
    const effectiveDuration = Math.max(1, Math.ceil((endsAt.getTime() - now.getTime()) / 1000));

    quiz.liveRound = {
        instanceId: newInstanceId,
        questionIndex: index,
        state: ROUND_STATE.OPEN,
        openedAt: now,
        endsAt,
        durationSeconds: effectiveDuration,
        revealedAt: null,
        target: {
            kind: teamIds.length ? 'teams' : 'all',
            teamIds,
        },
    };

    // Kept in step so the existing `currentQuestion` readers — the console, the
    // legacy status payload — do not have to learn about liveRound.
    quiz.currentQuestion = index;
}

/** Start the one clock shared by every question in this host-paced activity. */
function ensureRoundClock(quiz, now) {
    if (quiz.roundClock?.endsAt) return;
    const duration = Math.max(0, Number(quiz.roundDurationSeconds) || 0);
    if (!duration) return;
    quiz.roundClock = {
        startedAt: now,
        endsAt: new Date(now.getTime() + duration * 1000),
        durationSeconds: duration,
    };
}

// ── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Grade one answer.
 *
 * Under `speed_bonus` the bonus is proportional to the time left, capped at
 * half the question's value, so answering instantly is worth 1.5× and answering
 * on the buzzer is worth exactly the base. A wrong answer scores zero however
 * fast it arrived — speed is a tie-break between correct answers, not a
 * consolation for incorrect ones.
 */
export function gradeLiveAnswer({ question, option, receivedAt, liveRound, scoring }) {
    const base = Number(question?.points) || 10;
    const isText = question?.type === 'text';
    const normalise = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    const isCorrect = Boolean(String(option ?? '').trim()) && (
        isText
            ? normalise(option) === normalise(question?.correctAnswer)
            : option === question?.correctAnswer
    );

    if (!isCorrect) return { isCorrect: false, pointsAwarded: 0 };
    if (scoring !== 'speed_bonus') return { isCorrect: true, pointsAwarded: base };

    const endsAt = liveRound?.endsAt ? new Date(liveRound.endsAt).getTime() : null;
    const duration = (Number(liveRound?.durationSeconds) || 0) * 1000;
    if (!endsAt || duration <= 0) return { isCorrect: true, pointsAwarded: base };

    const remaining = Math.max(0, Math.min(duration, endsAt - receivedAt.getTime()));
    const bonus = Math.round(base * 0.5 * (remaining / duration));

    return { isCorrect: true, pointsAwarded: base + bonus };
}

// ── Identity ─────────────────────────────────────────────────────────────────

/**
 * Which team this participant answers for.
 *
 * Resolved here on every answer rather than trusted from the body. A client
 * that could name its own team could also name a team it is not in, and in team
 * scope that means answering on someone else's behalf — or burning their one
 * attempt.
 *
 * The `$or` is wider than it looks because two apps write this collection with
 * schemas that have drifted: `participantEmails` is the current seat claim, and
 * older rows carry the same people only under `email` and `members.email`.
 */
export async function resolveParticipantTeam(eventId, email) {
    const lower = String(email ?? '').toLowerCase();
    if (!lower) return emptyTeam();

    const reg = await EventRegistration.findOne({
        eventId,
        $or: [
            { participantEmails: lower },
            { email: lower },
            { 'members.email': lower },
        ],
    }).select('teamId teamName registrationType name email leaderEmail members').lean();

    if (!reg) return emptyTeam();

    const leaderEmail = leaderEmailOf(reg);

    return {
        teamId: reg.teamId ?? null,
        teamName: reg.teamName ?? null,
        registrationType: reg.registrationType ?? (reg.teamId ? 'team' : 'solo'),
        leaderEmail,
        leaderName: leaderNameOf(reg),
        // What the app puts the leader's controls behind. Derived here rather
        // than compared on the phone, because the phone only knows the address
        // it signed in with.
        isLeader: Boolean(leaderEmail) && leaderEmail === lower,
    };
}

const emptyTeam = () => ({
    teamId: null,
    teamName: null,
    registrationType: 'solo',
    leaderEmail: null,
    leaderName: null,
    isLeader: false,
});

/**
 * Rows written before `leaderEmail` existed have no explicit owner, and for
 * those the registrant is the leader by construction — they are the person who
 * created the entry and invited everyone else.
 */
export function leaderEmailOf(reg) {
    const explicit = String(reg?.leaderEmail ?? '').toLowerCase();
    if (explicit) return explicit;
    const registrant = String(reg?.email ?? '').toLowerCase();
    return registrant || null;
}

/** The leader's display name, wherever in the registration it happens to sit. */
export function leaderNameOf(reg) {
    const leader = leaderEmailOf(reg);
    if (!leader) return reg?.name ?? null;

    if (String(reg?.email ?? '').toLowerCase() === leader) return reg?.name ?? null;

    const member = (reg?.members ?? []).find(
        (m) => String(m?.email ?? '').toLowerCase() === leader,
    );
    return member?.name ?? reg?.name ?? null;
}

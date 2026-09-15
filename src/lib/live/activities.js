import EventActivity from '@/models/EventActivity';

/**
 * Activity rules shared by every route that creates, edits or switches one.
 *
 * These used to be written out separately in each route, and the copies had
 * drifted: the admin app's `activate` stopped other activities but never reset
 * a KBC show, and its `update` did `$set` with whatever the request body held,
 * so a console could write `status`, a live round's `endsAt`, or a hot-seat
 * contestant straight into the document. One module, one set of rules.
 */

export const ACTIVITY_TYPES = ['quiz', 'voting', 'hunt', 'external', 'announcement'];

/** One event runs one thing at a time; the status poll's findOne() assumes it. */
export async function stopOthers(eventId, exceptId) {
    await EventActivity.updateMany(
        { eventId, status: 'active', ...(exceptId ? { _id: { $ne: exceptId } } : {}) },
        { $set: { status: 'completed', completedAt: new Date() } },
    );
}

/**
 * Put an activity live. Mutates the document; the caller saves.
 *
 * Live state from a previous run is cleared on the way in. Restarting a KBC
 * show mid-hot-seat with a stale contestant, or a host-paced quiz with a round
 * still open from last time, is worse than restarting clean.
 */
export async function startActivity(activity) {
    await stopOthers(activity.eventId, activity._id);

    activity.status = 'active';
    activity.activatedAt = new Date();
    activity.completedAt = null;

    const quiz = activity.quiz;
    if (quiz?.quizType === 'kbc') {
        quiz.phase = 'lobby';
        quiz.activeContestant = undefined;
        quiz.answerState = { locked: false, lockedOption: null, lockedAt: null };
        quiz.audiencePoll = { status: 'idle', resultsVisible: false, questionIndex: null };
        quiz.timer = { startedAt: null, endsAt: null, durationSeconds: null };
    }
    if (quiz?.quizType === 'custom_live') {
        quiz.liveRound = idleRound(quiz.liveRound?.questionIndex ?? 0);
    }
}

export function stopActivity(activity) {
    activity.status = 'completed';
    activity.completedAt = new Date();
    if (activity.quiz?.quizType === 'custom_live' && activity.quiz.liveRound?.instanceId) {
        activity.quiz.liveRound = idleRound(activity.quiz.liveRound.questionIndex ?? 0);
    }
}

const idleRound = (questionIndex) => ({
    instanceId: null,
    questionIndex,
    state: 'idle',
    openedAt: null,
    endsAt: null,
    durationSeconds: null,
    revealedAt: null,
    target: { kind: 'all', teamIds: [] },
});

// ── Input ────────────────────────────────────────────────────────────────────

/**
 * The configuration a console may write, per section.
 *
 * Everything else under `quiz` is live state (`liveRound`, `phase`, `timer`,
 * `results`, the hot seat) and is owned by the live command route, where a
 * state machine decides whether a change is legal. Writing it through a config
 * edit would skip that machine entirely. `external.scores` is owned by the
 * signed score callback for the same reason.
 */
const EDITABLE = {
    quiz: [
        'quizType', 'questions', 'timePerQuestion', 'scoring', 'shuffle',
        'autoAdvance', 'maxParticipants', 'scope', 'allowRetake',
    ],
    voting: ['question', 'options', 'allowMultiple', 'showLiveResults', 'votingDurationSeconds'],
    hunt: ['checkpoints', 'ordered'],
    external: ['url', 'points', 'durationMinutes', 'secretKey'],
    announcement: ['message', 'displaySeconds'],
};

const QUESTION_FIELDS = ['text', 'options', 'correctAnswer', 'points', 'imageUrl'];
const CHECKPOINT_FIELDS = [
    'checkpointId', 'hint', 'location', 'challengeType', 'quizRef', 'externalUrl', 'points', 'order',
];

function pick(source, keys) {
    if (!source || typeof source !== 'object') return {};
    const out = {};
    for (const key of keys) {
        if (source[key] !== undefined) out[key] = source[key];
    }
    return out;
}

/**
 * The section for an activity's own type, whitelisted.
 *
 * Only the section that matches `type` is read. A quiz carrying a stray
 * `voting` block is how an activity ended up with two sets of configuration and
 * a lobby that rendered the wrong one.
 */
export function sectionFor(type, body) {
    const section = pick(body?.[type], EDITABLE[type] ?? []);

    if (type === 'quiz' && Array.isArray(section.questions)) {
        section.questions = section.questions.map((q) => pick(q, [...QUESTION_FIELDS, '_id']));
    }
    if (type === 'hunt' && Array.isArray(section.checkpoints)) {
        section.checkpoints = section.checkpoints.map((c, i) => ({
            ...pick(c, [...CHECKPOINT_FIELDS, '_id']),
            order: c?.order ?? i + 1,
            checkpointId: c?.checkpointId || `clue_${i + 1}`,
        }));
    }

    return section;
}

/**
 * Dotted `$set` paths for an edit, so a partial update touches only the fields
 * sent. Replacing the whole `quiz` object would wipe the live state this module
 * refuses to let a config edit write — the same damage by another route.
 */
export function updatePaths(type, body) {
    const $set = {};

    for (const key of ['title', 'description', 'order']) {
        if (body?.[key] !== undefined) $set[key] = body[key];
    }

    const section = sectionFor(type, body);
    for (const [key, value] of Object.entries(section)) {
        $set[`${type}.${key}`] = value;
    }

    return $set;
}

/** Keys the caller sent that this API will not write, so the refusal can name them. */
export function refusedKeys(type, body) {
    const refused = [];
    if (body?.status !== undefined) refused.push('status');
    if (body?.type !== undefined && body.type !== type) refused.push('type');

    const sent = body?.[type];
    if (sent && typeof sent === 'object') {
        for (const key of Object.keys(sent)) {
            if (!(EDITABLE[type] ?? []).includes(key)) refused.push(`${type}.${key}`);
        }
    }
    return refused;
}

/** A Mongoose validation failure is the caller's mistake, not an outage. */
export function validationMessage(error) {
    if (error?.name !== 'ValidationError') return null;
    return Object.values(error.errors ?? {})
        .map((e) => e.message)
        .join(' ');
}

// ── Names ────────────────────────────────────────────────────────────────────

/**
 * Participant id → display name, for reports.
 *
 * Covers team members as well as whoever registered. The admin copies of these
 * reports mapped only the registrant, so every other member of a team appeared
 * in submissions and vote lists as "Unknown User".
 */
export function nameIndex(registrations) {
    const names = new Map();
    const put = (key, name) => {
        const k = String(key ?? '').trim().toLowerCase();
        if (k && name) names.set(k, name);
    };

    for (const reg of registrations) {
        put(reg.email, reg.name);
        put(reg.enrollmentNumber, reg.name);
        put(reg._id, reg.name);
        for (const m of reg.members ?? []) {
            put(m.email, m.name);
            put(m.enrollmentNumber, m.name);
        }
    }

    return (participantId) => names.get(String(participantId ?? '').trim().toLowerCase()) ?? 'Unknown participant';
}

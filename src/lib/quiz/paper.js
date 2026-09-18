import crypto from 'node:crypto';

/**
 * Generated papers: every team sits a different arrangement of the same exam.
 *
 * Round 2 draws 23 questions from a bank of 60 — 8 easy, 10 medium, 5 hard —
 * and shuffles both the questions and each question's options, per team. The
 * platform used to hand every participant one identical list in one identical
 * order, with a `shuffle` flag that was stored, read by the client and never
 * applied.
 *
 * Two properties matter more than the shuffling itself:
 *
 *   The same team always gets the same paper. Selection is seeded from the
 *   activity and the team, so a refresh, a second device or a lost row cannot
 *   deal a new hand. A team that could reshuffle could shop for easy questions.
 *
 *   The paper is generated on the server and the answers never leave it. The
 *   client receives options in their shuffled order and nothing else.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export const PAPER_DEFAULTS = {
    counts: { easy: 8, medium: 10, hard: 5 },
    points: { easy: 5, medium: 11, hard: 20 },
    durationMinutes: 30,
    shuffleQuestions: true,
    shuffleOptions: true,
};

/** Allowance for the network leg on a submission, as elsewhere in the engine. */
export const GRACE_MS = 2000;

// ── Deterministic randomness ─────────────────────────────────────────────────

/**
 * A seeded generator, so "random" is reproducible.
 *
 * `Math.random()` would make a paper impossible to reproduce, and any dispute
 * about what a team was actually asked unanswerable. Seeded from the activity
 * and the team, the same paper can always be regenerated from the two ids.
 */
export function seededRandom(seed) {
    const hash = crypto.createHash('sha256').update(String(seed)).digest();
    let state = hash.readUInt32LE(0) || 1;

    // mulberry32: small, fast, and good enough for shuffling a question list.
    return function next() {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Fisher-Yates, on a copy, driven by the seeded generator. */
export function shuffled(items, rand) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rand() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

// ── Configuration ────────────────────────────────────────────────────────────

export function paperConfig(quiz) {
    const p = quiz?.paper ?? {};
    return {
        counts: { ...PAPER_DEFAULTS.counts, ...(p.counts ?? {}) },
        points: { ...PAPER_DEFAULTS.points, ...(p.points ?? {}) },
        durationMinutes: p.durationMinutes ?? PAPER_DEFAULTS.durationMinutes,
        shuffleQuestions: p.shuffleQuestions !== false,
        shuffleOptions: p.shuffleOptions !== false,
        power: {
            enabled: Boolean(p.power?.enabled),
            count: p.power?.count ?? 2,
            points: p.power?.points ?? 25,
            cutoffMinutes: p.power?.cutoffMinutes ?? 25,
        },
    };
}

/**
 * Can this bank produce the paper the configuration asks for?
 *
 * Checked before an activity goes live, because the failure it prevents is the
 * worst kind: a team sitting down to a paper that is short of hard questions,
 * discovered at the moment they open it.
 */
export function bankShortfalls(questions, counts, power) {
    const have = tally(inPool(questions, 'regular'));
    const rows = DIFFICULTIES
        .map((d) => ({ difficulty: d, need: counts[d] ?? 0, have: have[d] ?? 0 }))
        .filter((row) => row.have < row.need);

    if (power?.enabled) {
        const powerHave = inPool(questions, 'power').length;
        if (powerHave < power.count) rows.push({ pool: 'power', need: power.count, have: powerHave });
    }
    return rows;
}

export function tally(questions) {
    const counts = { easy: 0, medium: 0, hard: 0 };
    for (const q of questions ?? []) counts[difficultyOf(q)] += 1;
    return counts;
}

/** Questions written before difficulty existed count as medium. */
export const difficultyOf = (q) =>
    DIFFICULTIES.includes(q?.difficulty) ? q.difficulty : 'medium';

/** Questions written before pools existed are regular. */
export const poolOf = (q) => (q?.pool === 'power' || q?.pool === 'tiebreak' ? q.pool : 'regular');

export const inPool = (questions, pool) => (questions ?? []).filter((q) => poolOf(q) === pool);

/**
 * What a question is worth.
 *
 * The difficulty table wins when the paper defines one, so +5/+11/+20 follows
 * from the tag rather than from remembering to type the right number on sixty
 * questions. A question's own `points` is the fallback.
 */
export function pointsFor(question, config) {
    const byDifficulty = config?.points?.[difficultyOf(question)];
    return Number.isFinite(byDifficulty) ? byDifficulty : (question?.points ?? 10);
}

// ── Generation ───────────────────────────────────────────────────────────────

/**
 * Deal one team's paper.
 *
 * @param questions the activity's full bank
 * @param config    from `paperConfig`
 * @param seed      stable per owner, e.g. `${activityId}:${ownerKey}`
 * @returns {{ items: Array<{questionId, difficulty, points, optionOrder}> }}
 *
 * `optionOrder` is a permutation of option indexes, stored rather than applied,
 * so the paper can be rendered the same way twice and an answer can still be
 * read back against the question's own option list.
 */
export function dealPaper({ questions, config, seed }) {
    const rand = seededRandom(seed);
    const byDifficulty = { easy: [], medium: [], hard: [] };

    // The regular pool only. Power and tie-break questions are held back for
    // their own draws, so a reserve question cannot surface on an ordinary paper.
    for (const q of inPool(questions, 'regular')) byDifficulty[difficultyOf(q)].push(q);

    let picked = [];
    for (const difficulty of DIFFICULTIES) {
        const want = config.counts[difficulty] ?? 0;
        if (want <= 0) continue;
        // Shuffle the whole pool, then take from the front: sampling without
        // replacement, so a question cannot appear on a paper twice.
        picked = picked.concat(shuffled(byDifficulty[difficulty], rand).slice(0, want));
    }

    const ordered = config.shuffleQuestions ? shuffled(picked, rand) : picked;

    return {
        items: ordered.map((q) => ({
            questionId: String(q._id),
            difficulty: difficultyOf(q),
            points: pointsFor(q, config),
            optionOrder: config.shuffleOptions
                ? shuffled(q.options.map((_, i) => i), rand)
                : q.options.map((_, i) => i),
        })),
    };
}

/**
 * Deal the power questions for an early finisher.
 *
 * Seeded from the paper's own seed plus a suffix, so the power draw is as
 * reproducible as the regular one and independent of it.
 */
export function dealPower({ questions, config, seed }) {
    const rand = seededRandom(`${seed}:power`);
    const pool = shuffled(inPool(questions, 'power'), rand).slice(0, config.power.count);

    return pool.map((q) => ({
        questionId: String(q._id),
        difficulty: difficultyOf(q),
        points: config.power.points,
        optionOrder: config.shuffleOptions
            ? shuffled(q.options.map((_, i) => i), rand)
            : q.options.map((_, i) => i),
    }));
}

/**
 * Whether this paper can still earn its power questions, and until when.
 * The unlock deadline is measured from when the paper was opened.
 */
export function powerStatus(paper, config, now = new Date()) {
    if (!config.power.enabled) return { enabled: false };

    const unlockBy = new Date(new Date(paper.startedAt).getTime() + config.power.cutoffMinutes * 60000);
    const unlocked = Boolean(paper.regularSubmittedAt) && (paper.powerItems?.length ?? 0) > 0;

    return {
        enabled: true,
        count: config.power.count,
        pointsEach: config.power.points,
        unlockBy,
        unlocked,
        stillEligible: !paper.regularSubmittedAt && !paper.submittedAt && now <= unlockBy,
        missed: !unlocked && (Boolean(paper.submittedAt) || now > unlockBy),
    };
}

// ── Presentation ─────────────────────────────────────────────────────────────

/**
 * The paper as the participant sees it: options in their dealt order, and no
 * answers. The client never receives `correctAnswer` for an open paper.
 */
export function renderPaper(paper, questionsById, which = 'items') {
    return (paper[which] ?? [])
        .map((item, index) => {
            const q = questionsById.get(String(item.questionId));
            if (!q) return null;
            return {
                number: index + 1,
                questionId: String(item.questionId),
                text: q.text,
                imageUrl: q.imageUrl,
                difficulty: item.difficulty,
                points: item.points,
                options: item.optionOrder.map((i) => q.options[i]).filter((o) => o !== undefined),
            };
        })
        .filter(Boolean);
}

// ── Grading ──────────────────────────────────────────────────────────────────

/**
 * Grade what was saved.
 *
 * Answers are the option's text, not its position, so the shuffled order does
 * not have to be undone to mark a paper — and a client that reordered options
 * on its own could not accidentally change what it answered.
 */
export function gradePaper(paper, questionsById) {
    const saved = answerMap(paper);
    let score = 0;
    let correctCount = 0;
    let totalPossible = 0;
    let regularScore = 0;
    let powerScore = 0;

    const tagged = [
        ...(paper.items ?? []).map((item) => ({ item, isPower: false })),
        ...(paper.powerItems ?? []).map((item) => ({ item, isPower: true })),
    ];

    const answers = tagged.map(({ item, isPower }) => {
        const q = questionsById.get(String(item.questionId));
        const selected = saved.get(String(item.questionId)) ?? null;
        const isCorrect = Boolean(selected) && selected === q?.correctAnswer;
        const pointsAwarded = isCorrect ? item.points : 0;

        totalPossible += item.points;
        if (isCorrect) {
            score += pointsAwarded;
            correctCount += 1;
            if (isPower) powerScore += pointsAwarded;
            else regularScore += pointsAwarded;
        }

        return {
            questionId: String(item.questionId),
            questionText: q?.text ?? '',
            selectedOption: selected,
            correctAnswer: q?.correctAnswer ?? '',
            isCorrect,
            pointsAwarded,
            isPower,
        };
    });

    return {
        answers,
        score,
        regularScore,
        powerScore,
        correctCount,
        totalPossible,
        totalQuestions: tagged.length,
        percentage: totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0,
    };
}

/** Mongoose Maps and plain objects both turn up here depending on `.lean()`. */
export function answerMap(paper) {
    const raw = paper?.answers;
    if (!raw) return new Map();
    return raw instanceof Map ? new Map(raw) : new Map(Object.entries(raw));
}

// ── Time ─────────────────────────────────────────────────────────────────────

/**
 * Open until the deadline, then closed — derived from `endsAt` rather than
 * stored, so a paper ends on time without a scheduled job, and every reader
 * agrees about whether it has.
 */
export function paperState(paper, now = new Date()) {
    if (paper?.submittedAt) return 'submitted';
    if (paper?.endsAt && now.getTime() > new Date(paper.endsAt).getTime() + GRACE_MS) return 'closed';
    if (paper?.regularSubmittedAt) return 'power';
    return 'open';
}

export const remainingMs = (paper, now = new Date()) =>
    Math.max(0, new Date(paper?.endsAt ?? 0).getTime() - now.getTime());

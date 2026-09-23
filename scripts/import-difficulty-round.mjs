/**
 * Import the Difficulty Challenge bank as a playable activity.
 *
 *   node scripts/import-difficulty-round.mjs <eventId> <bank.json> [--activate] [--dry]
 *
 * Kept apart from `import-event.mjs` on purpose: that one upserts the *event*
 * by title, and every event field it does not carry is written back as a
 * default — which would blank this event's rules, prizes, schedule and FAQ on
 * the way past. This writes one activity and touches nothing else.
 *
 * The bank is the PixelQuizQuest difficulty-choice JSON: 36 easy, 36 medium,
 * 36 hard and 3 impossible, each with A-D options and a correct answer.
 *
 * Mapping, and where it differs from the written rules, is printed on every
 * run — the engine deals a paper per team, it does not let a team pick a tier
 * per slot, so the import has to say so out loud rather than imply a format
 * nobody can actually run.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';

const ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const argv = process.argv.slice(2);
const [eventId, bankFile] = argv.filter((a) => !a.startsWith('--') && !isFlagValue(a));
const ACTIVATE = argv.includes('--activate');
const DRY = argv.includes('--dry');
/** A trial run of the same round: the same bank and deal, but repeatable. */
const RETAKE = argv.includes('--retake');

/** `--title "..."` names a second copy, so a trial does not overwrite the real round. */
function flag(name, fallback) {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}
function isFlagValue(arg) {
    const i = argv.indexOf(arg);
    return i > 0 && argv[i - 1].startsWith('--') && argv[i - 1] !== '--activate'
        && argv[i - 1] !== '--dry' && argv[i - 1] !== '--retake';
}

if (!eventId || !bankFile) {
    console.error('Usage: node scripts/import-difficulty-round.mjs <eventId> <bank.json> [--activate] [--dry] [--retake] [--title "..."]');
    process.exit(1);
}

const env = (key) => {
    if (process.env[key]) return process.env[key];
    const line = fs.readFileSync(path.join(ROOT, '.env'), 'utf8')
        .split(/\r?\n/).find((l) => l.trim().startsWith(`${key}=`));
    return line ? line.slice(line.indexOf('=') + 1).trim() : null;
};

const TITLE = flag('title', 'PIXEL QUIZQUEST — Difficulty Challenge');

/** Slot values, straight from the rulebook's table. */
const POINTS = { easy: 60, medium: 90, hard: 120, impossible: 200 };
const SLOTS = { easy: 5, medium: 5, hard: 5 };
const MINUTES = 20;

const bank = JSON.parse(fs.readFileSync(path.resolve(bankFile), 'utf8'));
const raw = bank.questions ?? [];

// ── Map the bank onto the schema, and refuse anything the grader cannot score ─

const problems = [];
const questions = raw.map((q, i) => {
    const at = `${q.id ?? `question ${i + 1}`}`;
    const options = Object.values(q.options ?? {}).map((o) => String(o));
    const byKey = q.options?.[q.correct_option];
    const correctAnswer = String(q.correct_answer ?? byKey ?? '');
    const difficulty = String(q.difficulty ?? '').toLowerCase();

    if (!q.question) problems.push(`${at}: no question text`);
    if (options.length < 2) problems.push(`${at}: fewer than two options`);
    if (!correctAnswer) problems.push(`${at}: no correct answer`);
    else if (!options.includes(correctAnswer)) {
        problems.push(`${at}: correct answer "${correctAnswer}" is not one of its options`);
    }
    if (new Set(options).size !== options.length) problems.push(`${at}: duplicate options`);
    if (!POINTS[difficulty]) problems.push(`${at}: unknown difficulty "${q.difficulty}"`);

    return {
        _id: new ObjectId(),
        text: String(q.question ?? ''),
        type: 'choice',
        options,
        correctAnswer,
        difficulty,
        // The impossible three are the 16th slot. They are held in the power
        // pool, which is the only pool the paper deals *after* the regular
        // questions are done — exactly when the rules say they appear.
        pool: difficulty === 'impossible' ? 'power' : 'regular',
        points: POINTS[difficulty] ?? 10,
        source: 'pack',
    };
});

if (problems.length) {
    console.error(`\nBank is not importable (${problems.length} problems):\n`);
    for (const p of problems.slice(0, 20)) console.error(`  - ${p}`);
    if (problems.length > 20) console.error(`  ... and ${problems.length - 20} more`);
    process.exit(1);
}

const tally = questions.reduce((acc, q) => ({ ...acc, [q.difficulty]: (acc[q.difficulty] ?? 0) + 1 }), {});
const maxScore = SLOTS.easy * POINTS.easy + SLOTS.medium * POINTS.medium
    + SLOTS.hard * POINTS.hard + POINTS.impossible;

const activity = {
    eventId: new ObjectId(eventId),
    title: TITLE,
    description: `Fifteen questions dealt per team — ${SLOTS.easy} easy, ${SLOTS.medium} medium, ${SLOTS.hard} hard — inside one ${MINUTES}-minute timer, then one impossible question worth ${POINTS.impossible}.`,
    type: 'quiz',
    status: ACTIVATE ? 'active' : 'inactive',
    quiz: {
        quizType: 'preloaded',
        scope: 'team',
        questions,
        timePerQuestion: 60,
        scoring: 'correct_only',
        shuffle: true,
        autoAdvance: true,
        maxParticipants: 500,
        currentQuestion: 0,
        // A trial is worth nothing if a tester can only see it once.
        allowRetake: RETAKE,
        paper: {
            enabled: true,
            counts: SLOTS,
            points: { easy: POINTS.easy, medium: POINTS.medium, hard: POINTS.hard },
            durationMinutes: MINUTES,
            shuffleQuestions: true,
            shuffleOptions: true,
            power: {
                enabled: true,
                count: 1,
                points: POINTS.impossible,
                // The 16th slot is reached by finishing the fifteen inside the
                // same timer, so the cutoff is the whole window.
                cutoffMinutes: MINUTES,
            },
        },
        advancement: { count: 5, targetRoundId: null, confirmed: { keys: [], names: [], at: null, by: null } },
    },
    order: 10,
    activatedAt: ACTIVATE ? new Date() : null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

console.log(`\n${TITLE}`);
console.log(`  bank        ${questions.length} questions — ${JSON.stringify(tally)}`);
console.log(`  dealt       ${SLOTS.easy}E + ${SLOTS.medium}M + ${SLOTS.hard}H = 15 slots, per team, no repeats within a team`);
console.log(`  values      ${POINTS.easy} / ${POINTS.medium} / ${POINTS.hard}, impossible ${POINTS.impossible}`);
console.log(`  timer       ${MINUTES} minutes, one per team`);
console.log(`  max score   ${maxScore}`);
console.log(`  advancement top ${activity.quiz.advancement.count}`);
console.log(`  retakes     ${RETAKE ? 'allowed (trial)' : 'one attempt'}`);
console.log('\n  DIFFERS FROM THE WRITTEN RULES:');
console.log('    - no per-slot difficulty choice: the paper is dealt 5/5/5 rather than');
console.log('      the team picking a tier before each of the 15 slots');
console.log(`    - no negative marking: a wrong answer scores 0, not -30/-60/-90`);
console.log(`    - maximum is ${maxScore}, not 2000 (2000 assumed a team could pick hard 15 times)`);

if (DRY) {
    console.log('\nDRY RUN — nothing written.\n');
    process.exit(0);
}

const client = new MongoClient(env('MONGO_URI'), { serverSelectionTimeoutMS: 10000 });

try {
    await client.connect();
    const db = client.db(env('MONGO_DB_NAME') || 'QUIZ');
    const activities = db.collection('event_activities');

    const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
    if (!event) { console.error(`\nNo event ${eventId}.`); process.exit(1); }

    const existing = await activities.findOne({ eventId: new ObjectId(eventId), title: TITLE });

    let id;
    if (existing) {
        const { createdAt, ...update } = activity;
        await activities.updateOne({ _id: existing._id }, { $set: update });
        id = existing._id;
        console.log(`\nUpdated activity ${id}`);
    } else {
        const res = await activities.insertOne(activity);
        id = res.insertedId;
        console.log(`\nCreated activity ${id}`);
    }

    if (ACTIVATE) {
        // One event runs one thing at a time — the status poll's findOne()
        // assumes it. Whatever was live is marked completed, not deleted, so
        // its submissions stay exactly where they are.
        const stopped = await activities.updateMany(
            { eventId: new ObjectId(eventId), status: 'active', _id: { $ne: id } },
            { $set: { status: 'completed', completedAt: new Date() } },
        );
        console.log(`Activated. Stopped ${stopped.modifiedCount} other running activit${stopped.modifiedCount === 1 ? 'y' : 'ies'}.`);
    }

    console.log(`Event: ${event.title} — ${event.date?.toISOString?.() ?? event.date}\n`);
} catch (err) {
    console.error('FAILED:', err.message);
    process.exitCode = 1;
} finally {
    await client.close();
}

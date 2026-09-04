/**
 * Import an event and its quiz from a JSON file.
 *
 *   node scripts/import-event.mjs scripts/data/technova.json
 *   node scripts/import-event.mjs scripts/data/technova.json --dry
 *
 * Upserts by event title, so editing the JSON and re-running updates the event
 * rather than creating a second copy. The quiz is matched by its own title
 * within that event, for the same reason.
 *
 * Writes plain documents through the driver rather than Mongoose. That is
 * deliberate: it means the script cannot silently drop a field the schema has
 * not caught up with — the failure mode that left the KBC engine writing
 * nothing for a whole release.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';

const ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const file = process.argv[2];
const DRY = process.argv.includes('--dry');

if (!file) {
  console.error('Usage: node scripts/import-event.mjs <file.json> [--dry]');
  process.exit(1);
}

const env = (key) => {
  if (process.env[key]) return process.env[key];
  const line = fs
    .readFileSync(path.join(ROOT, '.env'), 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim() : null;
};

const spec = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
if (!spec.event?.title) {
  console.error('The JSON needs an event.title.');
  process.exit(1);
}

/** Reject a quiz that cannot be graded, before it reaches the database. */
function validateQuiz(quiz) {
  const problems = [];
  const questions = quiz?.questions ?? [];

  if (!questions.length) problems.push('quiz.questions is empty');

  questions.forEach((q, i) => {
    const at = `question ${i + 1}`;
    if (!q.text) problems.push(`${at}: missing text`);
    if (!Array.isArray(q.options) || q.options.length < 2) problems.push(`${at}: needs at least 2 options`);
    if (!q.correctAnswer) problems.push(`${at}: missing correctAnswer`);
    // The grader compares the submitted option to correctAnswer by value, so a
    // correctAnswer that is not one of the options can never be scored right.
    else if (Array.isArray(q.options) && !q.options.includes(q.correctAnswer)) {
      problems.push(`${at}: correctAnswer "${q.correctAnswer}" is not one of the options`);
    }
    if (Array.isArray(q.options) && new Set(q.options).size !== q.options.length) {
      problems.push(`${at}: duplicate options`);
    }
  });

  return problems;
}

const problems = spec.quiz ? validateQuiz(spec.quiz) : [];
if (problems.length) {
  console.error('\nQuiz is not importable:\n');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const client = new MongoClient(env('MONGO_URI'), { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const db = client.db(env('MONGO_DB_NAME') || 'QUIZ');
  const events = db.collection('events');
  const activities = db.collection('event_activities');

  const now = new Date();
  const e = spec.event;

  const eventDoc = {
    title: e.title,
    description: e.description ?? '',
    date: e.date ? new Date(e.date) : now,
    time: e.time ?? 'TBA',
    location: e.location ?? 'TBA',
    imageUrl: e.imageUrl ?? undefined,
    tags: e.tags ?? [],
    onDuty: Boolean(e.onDuty),
    modes: e.modes ?? [],
    organizer: e.organizer ?? undefined,
    eligibility: e.eligibility ?? [],
    rules: e.rules ?? [],
    prizes: e.prizes ?? [],
    schedule: e.schedule ?? [],
    faq: e.faq ?? [],
    registrationClosesAt: e.registrationClosesAt ? new Date(e.registrationClosesAt) : undefined,
    updatedAt: now,
  };

  if (DRY) {
    console.log('\nDRY RUN — nothing written.\n');
    console.log(`Event: ${eventDoc.title}`);
    console.log(`  date      ${eventDoc.date.toISOString()}`);
    console.log(`  venue     ${eventDoc.time} · ${eventDoc.location}`);
    if (spec.quiz) {
      console.log(`Quiz: ${spec.quiz.title}`);
      console.log(`  type      ${spec.quiz.quizType}`);
      console.log(`  questions ${spec.quiz.questions.length}`);
      console.log(`  activate  ${Boolean(spec.quiz.activate)}`);
    }
    process.exit(0);
  }

  const existing = await events.findOne({ title: e.title });
  let eventId;

  if (existing) {
    await events.updateOne({ _id: existing._id }, { $set: eventDoc });
    eventId = existing._id;
    console.log(`Updated event ${eventId} — ${e.title}`);
  } else {
    const res = await events.insertOne({ ...eventDoc, createdAt: now, activeMode: null, modeHistory: [] });
    eventId = res.insertedId;
    console.log(`Created event ${eventId} — ${e.title}`);
  }

  if (spec.quiz) {
    const q = spec.quiz;

    const questions = q.questions.map((question) => ({
      _id: new ObjectId(),
      text: question.text,
      options: question.options,
      correctAnswer: question.correctAnswer,
      points: question.points ?? 10,
      ...(question.imageUrl ? { imageUrl: question.imageUrl } : {}),
    }));

    const activityDoc = {
      eventId,
      title: q.title,
      description: q.description ?? '',
      type: 'quiz',
      quiz: {
        quizType: q.quizType ?? 'rapid_fire',
        questions,
        timePerQuestion: q.timePerQuestion ?? 30,
        scoring: q.scoring ?? 'correct_only',
        shuffle: q.shuffle ?? true,
        autoAdvance: q.autoAdvance ?? true,
        maxParticipants: q.maxParticipants ?? 500,
        currentQuestion: 0,
        phase: 'lobby',
        round: 1,
        fastestFinger: { questionIndex: 0, revealed: false },
        timer: {},
        answerState: { locked: false },
        audiencePoll: { status: 'idle', resultsVisible: false },
        lifelines: { fiftyFifty: true, audiencePoll: true, skip: true, eliminatedOptions: [] },
        results: [],
      },
      updatedAt: now,
    };

    const priorQuiz = await activities.findOne({ eventId, title: q.title });

    if (priorQuiz) {
      await activities.updateOne({ _id: priorQuiz._id }, { $set: activityDoc });
      console.log(`Updated quiz ${priorQuiz._id} — ${q.title} (${questions.length} questions)`);
    } else {
      const res = await activities.insertOne({ ...activityDoc, status: 'inactive', activatedAt: null, createdAt: now });
      console.log(`Created quiz ${res.insertedId} — ${q.title} (${questions.length} questions)`);
    }

    const quizId = priorQuiz?._id ?? (await activities.findOne({ eventId, title: q.title }))._id;

    if (q.activate) {
      // One activity at a time — the status poll returns findOne(), so two
      // active rows would make which one the room sees arbitrary.
      await activities.updateMany(
        { eventId, status: 'active', _id: { $ne: quizId } },
        { $set: { status: 'completed' } },
      );
      await activities.updateOne({ _id: quizId }, { $set: { status: 'active', activatedAt: now } });
      console.log(`Activated quiz ${quizId} — it is now live in the lobby.`);
    }
  }

  console.log('\nDone.');
} catch (err) {
  console.error('\nFAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

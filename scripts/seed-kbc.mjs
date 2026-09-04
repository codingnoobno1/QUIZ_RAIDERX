/**
 * Seed a KBC activity so the live show can be exercised.
 *
 *   node scripts/seed-kbc.mjs <eventId>            # create (or replace) it
 *   node scripts/seed-kbc.mjs <eventId> --remove   # delete it again
 *
 * Idempotent: it removes any previous activity carrying the same marker before
 * inserting, so re-running does not litter the collection. The marker is what
 * makes cleanup safe — it never touches an activity a human created.
 *
 * Question 0 is the fastest-finger qualifier: `correctAnswer` holds the correct
 * ORDER as a comma-separated list, which is what the grader compares against.
 * The rest are ordinary hot-seat questions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';

const ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const MARKER = 'seeded-by:scripts/seed-kbc.mjs';

const eventId = process.argv[2];
const REMOVE = process.argv.includes('--remove');

if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
  console.error('Usage: node scripts/seed-kbc.mjs <eventId> [--remove]');
  process.exit(1);
}

function readEnv(key) {
  if (process.env[key]) return process.env[key];
  const line = fs
    .readFileSync(path.join(ROOT, '.env'), 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim() : null;
}

const questions = [
  {
    _id: new ObjectId(),
    text: 'Arrange these languages from oldest to newest.',
    options: ['Java', 'Python', 'C', 'Rust'],
    // Fastest finger: the correct ORDER, comma separated.
    correctAnswer: 'C,Python,Java,Rust',
    points: 0,
  },
  {
    _id: new ObjectId(),
    text: 'Which protocol is primarily used for secure web communication?',
    options: ['FTP', 'HTTPS', 'SMTP', 'DHCP'],
    correctAnswer: 'HTTPS',
    points: 20,
  },
  {
    _id: new ObjectId(),
    text: 'Which algorithm is commonly used to train neural networks?',
    options: ['Backpropagation', 'Quicksort', 'Dijkstra', 'RSA'],
    correctAnswer: 'Backpropagation',
    points: 40,
  },
  {
    _id: new ObjectId(),
    text: 'What does SQL injection primarily exploit?',
    options: ['Weak passwords', 'Unvalidated input', 'Open ports', 'Expired certificates'],
    correctAnswer: 'Unvalidated input',
    points: 80,
  },
];

const uri = readEnv('MONGO_URI');
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const col = client.db(readEnv('MONGO_DB_NAME') || 'QUIZ').collection('event_activities');

  const removed = await col.deleteMany({ eventId: new ObjectId(eventId), description: MARKER });
  if (removed.deletedCount) console.log(`Removed ${removed.deletedCount} previously seeded activity.`);

  if (REMOVE) {
    console.log('Done (remove only).');
    process.exit(0);
  }

  const now = new Date();
  const doc = {
    eventId: new ObjectId(eventId),
    title: 'TECHNOVA — KBC Test Show',
    description: MARKER,
    type: 'quiz',
    // 'inactive' on purpose: seeding must not start a show. Use the organiser
    // panel, or the e2e script, to start it deliberately.
    status: 'inactive',
    activatedAt: null,
    quiz: {
      quizType: 'kbc',
      questions,
      timePerQuestion: 30,
      scoring: 'correct_only',
      shuffle: false,
      autoAdvance: false,
      maxParticipants: 500,
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
    createdAt: now,
    updatedAt: now,
  };

  const res = await col.insertOne(doc);
  console.log(`\nCreated KBC activity: ${res.insertedId}`);
  console.log(`  event        ${eventId}`);
  console.log(`  questions    ${questions.length} (index 0 is the fastest-finger qualifier)`);
  console.log(`  status       inactive — start it from the organiser panel`);
} catch (err) {
  console.error('FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

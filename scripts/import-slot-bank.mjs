/**
 * Import the slotted Round 2 bank onto Quiz QUEST, and leave it inactive.
 *
 *   node scripts/import-slot-bank.mjs
 *
 * Each team is later dealt one question from every slot. This script does not
 * activate the activity.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';
import { bankShortfalls, dealPaper, paperConfig } from '../src/lib/quiz/paper.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const env = (key) => {
  if (process.env[key]) return process.env[key];
  const line = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/).find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim() : null;
};

const POINTS = { easy: 5, medium: 11, hard: 20 };
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/data/quizquest-round2-slots.json'), 'utf8'));
const letters = ['A', 'B', 'C', 'D'];

if (spec.questions.length !== spec.question_count) {
  throw new Error(`Expected ${spec.question_count} questions, found ${spec.questions.length}.`);
}

const questions = spec.questions.map((q, index) => {
  const options = letters.map((letter) => q.options[letter]);
  if (options.some((option) => !option)) throw new Error(`${q.id} is missing an option.`);
  if (!options.includes(q.correct_answer)) throw new Error(`${q.id} correct answer is not one of the options.`);
  if (q.correct_option && options[letters.indexOf(q.correct_option)] !== q.correct_answer) {
    throw new Error(`${q.id} correct_option does not match correct_answer.`);
  }
  const slot = spec.slots[q.slot];
  if (!slot) throw new Error(`${q.id} names an unknown slot ${q.slot}.`);
  if (!slot.eligible_questions.includes(q.id)) throw new Error(`${q.id} is not listed on ${q.slot}.`);
  if (slot.difficulty.toLowerCase() !== q.difficulty.toLowerCase()) {
    throw new Error(`${q.id} difficulty does not match ${q.slot}.`);
  }
  const difficulty = q.difficulty.toLowerCase();
  return {
    _id: new ObjectId(),
    text: q.question,
    type: 'choice',
    options,
    correctAnswer: q.correct_answer,
    difficulty,
    pool: 'regular',
    slot: q.slot,
    points: POINTS[difficulty],
    sourceId: q.id,
    order: index,
  };
});

for (const [slot, meta] of Object.entries(spec.slots)) {
  const have = questions.filter((q) => q.slot === slot).map((q) => q.sourceId);
  const missing = meta.eligible_questions.filter((id) => !have.includes(id));
  if (missing.length) throw new Error(`${slot} is missing ${missing.join(', ')}.`);
}

const quizForDeal = {
  paper: {
    enabled: true,
    counts: { easy: 8, medium: 10, hard: 7 },
    points: POINTS,
    durationMinutes: 30,
    shuffleQuestions: true,
    shuffleOptions: true,
    power: { enabled: false, count: 0, points: 25, cutoffMinutes: 25 },
  },
  questions,
};
const config = paperConfig(quizForDeal);
const short = bankShortfalls(questions, config.counts, config.power);
if (short.length) throw new Error(`Bank cannot be dealt: ${JSON.stringify(short)}`);

for (const seed of ['team-a', 'team-b']) {
  const dealt = dealPaper({ questions, config, seed });
  if (dealt.items.length !== 25) throw new Error(`${seed} was dealt ${dealt.items.length}, not 25.`);
  const slots = new Set(dealt.items.map((item) => questions.find((q) => String(q._id) === item.questionId).slot));
  if (slots.size !== 25) throw new Error(`${seed} did not cover every slot.`);
}
const again = dealPaper({ questions, config, seed: 'team-a' });
const first = dealPaper({ questions, config, seed: 'team-a' });
if (JSON.stringify(again.items) !== JSON.stringify(first.items)) {
  throw new Error('The same team was dealt two different papers.');
}

const client = new MongoClient(env('MONGO_URI'), { serverSelectionTimeoutMS: 15000 });
await client.connect();
const db = client.db(env('MONGO_DB_NAME') || 'QUIZ');
const event = await db.collection('events').findOne({ title: 'Quiz QUEST' });
if (!event) throw new Error('Quiz QUEST not found.');

const storedQuestions = questions.map(({ sourceId, order, ...question }) => question);
const now = new Date();
const activityDoc = {
  eventId: event._id,
  title: spec.title,
  description: `${spec.description}. ${spec.selection_rule} 30 minutes. Easy 5, medium 11, hard 20.`,
  type: 'quiz',
  quiz: {
    quizType: 'preloaded',
    questions: storedQuestions,
    timePerQuestion: 72,
    roundDurationSeconds: 1800,
    scoring: 'correct_only',
    shuffle: false,
    autoAdvance: false,
    maxParticipants: 500,
    scope: 'team',
    allowRetake: false,
    paper: quizForDeal.paper,
    currentQuestion: 0,
    phase: 'lobby',
    round: 2,
  },
  updatedAt: now,
};

const activities = db.collection('event_activities');
const prior = await activities.findOne({ eventId: event._id, title: spec.title });
if (prior) {
  await activities.updateOne({ _id: prior._id }, { $set: activityDoc });
  console.log(`Updated ${prior._id} — still ${prior.status}, not activated.`);
} else {
  const res = await activities.insertOne({ ...activityDoc, status: 'inactive', activatedAt: null, createdAt: now });
  console.log(`Created ${res.insertedId} — inactive.`);
}

const saved = await activities.findOne({ eventId: event._id, title: spec.title }, { projection: { status: 1, 'quiz.questions.slot': 1, 'quiz.paper': 1 } });
const slots = new Set((saved.quiz?.questions ?? []).map((q) => q.slot));
console.log(`status ${saved.status} | questions ${saved.quiz.questions.length} | slots ${slots.size} | minutes ${saved.quiz.paper.durationMinutes} | power ${saved.quiz.paper.power.enabled}`);
await client.close();

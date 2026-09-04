/**
 * End-to-end test of the KBC live show.
 *
 *   node scripts/test-kbc-e2e.mjs <activityId> [baseUrl]
 *
 * Drives the real HTTP endpoints — no direct writes — and re-reads MongoDB
 * after every command. That combination is the point: a route can return 200
 * while Mongoose silently discards fields the schema does not declare, which is
 * exactly how the engine shipped broken. Asserting the response is not enough;
 * the assertion has to be that the database changed.
 *
 * Tokens are minted here with NEXTAUTH_SECRET, the same way std's console does,
 * so the run exercises the genuine auth path rather than bypassing it.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';

const ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const activityId = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:3000';

if (!activityId) {
  console.error('Usage: node scripts/test-kbc-e2e.mjs <activityId> [baseUrl]');
  process.exit(1);
}

const env = (k) => {
  if (process.env[k]) return process.env[k];
  const line = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/).find((l) => l.trim().startsWith(`${k}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim() : null;
};

const SECRET = env('NEXTAUTH_SECRET');
const b64 = (s) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function token(claims) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify({ iat: now, exp: now + 600, ...claims }));
  const sig = crypto.createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${head}.${body}.${sig}`;
}

const HOST = token({ sub: 'host@test', email: 'host@test', name: 'Test Host', role: 'admin' });
const ALICE = token({ sub: 'alice@test', email: 'alice@test', name: 'Alice' });
const BOB = token({ sub: 'bob@test', email: 'bob@test', name: 'Bob' });

let pass = 0;
let fail = 0;

const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`); }
};

async function call(pathname, { method = 'GET', body, bearer }) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${bearer}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text.slice(0, 120) }; }
  return { status: res.status, data };
}

const cmd = (action, payload = {}) =>
  call('/api/events/live/command', { method: 'POST', body: { activityId, action, payload }, bearer: HOST });

const client = new MongoClient(env('MONGO_URI'), { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const db = client.db(env('MONGO_DB_NAME') || 'QUIZ');
  const acts = db.collection('event_activities');
  const ffs = db.collection('fastest_finger_submissions');
  const polls = db.collection('audience_poll_votes');

  const read = async () => (await acts.findOne({ _id: new ObjectId(activityId) })).quiz;

  const start = await acts.findOne({ _id: new ObjectId(activityId) });
  if (!start) throw new Error('activity not found');
  const eventId = String(start.eventId);
  console.log(`\nActivity ${activityId} on event ${eventId}`);
  console.log(`Base ${BASE}\n`);

  // Clean prior test rows so reruns start honest.
  await ffs.deleteMany({ activityId: new ObjectId(activityId) });
  await polls.deleteMany({ activityId: new ObjectId(activityId) });

  // ── activate ────────────────────────────────────────────────────────────
  console.log('1. Start the activity');
  const started = await call(`/api/events/${eventId}/activities`, {
    method: 'POST', body: { activityId, action: 'start' }, bearer: HOST,
  });
  ok('start returns 200', started.status === 200, JSON.stringify(started.data));
  ok('status is active in DB', (await acts.findOne({ _id: new ObjectId(activityId) })).status === 'active');

  // ── fastest finger ──────────────────────────────────────────────────────
  console.log('\n2. Fastest finger');
  let r = await cmd('OPEN_FASTEST_FINGER', { questionIndex: 0, durationSeconds: 60 });
  ok('OPEN_FASTEST_FINGER accepted', r.status === 200, JSON.stringify(r.data));
  let q = await read();
  ok('phase persisted as fastest_finger', q.phase === 'fastest_finger', `got ${q.phase}`);
  ok('openedAt persisted', Boolean(q.fastestFinger?.openedAt));
  ok('timer persisted', Boolean(q.timer?.endsAt));

  // Alice answers correctly, Bob wrongly.
  const a1 = await call('/api/events/live/answer', {
    method: 'POST', bearer: ALICE,
    body: { activityId, kind: 'fastest_finger', answer: ['C', 'Python', 'Java', 'Rust'] },
  });
  ok('Alice answer accepted', a1.status === 200, JSON.stringify(a1.data));
  ok('server measured elapsedMs', typeof a1.data?.elapsedMs === 'number');

  const dup = await call('/api/events/live/answer', {
    method: 'POST', bearer: ALICE,
    body: { activityId, kind: 'fastest_finger', answer: ['Java', 'C', 'Python', 'Rust'] },
  });
  ok('second attempt refused (409)', dup.status === 409, `got ${dup.status}`);

  await call('/api/events/live/answer', {
    method: 'POST', bearer: BOB,
    body: { activityId, kind: 'fastest_finger', answer: ['Java', 'Python', 'C', 'Rust'] },
  });
  ok('two submissions stored', (await ffs.countDocuments({ activityId: new ObjectId(activityId) })) === 2);

  r = await cmd('CLOSE_FASTEST_FINGER');
  ok('CLOSE_FASTEST_FINGER accepted', r.status === 200, JSON.stringify(r.data));
  q = await read();
  ok('phase is fastest_finger_result', q.phase === 'fastest_finger_result', `got ${q.phase}`);

  const alice = await ffs.findOne({ activityId: new ObjectId(activityId), participantId: 'alice@test' });
  const bob = await ffs.findOne({ activityId: new ObjectId(activityId), participantId: 'bob@test' });
  ok('Alice graded correct', alice?.correct === true);
  ok('Bob graded wrong', bob?.correct === false);

  // Correctness must stay hidden until the host reveals.
  const beforeReveal = await call(
    `/api/flutter/events/status?eventId=${eventId}&participantId=bob@test`, { bearer: BOB },
  );
  const rankBefore = beforeReveal.data?.data?.activeActivity?.quiz?.fastestFinger?.ranking ?? [];
  ok('ranking visible to participants', rankBefore.length === 2, `got ${rankBefore.length}`);
  ok('correctness withheld before reveal', rankBefore.every((x) => x.correct === null));

  r = await cmd('REVEAL_FASTEST_FINGER');
  ok('REVEAL_FASTEST_FINGER accepted', r.status === 200);
  const afterReveal = await call(
    `/api/flutter/events/status?eventId=${eventId}&participantId=bob@test`, { bearer: BOB },
  );
  const rankAfter = afterReveal.data?.data?.activeActivity?.quiz?.fastestFinger?.ranking ?? [];
  ok('correctness exposed after reveal', rankAfter.some((x) => x.correct === true));

  // ── hot seat ────────────────────────────────────────────────────────────
  console.log('\n3. Hot seat');
  r = await cmd('SEAT_CONTESTANT', { participantId: 'alice@test', name: 'Alice', teamName: 'Byte Warriors' });
  ok('SEAT_CONTESTANT accepted', r.status === 200, JSON.stringify(r.data));
  q = await read();
  ok('contestant persisted', q.activeContestant?.participantId === 'alice@test', JSON.stringify(q.activeContestant));
  ok('phase is contestant_intro', q.phase === 'contestant_intro', `got ${q.phase}`);

  r = await cmd('START_HOT_SEAT', { questionIndex: 1, durationSeconds: 45 });
  ok('START_HOT_SEAT accepted', r.status === 200, JSON.stringify(r.data));
  q = await read();
  ok('phase is hot_seat', q.phase === 'hot_seat', `got ${q.phase}`);
  ok('currentQuestion is 1', q.currentQuestion === 1, `got ${q.currentQuestion}`);

  // The answer must not reach the room before the reveal.
  const asAudience = await call(
    `/api/flutter/events/status?eventId=${eventId}&participantId=bob@test`, { bearer: BOB },
  );
  const aq = asAudience.data?.data?.activeActivity?.quiz;
  ok('audience sees the question', Boolean(aq?.question?.text));
  ok('correctAnswer withheld pre-reveal', aq?.question?.correctAnswer === null, JSON.stringify(aq?.question?.correctAnswer));
  ok('audience role is audience', aq?.viewer?.role === 'audience', aq?.viewer?.role);

  const asContestant = await call(
    `/api/flutter/events/status?eventId=${eventId}&participantId=alice@test`, { bearer: ALICE },
  );
  ok('contestant role differs', asContestant.data?.data?.activeActivity?.quiz?.viewer?.isActiveContestant === true);

  // ── audience poll ───────────────────────────────────────────────────────
  console.log('\n4. Audience poll lifeline');
  r = await cmd('OPEN_AUDIENCE_POLL');
  ok('OPEN_AUDIENCE_POLL accepted', r.status === 200, JSON.stringify(r.data));
  q = await read();
  ok('phase is audience_poll', q.phase === 'audience_poll', `got ${q.phase}`);
  ok('lifeline consumed', q.lifelines?.audiencePoll === false);

  const vote = await call('/api/events/live/answer', {
    method: 'POST', bearer: BOB, body: { activityId, kind: 'audience_poll', option: 'HTTPS' },
  });
  ok('audience vote accepted', vote.status === 200, JSON.stringify(vote.data));
  ok('results hidden while open', vote.data?.resultsVisible === false);

  const contestantVote = await call('/api/events/live/answer', {
    method: 'POST', bearer: ALICE, body: { activityId, kind: 'audience_poll', option: 'FTP' },
  });
  ok('contestant cannot vote in own lifeline (403)', contestantVote.status === 403, `got ${contestantVote.status}`);

  const midPoll = await call(
    `/api/flutter/events/status?eventId=${eventId}&participantId=alice@test`, { bearer: ALICE },
  );
  ok('split hidden from contestant while open',
    midPoll.data?.data?.activeActivity?.quiz?.audiencePoll?.results === null);

  r = await cmd('CLOSE_AUDIENCE_POLL');
  ok('CLOSE_AUDIENCE_POLL accepted', r.status === 200);
  const afterPoll = await call(
    `/api/flutter/events/status?eventId=${eventId}&participantId=alice@test`, { bearer: ALICE },
  );
  ok('split revealed after close',
    afterPoll.data?.data?.activeActivity?.quiz?.audiencePoll?.results !== null);

  // ── lock + reveal ───────────────────────────────────────────────────────
  console.log('\n5. Lock and reveal');
  r = await cmd('LOCK_ANSWER', { option: 'HTTPS' });
  ok('LOCK_ANSWER accepted', r.status === 200, JSON.stringify(r.data));
  q = await read();
  ok('lock persisted', q.answerState?.locked === true && q.answerState?.lockedOption === 'HTTPS');

  const relock = await cmd('LOCK_ANSWER', { option: 'FTP' });
  ok('second lock refused (409)', relock.status === 409, `got ${relock.status}`);

  r = await cmd('REVEAL_ANSWER');
  ok('REVEAL_ANSWER accepted', r.status === 200, JSON.stringify(r.data));
  q = await read();
  ok('phase is answer_reveal', q.phase === 'answer_reveal', `got ${q.phase}`);
  ok('result appended', (q.results ?? []).length === 1, `got ${(q.results ?? []).length}`);
  ok('scored correct', q.results?.[0]?.correct === true);
  ok('points awarded', q.results?.[0]?.pointsAwarded === 20, `got ${q.results?.[0]?.pointsAwarded}`);

  const revealed = await call(
    `/api/flutter/events/status?eventId=${eventId}&participantId=bob@test`, { bearer: BOB },
  );
  ok('correctAnswer now exposed',
    revealed.data?.data?.activeActivity?.quiz?.question?.correctAnswer === 'HTTPS');

  // ── illegal transition ──────────────────────────────────────────────────
  console.log('\n6. State machine refuses illegal moves');
  const illegal = await cmd('CLOSE_AUDIENCE_POLL');
  ok('poll close from answer_reveal refused (409)', illegal.status === 409, `got ${illegal.status}`);

  const noAuth = await fetch(`${BASE}/api/events/live/command`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activityId, action: 'REVEAL_ANSWER' }),
  });
  ok('command without admin refused (401)', noAuth.status === 401, `got ${noAuth.status}`);

  // ── leaderboard ─────────────────────────────────────────────────────────
  console.log('\n7. Leaderboard');
  r = await cmd('SHOW_LEADERBOARD');
  ok('SHOW_LEADERBOARD accepted', r.status === 200);
  const board = await call(
    `/api/flutter/events/status?eventId=${eventId}&participantId=bob@test`, { bearer: BOB },
  );
  const rows = board.data?.data?.activeActivity?.quiz?.leaderboard ?? [];
  ok('leaderboard has the contestant', rows.length === 1 && rows[0].score === 20, JSON.stringify(rows));

  console.log(`\n${'='.repeat(46)}`);
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log('='.repeat(46));
  process.exitCode = fail ? 1 : 0;
} catch (err) {
  console.error('\nHARNESS ERROR:', err.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

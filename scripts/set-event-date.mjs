/**
 * Move an event's date.
 *
 *   node scripts/set-event-date.mjs <eventId> <ISO date> [time] [registrationClosesAt]
 *
 * Exists because dates are the one field that goes stale on its own: an event
 * dated in the past reports stage 'ended', which closes registration and hides
 * the lobby regardless of what is actually running.
 */
import fs from 'node:fs';
import { MongoClient, ObjectId } from 'mongodb';

const [id, iso, time, closes] = process.argv.slice(2);
if (!id || !iso) {
  console.error('Usage: node scripts/set-event-date.mjs <eventId> <ISO date> [time] [closesAt]');
  process.exit(1);
}

const env = (k) => {
  const l = fs.readFileSync('.env', 'utf8').split(/\r?\n/).find((x) => x.trim().startsWith(`${k}=`));
  return l ? l.slice(l.indexOf('=') + 1).trim() : null;
};

const when = new Date(iso);
if (Number.isNaN(when.getTime())) { console.error(`"${iso}" is not a date.`); process.exit(1); }

const c = new MongoClient(env('MONGO_URI'), { serverSelectionTimeoutMS: 10000 });
try {
  await c.connect();
  const events = c.db(env('MONGO_DB_NAME') || 'QUIZ').collection('events');
  const set = { date: when, updatedAt: new Date() };
  if (time) set.time = time;
  if (closes) set.registrationClosesAt = new Date(closes);

  const res = await events.updateOne({ _id: new ObjectId(id) }, { $set: set });
  if (!res.matchedCount) { console.error('No event with that id.'); process.exitCode = 1; }
  else {
    const e = await events.findOne({ _id: new ObjectId(id) });
    console.log(`${e.title}`);
    console.log(`  date   ${e.date.toISOString()}  (${when > new Date() ? 'upcoming' : 'past'})`);
    console.log(`  time   ${e.time}`);
    if (e.registrationClosesAt) console.log(`  closes ${e.registrationClosesAt.toISOString()}`);
  }
} catch (err) { console.error('FAILED:', err.message); process.exitCode = 1; }
finally { await c.close(); }

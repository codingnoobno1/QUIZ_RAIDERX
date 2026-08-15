/**
 * Backfill event registration seat claims, then build the unique index.
 *
 *   node scripts/registration-seats.mjs                  # dry run — report only
 *   node scripts/registration-seats.mjs --apply          # write participantEmails
 *   node scripts/registration-seats.mjs --apply --build-index
 *   node scripts/registration-seats.mjs --drop-index     # roll the constraint back
 *
 * Why a script and not schema autoIndex: a unique index cannot be built on a
 * collection that already violates it. Mongoose would attempt the build on first
 * connect, fail in the background, and leave the app running with no constraint
 * while every code path assumes one. This makes the state explicit and reports
 * exactly which registrations overlap before anything is enforced.
 *
 * It never deletes or merges a registration. Where two registrations claim the
 * same person, the earliest keeps the seat and the conflict is printed for a
 * human to settle.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const argv = new Set(process.argv.slice(2));

const APPLY = argv.has('--apply');
const BUILD_INDEX = argv.has('--build-index');
const DROP_INDEX = argv.has('--drop-index');
const FORCE = argv.has('--force');

const INDEX_NAME = 'uniq_event_participant';
const COLLECTION = 'eventregistrations';

function readEnv(key) {
  if (process.env[key]) return process.env[key];
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return null;
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim() : null;
}

const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

/** The leader, plus every member who accepted. Pending/declined hold no seat. */
function seatsFor(reg) {
  const seats = new Set();
  if (norm(reg.email)) seats.add(norm(reg.email));
  for (const m of reg.members ?? []) {
    if (m?.inviteStatus === 'accepted' && norm(m.email)) seats.add(norm(m.email));
  }
  return [...seats];
}

const uri = readEnv('MONGO_URI') || readEnv('MONGODB_URI');
if (!uri) {
  console.error('MONGO_URI not found in environment or .env');
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const db = client.db(readEnv('MONGO_DB_NAME') || 'QUIZ');
  const col = db.collection(COLLECTION);

  if (DROP_INDEX) {
    const existing = await col.indexes();
    if (!existing.some((i) => i.name === INDEX_NAME)) {
      console.log(`Index ${INDEX_NAME} is not present — nothing to drop.`);
    } else {
      await col.dropIndex(INDEX_NAME);
      console.log(`Dropped ${INDEX_NAME}.`);
    }
    process.exit(0);
  }

  const regs = await col.find({}).toArray();
  console.log(`\n${regs.length} registration(s) in ${db.databaseName}.${COLLECTION}\n`);

  // eventId -> email -> the registration that claimed it first
  const claimed = new Map();
  const updates = [];
  const conflicts = [];

  // Oldest first, so the earliest registration wins a contested seat.
  regs.sort((a, b) => String(a._id).localeCompare(String(b._id)));

  for (const reg of regs) {
    const eventKey = String(reg.eventId ?? '');
    if (!claimed.has(eventKey)) claimed.set(eventKey, new Map());
    const perEvent = claimed.get(eventKey);

    const kept = [];
    for (const email of seatsFor(reg)) {
      const holder = perEvent.get(email);
      if (holder) {
        conflicts.push({ eventId: eventKey, email, heldBy: holder, alsoIn: String(reg._id) });
        continue; // earliest keeps it; this one is reported, not silently merged
      }
      perEvent.set(email, String(reg._id));
      kept.push(email);
    }

    const current = Array.isArray(reg.participantEmails) ? reg.participantEmails : null;
    const same = current && current.length === kept.length && current.every((e, i) => e === kept[i]);
    if (!same && kept.length) updates.push({ _id: reg._id, participantEmails: kept });
  }

  console.log(`Seats to write : ${updates.length}`);
  console.log(`Conflicts      : ${conflicts.length}`);

  if (conflicts.length) {
    console.log('\n--- OVERLAPPING REGISTRATIONS (settle these by hand) ---');
    for (const c of conflicts) {
      console.log(`  event ${c.eventId}  ${c.email}`);
      console.log(`      seat kept by ${c.heldBy}, also present in ${c.alsoIn}`);
    }
    console.log(
      '\nThe earliest registration keeps the seat. The later one still exists and\n' +
      'still lists the person — it simply does not hold their claim. Cancel or edit\n' +
      'the duplicate, then re-run.\n',
    );
  }

  if (!APPLY) {
    console.log('\nDRY RUN — nothing was written. Re-run with --apply to write seats.');
    process.exit(0);
  }

  if (updates.length) {
    const res = await col.bulkWrite(
      updates.map((u) => ({
        updateOne: { filter: { _id: u._id }, update: { $set: { participantEmails: u.participantEmails } } },
      })),
      { ordered: false },
    );
    console.log(`\nWrote seats to ${res.modifiedCount} registration(s).`);
  } else {
    console.log('\nNo seat writes needed.');
  }

  if (!BUILD_INDEX) {
    console.log('Skipping index build. Re-run with --build-index once the report is clean.');
    process.exit(0);
  }

  if (conflicts.length && !FORCE) {
    console.log(
      '\nRefusing to build the index while conflicts are unresolved.\n' +
      'The build itself would succeed — only one registration holds each seat — but\n' +
      'the overlap above would stay invisible behind a constraint that looks enforced.\n' +
      'Settle them, or pass --force if you accept that.',
    );
    process.exit(1);
  }

  console.log(`\nBuilding ${INDEX_NAME} …`);
  await col.createIndex(
    { eventId: 1, participantEmails: 1 },
    { unique: true, name: INDEX_NAME },
  );
  console.log('Done. One person, one registration per event is now a database rule.');

  const idx = await col.indexes();
  console.log('\nIndexes now on the collection:');
  for (const i of idx) console.log(`  ${i.name}${i.unique ? '  (unique)' : ''}`);
} catch (err) {
  console.error('\nFAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

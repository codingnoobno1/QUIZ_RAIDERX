/**
 * Restrict an activity to the teams that qualified for it.
 *
 *   node scripts/set-qualified-teams.mjs <activityId> "Team A" "Team B" ... [--dry]
 *
 * Writes an EventRound roster for the named teams and points the activity's
 * `qualificationRoundId` at it. From then on `teamIsQualified()` refuses every
 * other team server-side — a phone can hide a button, but this is what stops an
 * eliminated team opening the round with a crafted request.
 *
 * Names are matched against the event's registrations, trimmed and
 * case-insensitively. If any name does not resolve to exactly one team the
 * script writes nothing: a half-applied roster is worse than none, because the
 * teams it missed are locked out with no obvious reason.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';

const ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const [activityId, ...names] = args.filter((a) => !a.startsWith('--'));

if (!activityId || !names.length) {
    console.error('Usage: node scripts/set-qualified-teams.mjs <activityId> "Team A" "Team B" ... [--dry]');
    process.exit(1);
}

const env = (key) => {
    if (process.env[key]) return process.env[key];
    const line = fs.readFileSync(path.join(ROOT, '.env'), 'utf8')
        .split(/\r?\n/).find((l) => l.trim().startsWith(`${key}=`));
    return line ? line.slice(line.indexOf('=') + 1).trim() : null;
};

const norm = (s) => String(s ?? '').trim().toLowerCase();

const client = new MongoClient(env('MONGO_URI'), { serverSelectionTimeoutMS: 10000 });

try {
    await client.connect();
    const db = client.db(env('MONGO_DB_NAME') || 'QUIZ');

    const activity = await db.collection('event_activities').findOne({ _id: new ObjectId(activityId) });
    if (!activity) { console.error(`No activity ${activityId}.`); process.exit(1); }

    // Mongoose pluralises this one: the model declares no explicit collection.
    const regs = await db.collection('eventregistrations')
        .find({ eventId: activity.eventId, registrationType: 'team' })
        .project({ teamId: 1, teamName: 1, leaderEmail: 1, email: 1 })
        .toArray();

    const byName = new Map();
    for (const r of regs) {
        const key = norm(r.teamName);
        byName.set(key, [...(byName.get(key) ?? []), r]);
    }

    const chosen = [];
    const problems = [];
    for (const name of names) {
        const hits = byName.get(norm(name)) ?? [];
        if (hits.length === 1) chosen.push(hits[0]);
        else if (!hits.length) problems.push(`"${name}" matches no registered team`);
        else problems.push(`"${name}" matches ${hits.length} teams`);
    }

    if (problems.length) {
        console.error('\nNothing written:\n');
        for (const p of problems) console.error(`  - ${p}`);
        console.error('\nRegistered teams:');
        for (const r of regs) console.error(`  - ${r.teamName}`);
        process.exit(1);
    }

    const chosenIds = new Set(chosen.map((t) => t.teamId));
    const excluded = regs.filter((r) => !chosenIds.has(r.teamId));

    console.log(`\n${activity.title}`);
    console.log(`\nQUALIFIED (${chosen.length}):`);
    for (const t of chosen) console.log(`  ✓ ${String(t.teamName).padEnd(22)} ${t.teamId}`);
    console.log(`\nLOCKED OUT (${excluded.length}):`);
    for (const t of excluded) console.log(`  ✗ ${String(t.teamName).padEnd(22)} ${t.teamId}`);

    if (DRY) { console.log('\nDRY RUN — nothing written.\n'); process.exit(0); }

    const rounds = db.collection('event_rounds');
    const title = `${activity.title} — qualified teams`;
    const now = new Date();

    const teams = chosen.map((t) => ({
        teamId: String(t.teamId),
        teamName: String(t.teamName),
        addedAt: now,
        addedBy: 'script',
    }));

    const existing = await rounds.findOne({ eventId: activity.eventId, title });

    let roundId;
    if (existing) {
        await rounds.updateOne({ _id: existing._id }, { $set: { teams, status: 'published', publishedAt: now, updatedAt: now } });
        roundId = existing._id;
        console.log(`\nUpdated roster ${roundId}`);
    } else {
        // The unique index is (eventId, roundNumber), so take the next free one
        // rather than colliding with a placeholder somebody else left behind.
        const highest = await rounds.find({ eventId: activity.eventId }).sort({ roundNumber: -1 }).limit(1).toArray();
        const roundNumber = (highest[0]?.roundNumber ?? 0) + 1;

        const res = await rounds.insertOne({
            eventId: activity.eventId,
            roundNumber,
            title,
            format: 'paper',
            status: 'published',
            teams,
            history: [{ at: now, by: 'script', action: 'created', teamIds: teams.map((t) => t.teamId) }],
            publishedAt: now,
            createdAt: now,
            updatedAt: now,
        });
        roundId = res.insertedId;
        console.log(`\nCreated roster ${roundId} as round #${roundNumber}`);
    }

    await db.collection('event_activities').updateOne(
        { _id: activity._id },
        { $set: { 'quiz.qualificationRoundId': roundId, updatedAt: now } },
    );

    console.log(`Activity ${activity._id} now admits only those ${teams.length} teams.\n`);
} catch (err) {
    console.error('FAILED:', err.message);
    process.exitCode = 1;
} finally {
    await client.close();
}

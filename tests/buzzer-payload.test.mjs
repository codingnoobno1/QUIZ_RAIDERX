import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBuzzerPayload } from '../src/lib/buzzer/viewerPayload.js';

/**
 * The contract the shipped clients read.
 *
 * Both the Flutter app (`lib/models/buzzer_round.dart`) and the web client
 * (`src/models/dto/event.js`) parse this payload key for key, so these tests
 * are as much about the shape as about the rules. The rules they care most
 * about: no answer before the reveal, and no email ever.
 */

const T0 = new Date('2026-09-22T12:00:00.000Z');
const at = (ms) => new Date(T0.getTime() + ms);

const QUESTION = {
    text: 'Who wrote the first algorithm?',
    type: 'choice',
    options: ['Ada Lovelace', 'Grace Hopper'],
    correctAnswer: 'Ada Lovelace',
    points: 20,
};

const quiz = (round, over = {}) => ({
    quizType: 'buzzer',
    buzzer: {
        round: {
            instanceId: 'i1',
            questionIndex: 0,
            phase: 'buzzing',
            answerMode: 'in_app',
            showOptionsBeforeBuzz: true,
            armsAt: at(3000),
            buzzClosesAt: at(13000),
            eligibleTeamIds: ['t1', 't2'],
            lockedOutTeamIds: [],
            attemptedTeamIds: [],
            seat: { teamId: null },
            isTiebreak: false,
            ...round,
        },
        standings: [
            { teamId: 't2', teamName: 'Segfault', score: 20, tiebreakWins: 0, seatMs: 4000 },
            { teamId: 't1', teamName: 'Kernel Panic', score: 40, tiebreakWins: 0, seatMs: 9000 },
        ],
        ...over,
    },
});

const leader = { teamId: 't1', teamName: 'Kernel Panic', leaderName: 'Priya', isLeader: true };
const member = { ...leader, isLeader: false };

const build = (round, extra = {}) => buildBuzzerPayload({
    quiz: quiz(round, extra.buzzer),
    question: QUESTION,
    team: leader,
    now: at(5000),
    viewerEmail: 'priya@example.com',
    ...extra,
});

test('the answer is absent until the host reveals, and present after', () => {
    const live = build({ phase: 'seated', seat: { teamId: 't1' } });
    assert.equal(live.reveal, null);
    assert.equal(JSON.stringify(live).includes('Ada Lovelace'), true); // as an option, not an answer

    const revealed = build(
        { phase: 'revealed' },
        { attempts: [{ teamId: 't1', outcome: 'wrong' }, { teamId: 't2', outcome: 'correct' }] },
    );
    assert.equal(revealed.reveal.correctAnswer, 'Ada Lovelace');
    assert.deepEqual(revealed.reveal.outcomeByTeam, { t1: 'wrong', t2: 'correct' });
});

test('no email reaches a phone, even though the seat is held by an address', () => {
    const payload = build({
        phase: 'seated',
        seat: { teamId: 't2', teamName: 'Segfault', leaderName: 'Dev', leaderEmail: 'dev@example.com' },
    });
    assert.equal(JSON.stringify(payload).includes('@'), false);
    assert.deepEqual(payload.seat, { teamId: 't2', teamName: 'Segfault', leaderName: 'Dev' });
});

test('options stay hidden before the buzz when the host says so, and appear once seated', () => {
    const hidden = build({ showOptionsBeforeBuzz: false });
    assert.equal(hidden.question.options, undefined);

    const seated = build({ showOptionsBeforeBuzz: false, phase: 'seated', seat: { teamId: 't1' } });
    assert.deepEqual(seated.question.options, QUESTION.options);
});

test('the stored question type is translated to one the app can render', () => {
    assert.equal(build({}).question.type, 'mcq');
});

test('instants are serialised with a zone — the client parses them as UTC', () => {
    const payload = build({});
    assert.equal(payload.armsAt, '2026-09-22T12:00:03.000Z');
    assert.equal(payload.buzzClosesAt, '2026-09-22T12:00:13.000Z');
});

test('only the leader is told they may buzz', () => {
    assert.equal(build({}).canBuzz, true);
    assert.equal(build({}, { team: member }).canBuzz, false);
    assert.equal(build({}, { team: member }).amLeader, false);
});

test('an answerer named by the host replaces the leader on that team only', () => {
    const over = { buzzer: { answerers: [{ teamId: 't1', email: 'stand-in@example.com' }] } };

    assert.equal(build({}, over).canBuzz, false); // the leader no longer presses
    assert.equal(
        build({}, { ...over, team: member, viewerEmail: 'stand-in@example.com' }).canBuzz,
        true,
    );
});

test('a team that has already pressed is not offered the button again', () => {
    const payload = build({}, {
        presses: [{ teamId: 't1', receivedAt: at(4000) }],
    });
    assert.equal(payload.canBuzz, false);
});

test('the queue position counts from the team on the floor, and is null for them', () => {
    const presses = [
        { teamId: 't2', receivedAt: at(4000) },
        { teamId: 't1', receivedAt: at(4200) },
    ];

    const behind = build({ phase: 'seated', seat: { teamId: 't2' } }, { presses });
    assert.equal(behind.myQueuePosition, 1);
    assert.equal(behind.mySeat, false);

    const onTheSeat = build({ phase: 'seated', seat: { teamId: 't1' } }, { presses });
    assert.equal(onTheSeat.myQueuePosition, null);
    assert.equal(onTheSeat.mySeat, true);
});

test('a false start is reported to the team it happened to', () => {
    const payload = build({ lockedOutTeamIds: ['t1'] });
    assert.equal(payload.lockedOut, true);
    assert.equal(payload.canBuzz, false);
});

test('the board comes back in ranking order', () => {
    assert.deepEqual(
        build({}).scoreboard.map((r) => r.teamName),
        ['Kernel Panic', 'Segfault'],
    );
});

test('the projector payload carries the race and nothing addressed to a viewer', () => {
    const payload = buildBuzzerPayload({
        quiz: quiz({ phase: 'seated', seat: { teamId: 't2', teamName: 'Segfault' } }),
        question: QUESTION,
        presses: [
            { teamId: 't2', teamName: 'Segfault', offsetMs: 212, falseStart: false },
            { teamId: 't1', teamName: 'Kernel Panic', offsetMs: 340, falseStart: false },
            { teamId: 't3', teamName: 'Null Pointer', offsetMs: -180, falseStart: true },
        ],
        now: at(5000),
        arena: true,
    });

    for (const key of ['myTeam', 'amLeader', 'canBuzz', 'lockedOut', 'mySeat', 'myQueuePosition']) {
        assert.equal(key in payload, false, `${key} must not be on the arena payload`);
    }
    assert.equal(payload.reveal, null);
    // False starts are the console's business, not the projector's.
    assert.deepEqual(payload.presses.map((p) => p.teamName), ['Segfault', 'Kernel Panic']);
    assert.equal(payload.presses[0].offsetMs, 212);
});

test('the derived phase is what the payload reports, not the stored one', () => {
    // Stored `countdown`, but `armsAt` has passed.
    assert.equal(build({ phase: 'countdown' }).phase, 'buzzing');
    // Stored `buzzing`, but the window has closed.
    assert.equal(
        buildBuzzerPayload({ quiz: quiz({}), question: QUESTION, team: leader, now: at(14000) }).phase,
        'no_buzz',
    );
});

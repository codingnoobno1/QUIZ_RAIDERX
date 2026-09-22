import test from 'node:test';
import assert from 'node:assert/strict';
import {
    BUZZER_COMMAND,
    BUZZER_PHASE,
    BUZZ_GRACE_MS,
    applyBuzzerEffects,
    buzzRefusal,
    buzzerPoints,
    buzzerQuestionType,
    buzzerSettings,
    canRunBuzzer,
    effectiveBuzzerPhase,
    gradeBuzzerAnswer,
    remainingTeams,
    seatClaim,
    tiedTeams,
} from '../src/lib/buzzer/machine.js';

const T0 = new Date('2026-09-22T12:00:00.000Z');
const at = (ms) => new Date(T0.getTime() + ms);

const round = (over = {}) => ({
    instanceId: 'i1',
    questionIndex: 0,
    phase: BUZZER_PHASE.COUNTDOWN,
    answerMode: 'in_app',
    showOptionsBeforeBuzz: true,
    armsAt: at(3000),
    buzzClosesAt: at(13000),
    eligibleTeamIds: ['t1', 't2', 't3'],
    lockedOutTeamIds: [],
    attemptedTeamIds: [],
    seat: { teamId: null },
    isTiebreak: false,
    ...over,
});

const quizWith = (r, over = {}) => ({
    quizType: 'buzzer',
    questions: [
        { text: 'Who?', type: 'choice', options: ['A', 'B'], correctAnswer: 'A', points: 20 },
        { text: 'Spell it', type: 'text', correctAnswer: 'Ada Lovelace', acceptedAnswers: ['ada'], points: 10 },
    ],
    buzzer: { round: r, ...over },
});

const team = (teamId) => ({ teamId, teamName: teamId.toUpperCase(), isLeader: true });

// ── Derived phases ───────────────────────────────────────────────────────────
// These have to agree with BuzzerRound.phaseAt() in the Flutter client to the
// millisecond. If they ever drift, the button lights on the phones at a
// different moment from the one the server will accept.

test('the countdown arms exactly at armsAt, not before', () => {
    const r = round();
    assert.equal(effectiveBuzzerPhase(r, at(2999)), BUZZER_PHASE.COUNTDOWN);
    assert.equal(effectiveBuzzerPhase(r, at(3000)), BUZZER_PHASE.BUZZING);
    assert.equal(effectiveBuzzerPhase(r, at(12999)), BUZZER_PHASE.BUZZING);
});

test('an unpressed window becomes no_buzz at buzzClosesAt, with nobody writing anything', () => {
    assert.equal(effectiveBuzzerPhase(round(), at(13000)), BUZZER_PHASE.NO_BUZZ);
    assert.equal(
        effectiveBuzzerPhase(round({ phase: BUZZER_PHASE.BUZZING }), at(13001)),
        BUZZER_PHASE.NO_BUZZ,
    );
});

test('a phase that is not time-derived is returned untouched', () => {
    for (const phase of [BUZZER_PHASE.SEATED, BUZZER_PHASE.JUDGED_WRONG, BUZZER_PHASE.REVEALED]) {
        assert.equal(effectiveBuzzerPhase(round({ phase }), at(99999)), phase);
    }
});

// ── Who may press ────────────────────────────────────────────────────────────

test('a press before the button goes live is a false start', () => {
    const refusal = buzzRefusal({
        round: round(), settings: buzzerSettings({}), team: team('t1'), now: at(2900),
    });
    assert.equal(refusal, 'FALSE_START');
});

test('a press is accepted from armsAt until the window closes, plus the network grace', () => {
    const settings = buzzerSettings({});
    const accept = (ms) => buzzRefusal({ round: round(), settings, team: team('t1'), now: at(ms) });

    assert.equal(accept(3000), null);
    assert.equal(accept(12999), null);
    assert.equal(accept(13000 + BUZZ_GRACE_MS - 1), null);
    assert.equal(accept(13000 + BUZZ_GRACE_MS), 'BUZZ_CLOSED');
});

test('presses are still accepted once a team is seated — they are the queue', () => {
    const r = round({ phase: BUZZER_PHASE.SEATED, seat: { teamId: 't2' } });
    assert.equal(
        buzzRefusal({ round: r, settings: buzzerSettings({}), team: team('t1'), now: at(4000) }),
        null,
    );
});

test('a locked out, ineligible, or already-pressed team is refused by name', () => {
    const settings = buzzerSettings({});
    const now = at(4000);

    assert.equal(
        buzzRefusal({ round: round({ lockedOutTeamIds: ['t1'] }), settings, team: team('t1'), now }),
        'LOCKED_OUT',
    );
    assert.equal(
        buzzRefusal({ round: round(), settings, team: team('t9'), now }),
        'NOT_ELIGIBLE',
    );
    assert.equal(
        buzzRefusal({ round: round({ attemptedTeamIds: ['t1'] }), settings, team: team('t1'), now }),
        'ALREADY_PRESSED',
    );
    assert.equal(
        buzzRefusal({ round: round(), settings, team: team('t1'), now, hasPressed: true }),
        'ALREADY_PRESSED',
    );
    assert.equal(
        buzzRefusal({ round: round(), settings, team: { teamId: null }, now }),
        'NOT_ELIGIBLE',
    );
});

// ── The seat claim ───────────────────────────────────────────────────────────
//
// This models what Mongo does with the filter: applies each update in turn and
// keeps only the ones that still match. It checks the shape of the claim — that
// it cannot match twice — not Mongo's atomicity, which is Mongo's to keep. The
// real proof is a rehearsal with phones in a room.

function applyClaims(claims) {
    const doc = { _id: 'a1', quiz: { buzzer: { round: round({ phase: BUZZER_PHASE.BUZZING }) } } };
    const winners = [];

    for (const { filter, update } of claims) {
        const r = doc.quiz.buzzer.round;
        const matches = filter._id === doc._id
            && filter['quiz.buzzer.round.instanceId'] === r.instanceId
            && filter['quiz.buzzer.round.phase'].$in.includes(r.phase)
            && (r.seat?.teamId ?? null) === filter['quiz.buzzer.round.seat.teamId'];

        if (!matches) continue;
        r.phase = update.$set['quiz.buzzer.round.phase'];
        r.seat = update.$set['quiz.buzzer.round.seat'];
        winners.push(r.seat.teamId);
    }

    return winners;
}

test('only one of several simultaneous presses can take the seat', () => {
    const settings = buzzerSettings({});
    const claims = ['t1', 't2', 't3', 't1'].map((id, i) => seatClaim({
        activityId: 'a1',
        round: round({ phase: BUZZER_PHASE.BUZZING }),
        team: team(id),
        leaderEmail: `${id}@example.com`,
        receivedAt: at(4000 + i),
        settings,
    }));

    assert.deepEqual(applyClaims(claims), ['t1']);
});

test('the claim carries the answer window and the seat it was won at', () => {
    const { update } = seatClaim({
        activityId: 'a1',
        round: round(),
        team: team('t1'),
        leaderEmail: 'priya@example.com',
        receivedAt: at(4000),
        settings: buzzerSettings({}),
    });

    const seat = update.$set['quiz.buzzer.round.seat'];
    assert.equal(seat.attempt, 1);
    assert.equal(seat.leaderEmail, 'priya@example.com');
    assert.deepEqual(seat.seatedAt, at(4000));
    assert.deepEqual(seat.answerEndsAt, at(19000)); // 15s, the default
});

// ── Command legality ─────────────────────────────────────────────────────────

test('a countdown can only be started from a staged question', () => {
    const staged = quizWith(round({ phase: BUZZER_PHASE.STAGED, armsAt: null, buzzClosesAt: null }));
    assert.equal(canRunBuzzer(BUZZER_COMMAND.START_COUNTDOWN, staged, {}, T0).ok, true);

    const lobby = quizWith(round({ phase: BUZZER_PHASE.LOBBY, armsAt: null, buzzClosesAt: null }));
    assert.equal(canRunBuzzer(BUZZER_COMMAND.START_COUNTDOWN, lobby, {}, T0).ok, false);
});

test('a countdown needs somebody to be eligible for it', () => {
    const quiz = quizWith(round({
        phase: BUZZER_PHASE.STAGED, eligibleTeamIds: [], armsAt: null, buzzClosesAt: null,
    }));
    const verdict = canRunBuzzer(BUZZER_COMMAND.START_COUNTDOWN, quiz, {}, T0);
    assert.equal(verdict.ok, false);
    assert.match(verdict.reason, /eligible/i);
});

test('the host can rebuzz or reveal a window that timed out while they were talking', () => {
    // Stored `buzzing`, but `buzzClosesAt` has passed: derived `no_buzz`, and
    // both commands are legal from there without anybody pressing Lock first.
    const quiz = quizWith(round({ phase: BUZZER_PHASE.BUZZING }));
    const now = at(20000);

    assert.equal(canRunBuzzer(BUZZER_COMMAND.REVEAL, quiz, {}, now).ok, true);
    assert.equal(
        canRunBuzzer(BUZZER_COMMAND.REBUZZ, quiz, { remainingTeamIds: ['t2'] }, now).ok,
        true,
    );
});

test('pass needs a team left in the queue, and rebuzz needs a team that has not tried', () => {
    const quiz = quizWith(round({ phase: BUZZER_PHASE.JUDGED_WRONG, seat: { teamId: 't1' } }));

    assert.equal(canRunBuzzer(BUZZER_COMMAND.PASS, quiz, {}, at(20000)).ok, false);
    assert.equal(
        canRunBuzzer(BUZZER_COMMAND.PASS, quiz, { nextTeam: { teamId: 't2' } }, at(20000)).ok,
        true,
    );
    assert.equal(
        canRunBuzzer(BUZZER_COMMAND.REBUZZ, quiz, { remainingTeamIds: [] }, at(20000)).ok,
        false,
    );
});

test('marking a seat nobody holds is refused', () => {
    const quiz = quizWith(round({ phase: BUZZER_PHASE.SEATED, seat: { teamId: null } }));
    assert.equal(canRunBuzzer(BUZZER_COMMAND.MARK_CORRECT, quiz, {}, at(5000)).ok, false);
});

test('an in-app question with no stored answer cannot be staged', () => {
    const quiz = quizWith(round({ phase: BUZZER_PHASE.LOBBY, armsAt: null, buzzClosesAt: null }));
    quiz.questions.push({ text: 'Say it aloud', type: 'text', source: 'spot' });

    const inApp = canRunBuzzer(BUZZER_COMMAND.STAGE_QUESTION, quiz, { questionIndex: 2 }, T0);
    assert.equal(inApp.ok, false);
    assert.match(inApp.reason, /spoken/i);

    const spoken = canRunBuzzer(
        BUZZER_COMMAND.STAGE_QUESTION, quiz, { questionIndex: 2, answerMode: 'spoken' }, T0,
    );
    assert.equal(spoken.ok, true);
});

test('a tie-break needs at least two teams', () => {
    const quiz = quizWith(round({ phase: BUZZER_PHASE.REVEALED }));
    assert.equal(
        canRunBuzzer(BUZZER_COMMAND.START_TIEBREAK, quiz, { teamIds: ['t1'], questionIndex: 0 }, T0).ok,
        false,
    );
    assert.equal(
        canRunBuzzer(BUZZER_COMMAND.START_TIEBREAK, quiz, { teamIds: ['t1', 't2'], questionIndex: 0 }, T0).ok,
        true,
    );
});

// ── Effects ──────────────────────────────────────────────────────────────────

test('staging clears the last question entirely', () => {
    const quiz = quizWith(round({
        phase: BUZZER_PHASE.REVEALED,
        lockedOutTeamIds: ['t3'],
        attemptedTeamIds: ['t1', 't2'],
        seat: { teamId: 't2', attempt: 2 },
    }));

    applyBuzzerEffects({
        command: BUZZER_COMMAND.STAGE_QUESTION,
        payload: { questionIndex: 1, eligibleTeamIds: ['t1', 't2', 't3'] },
        quiz,
        now: T0,
        newInstanceId: 'i2',
    });

    const r = quiz.buzzer.round;
    assert.equal(r.instanceId, 'i2');
    assert.equal(r.questionIndex, 1);
    assert.equal(r.phase, BUZZER_PHASE.STAGED);
    assert.deepEqual(r.lockedOutTeamIds, []);
    assert.deepEqual(r.attemptedTeamIds, []);
    assert.equal(r.seat.teamId, null);
    assert.equal(r.armsAt, null);
    // Kept in step for the readers that predate this round.
    assert.equal(quiz.currentQuestion, 1);
});

test('one press of Start writes the one instant every phone counts down to', () => {
    const quiz = quizWith(round({ phase: BUZZER_PHASE.STAGED, armsAt: null, buzzClosesAt: null }));

    applyBuzzerEffects({ command: BUZZER_COMMAND.START_COUNTDOWN, payload: {}, quiz, now: T0 });

    assert.deepEqual(quiz.buzzer.round.armsAt, at(3000));
    assert.deepEqual(quiz.buzzer.round.buzzClosesAt, at(13000));
});

test('a pass seats the next team with a fresh window and a higher attempt number', () => {
    const quiz = quizWith(round({
        phase: BUZZER_PHASE.JUDGED_WRONG,
        attemptedTeamIds: ['t1'],
        seat: { teamId: 't1', attempt: 1 },
    }));

    applyBuzzerEffects({
        command: BUZZER_COMMAND.PASS,
        payload: { nextTeam: { teamId: 't2', teamName: 'T2', pressedAt: at(4200) } },
        quiz,
        now: at(30000),
    });

    const seat = quiz.buzzer.round.seat;
    assert.equal(seat.teamId, 't2');
    assert.equal(seat.attempt, 2);
    assert.deepEqual(seat.pressedAt, at(4200));   // when they buzzed
    assert.deepEqual(seat.seatedAt, at(30000));   // when they took the floor
    assert.deepEqual(seat.answerEndsAt, at(45000));
});

test('a rebuzz narrows the round to the teams that have not tried, and counts down again', () => {
    const quiz = quizWith(round({
        phase: BUZZER_PHASE.NO_BUZZ,
        eligibleTeamIds: ['t1', 't2', 't3'],
        attemptedTeamIds: ['t1'],
    }));

    applyBuzzerEffects({
        command: BUZZER_COMMAND.REBUZZ,
        payload: { remainingTeamIds: ['t2', 't3'] },
        quiz,
        now: at(60000),
    });

    assert.deepEqual(quiz.buzzer.round.eligibleTeamIds, ['t2', 't3']);
    assert.deepEqual(quiz.buzzer.round.armsAt, at(63000));
    assert.equal(quiz.buzzer.round.seat.teamId, null);
});

test('marking a seat records that the team has had its go', () => {
    const quiz = quizWith(round({ phase: BUZZER_PHASE.SEATED, seat: { teamId: 't1', attempt: 1 } }));

    applyBuzzerEffects({ command: BUZZER_COMMAND.MARK_WRONG, payload: {}, quiz, now: at(9000) });

    assert.deepEqual(quiz.buzzer.round.attemptedTeamIds, ['t1']);
    assert.deepEqual(quiz.buzzer.round.seat.answeredAt, at(9000));
});

test('an inserted question is appended, never spliced into the middle', () => {
    const quiz = quizWith(round({ phase: BUZZER_PHASE.BUZZING }));
    const before = quiz.questions.map((q) => q.text);

    applyBuzzerEffects({
        command: BUZZER_COMMAND.INSERT_QUESTION,
        payload: { question: { text: 'On the spot', type: 'mcq', options: ['x', 'y'], correctAnswer: 'x' } },
        quiz,
        now: T0,
    });

    assert.deepEqual(quiz.questions.slice(0, 2).map((q) => q.text), before);
    assert.equal(quiz.questions.at(-1).text, 'On the spot');
    assert.equal(quiz.questions.at(-1).source, 'spot');
    // Not staged, so the round it interrupted is untouched.
    assert.equal(quiz.buzzer.round.phase, BUZZER_PHASE.BUZZING);
});

test('naming an answerer replaces that team\'s entry rather than stacking another', () => {
    const quiz = quizWith(round(), { answerers: [{ teamId: 't1', email: 'old@example.com' }] });

    applyBuzzerEffects({
        command: BUZZER_COMMAND.SET_ANSWERER,
        payload: { teamId: 't1', email: 'NEW@example.com' },
        quiz,
        now: T0,
    });

    assert.deepEqual(quiz.buzzer.answerers, [{ teamId: 't1', email: 'new@example.com' }]);
});

// ── Grading and scoring ──────────────────────────────────────────────────────

test('a fill-up is graded on the words, not the whitespace or the case', () => {
    const q = { type: 'text', correctAnswer: 'Ada Lovelace', acceptedAnswers: ['ada'] };

    assert.equal(gradeBuzzerAnswer(q, '  ada   LOVELACE '), true);
    assert.equal(gradeBuzzerAnswer(q, 'Ada'), true);
    assert.equal(gradeBuzzerAnswer(q, 'Ada Lovelce'), false);  // the host's to override
    assert.equal(gradeBuzzerAnswer(q, '   '), false);
});

test('a question with nothing to grade against is never automatically correct', () => {
    assert.equal(gradeBuzzerAnswer({ type: 'text', source: 'spot' }, 'anything'), false);
});

test('stored question types map onto the three the app can render', () => {
    assert.equal(buzzerQuestionType({ type: 'choice' }), 'mcq');
    assert.equal(buzzerQuestionType({ type: 'text' }), 'fillup');
    assert.equal(buzzerQuestionType({ type: 'truefalse' }), 'truefalse');
    assert.equal(buzzerQuestionType({}), 'mcq');
});

test('a passed question is worth the same as a first-hand one unless it is set lower', () => {
    const question = { points: 20 };
    const plain = buzzerSettings({});
    const halved = buzzerSettings({ buzzer: { passPoints: 10 } });

    assert.equal(buzzerPoints({ question, settings: plain, attempt: 1, outcome: 'correct' }), 20);
    assert.equal(buzzerPoints({ question, settings: plain, attempt: 3, outcome: 'correct' }), 20);
    assert.equal(buzzerPoints({ question, settings: halved, attempt: 2, outcome: 'correct' }), 10);
    assert.equal(buzzerPoints({ question, settings: halved, attempt: 1, outcome: 'correct' }), 20);
});

test('a wrong answer costs the penalty as a magnitude, whichever sign it was stored with', () => {
    const question = { points: 20 };
    for (const stored of [5, -5]) {
        const settings = buzzerSettings({ buzzer: { wrongPenalty: stored } });
        assert.equal(buzzerPoints({ question, settings, attempt: 1, outcome: 'wrong' }), -5);
        assert.equal(buzzerPoints({ question, settings, attempt: 1, outcome: 'timeout' }), -5);
    }
    // Off by default: a wrong answer simply scores nothing.
    assert.equal(
        buzzerPoints({ question, settings: buzzerSettings({}), attempt: 1, outcome: 'wrong' }),
        0,
    );
});

// ── Who is left, and who is tied ─────────────────────────────────────────────

test('a rebuzz excludes teams that already pressed — their row would collide', () => {
    const r = round({ attemptedTeamIds: ['t1'], lockedOutTeamIds: ['t3'] });
    assert.deepEqual(remainingTeams(r, []), ['t2']);
    assert.deepEqual(remainingTeams(r, ['t2']), []);
});

test('a tie for the win is found, and only the podium widens it', () => {
    const board = [
        { teamId: 'a', teamName: 'A', score: 30, tiebreakWins: 0 },
        { teamId: 'b', teamName: 'B', score: 30, tiebreakWins: 0 },
        { teamId: 'c', teamName: 'C', score: 20, tiebreakWins: 0 },
        { teamId: 'd', teamName: 'D', score: 20, tiebreakWins: 0 },
    ];

    assert.deepEqual(tiedTeams(board, 'first').map((t) => t.teamId), ['a', 'b']);
    assert.deepEqual(tiedTeams(board, 'podium').map((t) => t.teamId), ['a', 'b', 'c', 'd']);
    assert.deepEqual(tiedTeams([{ teamId: 'a', score: 10 }], 'first'), []);
});

test('a sudden-death win breaks a tie without being added to the score', () => {
    const board = [
        { teamId: 'a', teamName: 'A', score: 30, tiebreakWins: 1 },
        { teamId: 'b', teamName: 'B', score: 30, tiebreakWins: 0 },
    ];
    assert.deepEqual(tiedTeams(board, 'first'), []);
});

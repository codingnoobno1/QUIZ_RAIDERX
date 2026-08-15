/**
 * What each viewer is allowed to know.
 *
 * The old status route sent one JSON document to everybody. For a live show
 * that is a correctness bug, not just an untidy one: the audience would receive
 * the contestant's lifeline state, and — because the payload carried
 * `correctAnswer` for local grading — anyone with a network tab would know the
 * answer before the host revealed it.
 *
 * So the payload is derived from (activity, phase, viewer). Three rules hold
 * across every phase:
 *
 *   1. `correctAnswer` is withheld until the phase is `answer_reveal`.
 *   2. Poll results are withheld until the host closes the poll.
 *   3. Fastest-finger correctness is withheld until the host reveals it.
 *
 * Withheld means absent from the response, not hidden by the client.
 */

import { PHASE } from './machine';

/**
 * @param {object} args
 * @param {object} args.quiz            activity.quiz
 * @param {string|null} args.viewerId   verified participant email, or null
 * @param {boolean} args.isHost
 * @param {object} args.counts          { pollVotes, ffSubmissions, audience }
 * @param {object|null} args.myPollVote
 * @param {object|null} args.myFfSubmission
 * @param {Array} args.ranking          ranked fastest-finger rows (may be [])
 */
export function buildKbcPayload({ quiz, viewerId, isHost = false, counts = {}, myPollVote = null, myFfSubmission = null, ranking = [] }) {
  const phase = quiz.phase ?? PHASE.LOBBY;
  const index = quiz.currentQuestion ?? 0;
  const question = quiz.questions?.[index] ?? null;

  const isActiveContestant = Boolean(
    viewerId && quiz.activeContestant?.participantId && quiz.activeContestant.participantId === viewerId,
  );

  const revealed = phase === PHASE.ANSWER_REVEAL;
  const eliminated = quiz.lifelines?.eliminatedOptions ?? [];

  const viewer = {
    role: isHost ? 'host' : isActiveContestant ? 'contestant' : 'audience',
    isActiveContestant,
    // Anyone who is not seated can qualify in the next fastest-finger round.
    isCandidate: Boolean(viewerId) && !isActiveContestant,
    hasAnsweredFastestFinger: Boolean(myFfSubmission),
    hasVotedInPoll: Boolean(myPollVote),
    myPollVote: myPollVote?.option ?? null,
  };

  const payload = {
    quizType: 'kbc',
    phase,
    round: quiz.round ?? 1,
    viewer,

    // Identity of the person on the hot seat is public — that is the whole
    // point of a hot seat.
    activeContestant: quiz.activeContestant?.participantId
      ? {
          participantId: quiz.activeContestant.participantId,
          name: quiz.activeContestant.name ?? '',
          teamName: quiz.activeContestant.teamName ?? '',
        }
      : null,

    // Server clock. Clients count down against endsAt; they never decide what
    // happens when it hits zero.
    timer: quiz.timer?.endsAt
      ? {
          endsAt: quiz.timer.endsAt,
          durationSeconds: quiz.timer.durationSeconds ?? null,
          serverNow: new Date().toISOString(),
        }
      : null,

    totalQuestions: quiz.questions?.length ?? 0,
    questionIndex: index,
    audienceCount: counts.audience ?? 0,
  };

  // ── the question ────────────────────────────────────────────────────────
  if (question && phaseShowsQuestion(phase)) {
    payload.question = {
      index,
      text: question.text,
      // 50:50 removals are applied server-side so every client sees the same
      // two options gone, and a client cannot un-hide them.
      options: (question.options ?? []).filter((o) => !eliminated.includes(o)),
      points: question.points ?? 10,
      // RULE 1.
      correctAnswer: revealed ? question.correctAnswer : null,
    };
  }

  // ── answer state ────────────────────────────────────────────────────────
  // The locked option becomes public once locked — the room watches it happen.
  payload.answerState = {
    locked: Boolean(quiz.answerState?.locked),
    lockedOption: quiz.answerState?.locked ? quiz.answerState.lockedOption : null,
    correct: revealed && quiz.answerState?.lockedOption
      ? quiz.answerState.lockedOption === question?.correctAnswer
      : null,
  };

  // ── lifelines ───────────────────────────────────────────────────────────
  // Availability is public (the audience watches them burn); only the
  // contestant gets them as actionable.
  payload.lifelines = {
    fiftyFifty: Boolean(quiz.lifelines?.fiftyFifty),
    audiencePoll: Boolean(quiz.lifelines?.audiencePoll),
    skip: Boolean(quiz.lifelines?.skip),
    eliminatedOptions: eliminated,
    actionable: isActiveContestant,
  };

  // ── audience poll ───────────────────────────────────────────────────────
  const poll = quiz.audiencePoll ?? {};
  if (poll.status && poll.status !== 'idle') {
    payload.audiencePoll = {
      status: poll.status,
      questionIndex: poll.questionIndex ?? index,
      totalVotes: counts.pollVotes ?? 0,
      // RULE 2 — the split appears only once the host closes the poll.
      results: poll.resultsVisible ? (counts.pollTally ?? {}) : null,
      resultsVisible: Boolean(poll.resultsVisible),
      // An audience member may vote; the contestant watches the count climb.
      canVote: !isActiveContestant && poll.status === 'open' && !viewer.hasVotedInPoll,
    };
  }

  // ── fastest finger ──────────────────────────────────────────────────────
  const ff = quiz.fastestFinger ?? {};
  if (phase === PHASE.FASTEST_FINGER || phase === PHASE.FASTEST_FINGER_RESULT) {
    const ffQuestion = quiz.questions?.[ff.questionIndex ?? 0] ?? null;

    payload.fastestFinger = {
      questionIndex: ff.questionIndex ?? 0,
      open: phase === PHASE.FASTEST_FINGER,
      revealed: Boolean(ff.revealed),
      submissionCount: counts.ffSubmissions ?? 0,
      question: ffQuestion
        ? {
            text: ffQuestion.text,
            options: ffQuestion.options ?? [],
            // RULE 3 — the correct order is part of the reveal.
            correctOrder: ff.revealed ? String(ffQuestion.correctAnswer ?? '').split(/[,>\s]+/).filter(Boolean) : null,
          }
        : null,
      // Times are public (the leaderboard is the drama); correctness is not,
      // because it would let the room deduce the answer before the reveal.
      ranking: ranking.map((r, i) => ({
        rank: i + 1,
        name: r.name,
        teamName: r.teamName,
        elapsedMs: r.elapsedMs,
        locked: true,
        correct: ff.revealed ? r.correct : null,
        isYou: r.participantId === viewerId,
      })),
      mySubmission: myFfSubmission
        ? { elapsedMs: myFfSubmission.elapsedMs, correct: ff.revealed ? myFfSubmission.correct : null }
        : null,
    };
  }

  if (phase === PHASE.LEADERBOARD || phase === PHASE.COMPLETED) {
    payload.leaderboard = aggregateLeaderboard(quiz.results ?? []);
  }

  return payload;
}

/** Phases where the hot-seat question is on screen at all. */
function phaseShowsQuestion(phase) {
  return [PHASE.HOT_SEAT, PHASE.ANSWER_LOCKED, PHASE.AUDIENCE_POLL, PHASE.ANSWER_REVEAL].includes(phase);
}

function aggregateLeaderboard(results) {
  const byPerson = new Map();
  for (const r of results) {
    const key = r.participantId || r.name;
    const row = byPerson.get(key) ?? { participantId: r.participantId, name: r.name, teamName: r.teamName, score: 0, correct: 0, answered: 0 };
    row.score += r.pointsAwarded ?? 0;
    row.correct += r.correct ? 1 : 0;
    row.answered += 1;
    byPerson.set(key, row);
  }
  return [...byPerson.values()].sort((a, b) => b.score - a.score);
}

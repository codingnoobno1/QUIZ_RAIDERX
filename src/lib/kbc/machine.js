/**
 * The KBC show state machine.
 *
 * The server owns the phase. A client may only *request* a command; this module
 * decides whether that command is legal from where the show currently stands.
 * Nothing on a browser — no expired timer, no "everyone answered" — advances
 * the show, because a participant who edits their own client could otherwise
 * reveal an answer or seat themselves.
 *
 * Every transition is host-only. That includes choosing the next contestant:
 * the fastest-finger ranking is a recommendation the host acts on, never an
 * automatic promotion.
 */

export const PHASE = {
  LOBBY: 'lobby',
  FASTEST_FINGER: 'fastest_finger',
  FASTEST_FINGER_RESULT: 'fastest_finger_result',
  CONTESTANT_INTRO: 'contestant_intro',
  HOT_SEAT: 'hot_seat',
  ANSWER_LOCKED: 'answer_locked',
  AUDIENCE_POLL: 'audience_poll',
  ANSWER_REVEAL: 'answer_reveal',
  LEADERBOARD: 'leaderboard',
  COMPLETED: 'completed',
};

export const COMMAND = {
  OPEN_FASTEST_FINGER: 'OPEN_FASTEST_FINGER',
  CLOSE_FASTEST_FINGER: 'CLOSE_FASTEST_FINGER',
  REVEAL_FASTEST_FINGER: 'REVEAL_FASTEST_FINGER',
  SEAT_CONTESTANT: 'SEAT_CONTESTANT',
  START_HOT_SEAT: 'START_HOT_SEAT',
  NEXT_QUESTION: 'NEXT_QUESTION',
  LOCK_ANSWER: 'LOCK_ANSWER',
  OPEN_AUDIENCE_POLL: 'OPEN_AUDIENCE_POLL',
  CLOSE_AUDIENCE_POLL: 'CLOSE_AUDIENCE_POLL',
  USE_FIFTY_FIFTY: 'USE_FIFTY_FIFTY',
  REVEAL_ANSWER: 'REVEAL_ANSWER',
  RETIRE_CONTESTANT: 'RETIRE_CONTESTANT',
  SHOW_LEADERBOARD: 'SHOW_LEADERBOARD',
  END_SHOW: 'END_SHOW',
};

/**
 * Which phases each command may be issued from.
 *
 * A command absent from this table is rejected outright, so adding a phase
 * cannot accidentally widen what is reachable.
 */
const ALLOWED_FROM = {
  [COMMAND.OPEN_FASTEST_FINGER]: [PHASE.LOBBY, PHASE.LEADERBOARD, PHASE.ANSWER_REVEAL, PHASE.FASTEST_FINGER_RESULT],
  [COMMAND.CLOSE_FASTEST_FINGER]: [PHASE.FASTEST_FINGER],
  [COMMAND.REVEAL_FASTEST_FINGER]: [PHASE.FASTEST_FINGER_RESULT],
  [COMMAND.SEAT_CONTESTANT]: [PHASE.FASTEST_FINGER_RESULT, PHASE.LOBBY, PHASE.LEADERBOARD, PHASE.ANSWER_REVEAL],
  [COMMAND.START_HOT_SEAT]: [PHASE.CONTESTANT_INTRO],
  [COMMAND.NEXT_QUESTION]: [PHASE.ANSWER_REVEAL, PHASE.HOT_SEAT],
  [COMMAND.LOCK_ANSWER]: [PHASE.HOT_SEAT, PHASE.AUDIENCE_POLL],
  [COMMAND.OPEN_AUDIENCE_POLL]: [PHASE.HOT_SEAT],
  [COMMAND.CLOSE_AUDIENCE_POLL]: [PHASE.AUDIENCE_POLL],
  [COMMAND.USE_FIFTY_FIFTY]: [PHASE.HOT_SEAT],
  [COMMAND.REVEAL_ANSWER]: [PHASE.HOT_SEAT, PHASE.ANSWER_LOCKED, PHASE.AUDIENCE_POLL],
  [COMMAND.RETIRE_CONTESTANT]: [PHASE.ANSWER_REVEAL, PHASE.HOT_SEAT, PHASE.ANSWER_LOCKED],
  [COMMAND.SHOW_LEADERBOARD]: [PHASE.ANSWER_REVEAL, PHASE.HOT_SEAT, PHASE.LOBBY, PHASE.FASTEST_FINGER_RESULT],
  [COMMAND.END_SHOW]: Object.values(PHASE),
};

/** Where the show lands after a command succeeds. */
const NEXT_PHASE = {
  [COMMAND.OPEN_FASTEST_FINGER]: PHASE.FASTEST_FINGER,
  [COMMAND.CLOSE_FASTEST_FINGER]: PHASE.FASTEST_FINGER_RESULT,
  [COMMAND.REVEAL_FASTEST_FINGER]: PHASE.FASTEST_FINGER_RESULT,
  [COMMAND.SEAT_CONTESTANT]: PHASE.CONTESTANT_INTRO,
  [COMMAND.START_HOT_SEAT]: PHASE.HOT_SEAT,
  [COMMAND.NEXT_QUESTION]: PHASE.HOT_SEAT,
  [COMMAND.LOCK_ANSWER]: PHASE.ANSWER_LOCKED,
  [COMMAND.OPEN_AUDIENCE_POLL]: PHASE.AUDIENCE_POLL,
  [COMMAND.CLOSE_AUDIENCE_POLL]: PHASE.HOT_SEAT,
  [COMMAND.USE_FIFTY_FIFTY]: PHASE.HOT_SEAT,
  [COMMAND.REVEAL_ANSWER]: PHASE.ANSWER_REVEAL,
  [COMMAND.RETIRE_CONTESTANT]: PHASE.LEADERBOARD,
  [COMMAND.SHOW_LEADERBOARD]: PHASE.LEADERBOARD,
  [COMMAND.END_SHOW]: PHASE.COMPLETED,
};

/**
 * Preconditions beyond "is this phase legal" — the ones that depend on show
 * state rather than on the phase name.
 * @returns {string|null} a human reason to refuse, or null to allow.
 */
const GUARDS = {
  [COMMAND.SEAT_CONTESTANT]: (quiz, payload) =>
    payload?.participantId ? null : 'No contestant chosen.',

  [COMMAND.START_HOT_SEAT]: (quiz) =>
    quiz.activeContestant?.participantId ? null : 'Nobody is seated.',

  [COMMAND.OPEN_AUDIENCE_POLL]: (quiz) => {
    if (!quiz.activeContestant?.participantId) return 'Nobody is on the hot seat.';
    if (!quiz.lifelines?.audiencePoll) return 'The audience poll lifeline is already used.';
    return null;
  },

  [COMMAND.USE_FIFTY_FIFTY]: (quiz) => {
    if (!quiz.activeContestant?.participantId) return 'Nobody is on the hot seat.';
    if (!quiz.lifelines?.fiftyFifty) return 'The 50:50 lifeline is already used.';
    return null;
  },

  [COMMAND.LOCK_ANSWER]: (quiz, payload) => {
    if (quiz.answerState?.locked) return 'An answer is already locked.';
    if (!payload?.option) return 'No option supplied.';
    return null;
  },

  [COMMAND.NEXT_QUESTION]: (quiz) => {
    const total = quiz.questions?.length ?? 0;
    return (quiz.currentQuestion ?? 0) + 1 < total ? null : 'That was the last question.';
  },
};

/**
 * @returns {{ ok: true, nextPhase: string } | { ok: false, reason: string }}
 */
export function canRun(command, quiz, payload) {
  const allowed = ALLOWED_FROM[command];
  if (!allowed) return { ok: false, reason: `Unknown command ${command}.` };

  const phase = quiz?.phase ?? PHASE.LOBBY;
  if (!allowed.includes(phase)) {
    return { ok: false, reason: `Cannot ${command} while the show is in "${phase}".` };
  }

  const guard = GUARDS[command];
  const refusal = guard?.(quiz ?? {}, payload);
  if (refusal) return { ok: false, reason: refusal };

  return { ok: true, nextPhase: NEXT_PHASE[command] };
}

/** 50:50 keeps the correct option plus one decoy, chosen deterministically. */
export function fiftyFiftyEliminations(question) {
  const options = question?.options ?? [];
  const wrong = options.filter((o) => o !== question?.correctAnswer);
  // Deterministic so a re-read of the activity yields the same two removals.
  const keep = wrong.length ? wrong[question.text.length % wrong.length] : null;
  return wrong.filter((o) => o !== keep);
}

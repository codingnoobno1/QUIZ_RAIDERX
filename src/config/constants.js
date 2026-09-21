/**
 * Application-wide constants.
 *
 * Ported from the Flutter app's `lib/utils/constants.dart` so web and mobile
 * poll on the same cadence and enforce the same limits. If a number matters in
 * both clients, it belongs here — never inline at the call site.
 */

// ── Network ──────────────────────────────────────────────────────────────────
export const API = {
  TIMEOUT_MS: 30_000,
  MAX_RETRIES: 3,
  /** Backoff between retries. Index = attempt number. */
  RETRY_DELAYS_MS: [1_000, 2_000, 4_000],
};

// ── Live event engine ────────────────────────────────────────────────────────
// Mirrors AppConstants.lobbyRefreshInterval / messagePollingInterval.
export const POLL = {
  /** Lobby "what is live right now" poll. */
  LOBBY_MS: 30_000,
  /** Faster poll once an activity is open (host-paced quizzes advance on this). */
  ACTIVITY_MS: 7_000,
  /** custom_live quizzes follow the host's current question index. */
  LIVE_QUESTION_MS: 5_000,
  /**
   * The qualifier board. An organiser publishes a round's roster a handful of
   * times in a whole evening, so this rides well behind the lobby poll.
   */
  ROUNDS_MS: 60_000,
};

// ── Domain limits ────────────────────────────────────────────────────────────
export const TEAM = {
  /** Leader + members. The register API rejects anything above this. */
  MAX_SIZE: 6,
  get MAX_ADDITIONAL_MEMBERS() {
    return this.MAX_SIZE - 1;
  },
};

export const SESSION = {
  /**
   * The participant's event session.
   *
   * Nothing renews it: `attachEventSession` is called once, at sign-in. So this
   * has to outlast the longest thing a participant can be sitting in one go.
   * At 15 minutes it did not — a team sitting the default 30-minute paper
   * (`quiz.roundDurationSeconds`) was refused at the halfway mark, mid-answer,
   * with no way to save or submit, and the only cure was signing in again and
   * finding the round already over.
   *
   * A sliding session would be better than a long one. It needs the cookie
   * re-issued on every authenticated response, which nothing does today, so the
   * honest fix for now is a window that covers a whole event sitting.
   */
  DURATION_MS: 4 * 60 * 60 * 1000,
};

// ── Layout ───────────────────────────────────────────────────────────────────
export const BREAKPOINT = {
  /** Below this the dashboard is a single-pane stack with a bottom nav. */
  MOBILE_MAX: 767,
  /** At and above this the dashboard becomes list + detail two-pane. */
  DESKTOP_MIN: 1024,
};

export const ACTIVITY_TYPES = ['quiz', 'voting', 'hunt', 'external', 'announcement'];

/**
 * Event repository — the ONLY module that knows event API paths.
 *
 * Ported from `lib/repositories/event_repository.dart`. Components and hooks
 * ask for domain objects; they never build URLs and never see raw JSON.
 */

import { api } from '@/lib/apiClient';
import { POLL } from '@/config/constants';
import {
  toEvent,
  toEvents,
  toRegistrations,
  toInvitations,
  toEventStatus,
  toEventRounds,
  toVoteResults,
} from '@/models/dto/event';

export const eventRepository = {
  /** GET /api/events */
  async getEvents({ signal } = {}) {
    return toEvents(await api.get('/api/events', { signal }));
  },

  /** GET /api/events/:id */
  async getEventById(eventId, { signal } = {}) {
    return toEvent(await api.get(`/api/events/${encodeURIComponent(eventId)}`, { signal }));
  },

  /** GET /api/events/register?email= — every registration belonging to this user. */
  async getMyRegistrations(email, { signal } = {}) {
    if (!email) return [];
    return toRegistrations(
      await api.get(`/api/events/register?email=${encodeURIComponent(email)}`, { signal }),
    );
  },

  /**
   * GET /api/events/invitations — team invites awaiting a response.
   *
   * signOutOn401 is off for every event-portal call. The event portal is not
   * NextAuth, so letting a 401 here call signOut() would tear down the whole
   * app and bounce the participant to /login — which is exactly what happened
   * the moment this endpoint started requiring a session. A 401 means "your
   * event session lapsed"; the panel handles that itself.
   */
  async getInvitations(email, { signal } = {}) {
    if (!email) return [];
    return toInvitations(
      await api.get(`/api/events/invitations?email=${encodeURIComponent(email)}`, {
        signal,
        signOutOn401: false,
      }),
    );
  },

  /**
   * GET /api/events/potential-participants — teammate search.
   *
   * Takes a query now. The endpoint no longer returns the whole student
   * directory, so the picker searches rather than browses.
   */
  async getPotentialTeammates(eventId, query, { signal } = {}) {
    if (!eventId) return [];
    const qs = new URLSearchParams({ eventId });
    if (query) qs.set('q', query);
    const res = await api.get(`/api/events/potential-participants?${qs}`, {
      signal,
      signOutOn401: false,
    });
    return (res?.data ?? []).map((p) => ({
      name: p?.name ?? '',
      email: p?.email ?? '',
      enrollmentNumber: p?.enrollmentNumber ?? '',
      semester: p?.semester ?? '',
    }));
  },

  /** POST /api/events/register */
  async register({ event, user, registrationType, teamName, members }) {
    return api.post('/api/events/register', {
      eventId: event.id,
      registrationType,
      teamName: registrationType === 'team' ? teamName : undefined,
      name: user.name,
      email: user.email,
      enrollmentNumber: user.enrollmentNumber,
      semester: user.semester,
      members: registrationType === 'team' ? members : [],
    });
  },

  /**
   * POST /api/events/invitations
   *
   * No email is sent: the server takes the invitee from the verified session.
   * Passing it was what let anyone answer anyone else's invitation.
   */
  async respondToInvitation({ registrationId, response }) {
    return api.post('/api/events/invitations', { registrationId, response }, { signOutOn401: false });
  },

  /** DELETE /api/events/invitations — leader withdraws an unanswered invite. */
  async withdrawInvitation({ registrationId, email }) {
    const qs = new URLSearchParams({ registrationId, email });
    return api.del(`/api/events/invitations?${qs}`, { signOutOn401: false });
  },

  /** GET /api/events/:id/activities — organiser only. */
  async getActivities(eventId, { signal } = {}) {
    const res = await api.get(`/api/events/${encodeURIComponent(eventId)}/activities`, {
      signal,
      signOutOn401: false,
    });
    return res?.data ?? [];
  },

  /** POST /api/events/:id/activities — start / stop / reset an activity. */
  async switchActivity({ eventId, activityId, action }) {
    return api.post(
      `/api/events/${encodeURIComponent(eventId)}/activities`,
      { activityId, action },
      { signOutOn401: false },
    );
  },

  /** PATCH the organiser-editable quiz configuration. */
  async updateActivity({ activityId, quiz, questionType }) {
    return api.patch('/api/admin/events/activities', {
      id: activityId,
      action: 'update',
      quiz,
      questionType,
    });
  },

  /** GET the organiser's round rosters and the registered-team pool. */
  async getAdminRounds(eventId, { signal } = {}) {
    const res = await api.get(
      `/api/admin/events/rounds?eventId=${encodeURIComponent(eventId)}`,
      { signal, signOutOn401: false },
    );
    return res?.data ?? { rounds: [], teams: [] };
  },

  /** Create a roster for a paper, live or online competition round. */
  async createEventRound(body) {
    return api.post('/api/admin/events/rounds', body, { signOutOn401: false });
  },

  /** Replace a roster or change its publication state. */
  async updateEventRound(body) {
    return api.patch('/api/admin/events/rounds', body, { signOutOn401: false });
  },

  /** Freeze the top-N standings and populate its configured next-round roster. */
  async confirmAdvancement({ activityId, count, replace = false }) {
    return api.post('/api/admin/events/quiz/standings', { activityId, count, replace });
  },

  // ── Live event engine ──────────────────────────────────────────────────────
  // These endpoints were built for the Flutter client and are unchanged here —
  // the web is simply becoming a second consumer of the same contract.

  /**
   * GET /api/flutter/events/status — "what is live right now".
   * Polled; a 401 here must not sign the user out mid-event.
   */
  async getEventStatus({ eventId, participantId, signal }) {
    const qs = new URLSearchParams({ eventId, v: '2' });
    if (participantId) qs.set('participantId', participantId);
    return toEventStatus(
      await api.get(`/api/flutter/events/status?${qs}`, {
        signal,
        signOutOn401: false,
        retries: 1, // another poll is POLL.LOBBY_MS away; don't pile up
      }),
    );
  },

  /**
   * GET /api/flutter/events/rounds — the qualifier board, as published by the
   * organiser. A 401 here must not sign the user out: it sits beside the poll.
   */
  async getEventRounds(eventId, { signal } = {}) {
    return toEventRounds(
      await api.get(`/api/flutter/events/rounds?eventId=${encodeURIComponent(eventId)}`, {
        signal,
        signOutOn401: false,
        retries: 1,
      }),
    );
  },

  /**
   * POST /api/flutter/events/quiz/submit?v=2 — the server grades, from the
   * session's identity, one attempt per entrant. v1 took the participant from
   * this body and kept the best of unlimited retries.
   */
  async submitQuiz({ activityId, participantId, answers, timeTakenSeconds }) {
    return api.post(
      '/api/flutter/events/quiz/submit?v=2',
      { activityId, participantId, answers, timeTakenSeconds },
      { signOutOn401: false, retries: 0 },
    );
  },

  // ── Generated papers (Round 2) ────────────────────────────────────────────

  /** GET — deal or re-open this entrant's paper. Idempotent: the same paper every time. */
  async getPaper({ activityId, signal }) {
    const qs = new URLSearchParams({ activityId });
    return api.get(`/api/flutter/events/quiz/paper?${qs}`, { signal, signOutOn401: false, retries: 1 });
  },

  /** PATCH — save answers as they are chosen. Merges; never replaces. */
  async savePaperAnswers({ activityId, answers }) {
    return api.patch('/api/flutter/events/quiz/paper', { activityId, answers }, { signOutOn401: false });
  },

  /** POST — hand in the current stage (regular, or power). */
  async submitPaper({ activityId }) {
    return api.post('/api/flutter/events/quiz/paper', { activityId }, { signOutOn401: false, retries: 0 });
  },

  // ── Host-paced rounds ─────────────────────────────────────────────────────

  /**
   * POST /api/flutter/events/quiz/answer — one answer to one opened question.
   * Distinct from `submitLiveAnswer`, which is the KBC show's endpoint.
   */
  async submitRoundAnswer({ activityId, instanceId, option }) {
    return api.post(
      '/api/flutter/events/quiz/answer',
      { activityId, instanceId, option },
      { signOutOn401: false, retries: 0 },
    );
  },

  /** GET /api/flutter/events/quiz/submit — restore a previous attempt. */
  async getQuizSubmission({ activityId, participantId, signal }) {
    const qs = new URLSearchParams({ activityId, participantId, v: '2' });
    return api.get(`/api/flutter/events/quiz/submit?${qs}`, { signal, signOutOn401: false });
  },

  /**
   * POST /api/events/live/answer — fastest-finger answer or audience-poll vote.
   *
   * Carries no timestamp and no identity: the server measures elapsed time
   * against its own round clock and takes the participant from the session.
   */
  async submitLiveAnswer({ activityId, ...rest }) {
    return api.post('/api/events/live/answer', { activityId, ...rest }, { signOutOn401: false });
  },

  /** POST /api/events/live/command — host only. */
  async sendLiveCommand({ activityId, action, payload }) {
    return api.post('/api/events/live/command', { activityId, action, payload });
  },

  /** GET the host-only state for a live quiz control strip. */
  async getLiveConsole(activityId, { signal } = {}) {
    const res = await api.get(
      `/api/events/live/command?activityId=${encodeURIComponent(activityId)}`,
      { signal, signOutOn401: false },
    );
    return res?.data ?? null;
  },

  /** POST /api/flutter/events/vote */
  async submitVote({ activityId, participantId, option }) {
    return toVoteResults(
      await api.post('/api/flutter/events/vote', { activityId, participantId, option }),
    );
  },

  /**
   * GET /api/flutter/events/vote — the tally, plus this participant's own
   * choice. Called when a voting activity opens so a returning participant sees
   * what they already picked instead of being offered a vote the server will
   * reject.
   */
  async getVoteResults({ activityId, participantId, signal }) {
    const qs = new URLSearchParams({ activityId });
    if (participantId) qs.set('participantId', participantId);
    return toVoteResults(
      await api.get(`/api/flutter/events/vote?${qs}`, { signal, signOutOn401: false, retries: 1 }),
    );
  },
};

export const POLL_INTERVALS = POLL;

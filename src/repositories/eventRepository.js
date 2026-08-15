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

  /** GET /api/events/invitations?email= — team invites awaiting a response. */
  async getInvitations(email, { signal } = {}) {
    if (!email) return [];
    return toInvitations(
      await api.get(`/api/events/invitations?email=${encodeURIComponent(email)}`, { signal }),
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
    const res = await api.get(`/api/events/potential-participants?${qs}`, { signal });
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
    return api.post('/api/events/invitations', { registrationId, response });
  },

  /** DELETE /api/events/invitations — leader withdraws an unanswered invite. */
  async withdrawInvitation({ registrationId, email }) {
    const qs = new URLSearchParams({ registrationId, email });
    return api.del(`/api/events/invitations?${qs}`);
  },

  // ── Live event engine ──────────────────────────────────────────────────────
  // These endpoints were built for the Flutter client and are unchanged here —
  // the web is simply becoming a second consumer of the same contract.

  /**
   * GET /api/flutter/events/status — "what is live right now".
   * Polled; a 401 here must not sign the user out mid-event.
   */
  async getEventStatus({ eventId, participantId, signal }) {
    const qs = new URLSearchParams({ eventId });
    if (participantId) qs.set('participantId', participantId);
    return toEventStatus(
      await api.get(`/api/flutter/events/status?${qs}`, {
        signal,
        signOutOn401: false,
        retries: 1, // another poll is POLL.LOBBY_MS away; don't pile up
      }),
    );
  },

  /** POST /api/flutter/events/quiz/submit — server grades and keeps the best score. */
  async submitQuiz({ activityId, participantId, answers, timeTakenSeconds }) {
    return api.post('/api/flutter/events/quiz/submit', {
      activityId,
      participantId,
      answers,
      timeTakenSeconds,
    });
  },

  /** GET /api/flutter/events/quiz/submit — restore a previous attempt. */
  async getQuizSubmission({ activityId, participantId, signal }) {
    const qs = new URLSearchParams({ activityId, participantId });
    return api.get(`/api/flutter/events/quiz/submit?${qs}`, { signal, signOutOn401: false });
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

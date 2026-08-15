'use client';

/**
 * Query hooks — the React equivalent of the Flutter app's Riverpod providers
 * (`lib/providers/data_providers.dart`).
 *
 * Each hook returns TanStack's AsyncValue-shaped result, which `<AsyncBoundary>`
 * turns into loading / error / empty / data branches. Components never touch
 * the repository or the API client directly.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventRepository } from '@/repositories/eventRepository';
import { POLL } from '@/config/constants';

export const eventKeys = {
  all: ['events'],
  list: () => [...eventKeys.all, 'list'],
  detail: (id) => [...eventKeys.all, 'detail', id],
  status: (eventId, participantId) => [...eventKeys.all, 'status', eventId, participantId ?? null],
  registrations: (email) => [...eventKeys.all, 'registrations', email ?? null],
  invitations: (email) => [...eventKeys.all, 'invitations', email ?? null],
  teammates: (eventId) => [...eventKeys.all, 'teammates', eventId],
  submission: (activityId, participantId) => [...eventKeys.all, 'submission', activityId, participantId],
  votes: (activityId, participantId) => [...eventKeys.all, 'votes', activityId, participantId ?? null],
};

/** eventsProvider */
export function useEvents() {
  return useQuery({
    queryKey: eventKeys.list(),
    queryFn: ({ signal }) => eventRepository.getEvents({ signal }),
    staleTime: 60_000,
  });
}

/** eventDetailProvider(eventId) */
export function useEvent(eventId) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: ({ signal }) => eventRepository.getEventById(eventId, { signal }),
    enabled: Boolean(eventId),
    staleTime: 60_000,
  });
}

/** myRegistrationsProvider */
export function useMyRegistrations(email) {
  return useQuery({
    queryKey: eventKeys.registrations(email),
    queryFn: ({ signal }) => eventRepository.getMyRegistrations(email, { signal }),
    enabled: Boolean(email),
    staleTime: 30_000,
  });
}

/** Convenience: this user's registration for one event, or null. */
export function useRegistrationFor(email, eventId) {
  const query = useMyRegistrations(email);
  const registration = (query.data ?? []).find((r) => r.eventId === eventId) ?? null;
  return { ...query, registration, isRegistered: Boolean(registration) };
}

export function useInvitations(email) {
  return useQuery({
    queryKey: eventKeys.invitations(email),
    queryFn: ({ signal }) => eventRepository.getInvitations(email, { signal }),
    enabled: Boolean(email),
    staleTime: 30_000,
  });
}

export function usePotentialTeammates(eventId, enabled = true) {
  return useQuery({
    queryKey: eventKeys.teammates(eventId),
    queryFn: ({ signal }) => eventRepository.getPotentialTeammates(eventId, { signal }),
    enabled: Boolean(eventId) && enabled,
    staleTime: 120_000,
  });
}

/**
 * THE ENGINE — the web's LiveEventLobbyScreen.
 *
 * Direct port of `live_event_lobby_screen.dart:86-89`: poll the same endpoint on
 * the same cadence, and let the returned `activeActivity.type` decide what the
 * page renders. The server owns the state machine; this is just the subscriber.
 *
 * @param {string} eventId
 * @param {string} participantId
 * @param {object} [opts]
 * @param {boolean} [opts.fast]  Poll at ACTIVITY_MS instead of LOBBY_MS (used
 *                               inside an open activity, where host-paced
 *                               quizzes advance between renders).
 */
export function useEventStatus(eventId, participantId, { fast = false } = {}) {
  return useQuery({
    queryKey: eventKeys.status(eventId, participantId),
    queryFn: ({ signal }) => eventRepository.getEventStatus({ eventId, participantId, signal }),
    enabled: Boolean(eventId),
    refetchInterval: fast ? POLL.ACTIVITY_MS : POLL.LOBBY_MS,
    refetchIntervalInBackground: false,
    // Keep the last good status on screen while a poll is in flight, so the
    // lobby never flickers back to "loading" every interval.
    placeholderData: (prev) => prev,
    retry: false,
  });
}

/** Restore a prior attempt — quiz_mode_screen.dart:57-85 */
export function useQuizSubmission(activityId, participantId, enabled = true) {
  return useQuery({
    queryKey: eventKeys.submission(activityId, participantId),
    queryFn: ({ signal }) => eventRepository.getQuizSubmission({ activityId, participantId, signal }),
    enabled: Boolean(activityId && participantId) && enabled,
    retry: false,
    staleTime: Infinity,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useRegisterForEvent(email) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.register(vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.registrations(email) });
      qc.invalidateQueries({ queryKey: eventKeys.list() });
    },
  });
}

export function useRespondToInvitation(email) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.respondToInvitation({ ...vars, email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.invitations(email) });
      qc.invalidateQueries({ queryKey: eventKeys.registrations(email) });
    },
  });
}

export function useSubmitQuiz(activityId, participantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.submitQuiz({ activityId, participantId, ...vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.submission(activityId, participantId) });
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

/**
 * The tally for an open poll, and whether this participant already voted.
 *
 * Polled on the activity cadence so a room watching live results sees them
 * move. `staleTime: 0` because a tally is stale the moment someone else votes.
 */
export function useVoteResults(activityId, participantId, { live = true } = {}) {
  return useQuery({
    queryKey: eventKeys.votes(activityId, participantId),
    queryFn: ({ signal }) => eventRepository.getVoteResults({ activityId, participantId, signal }),
    enabled: Boolean(activityId),
    refetchInterval: live ? POLL.ACTIVITY_MS : false,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
    retry: false,
  });
}

export function useSubmitVote(activityId, participantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ option }) => eventRepository.submitVote({ activityId, participantId, option }),
    // Write the returned tally straight into the cache so the bars move on the
    // submitting device immediately rather than at the next poll.
    onSuccess: (result) => {
      qc.setQueryData(eventKeys.votes(activityId, participantId), result);
    },
    onError: () => {
      // A 409 means the vote is already recorded — refetch to find out which
      // option it was, instead of leaving the participant able to keep tapping.
      qc.invalidateQueries({ queryKey: eventKeys.votes(activityId, participantId) });
    },
  });
}

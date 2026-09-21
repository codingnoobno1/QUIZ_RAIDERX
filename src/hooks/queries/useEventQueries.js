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
  teammates: (eventId, q) => [...eventKeys.all, 'teammates', eventId, q ?? ''],
  submission: (activityId, participantId) => [...eventKeys.all, 'submission', activityId, participantId],
  votes: (activityId, participantId) => [...eventKeys.all, 'votes', activityId, participantId ?? null],
  activities: (eventId) => [...eventKeys.all, 'activities', eventId],
  rounds: (eventId) => [...eventKeys.all, 'rounds', eventId],
  adminRounds: (eventId) => [...eventKeys.all, 'admin-rounds', eventId],
  liveConsole: (activityId) => [...eventKeys.all, 'live-console', activityId],
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

/**
 * Teammate search.
 *
 * The endpoint no longer returns every student on the platform, so this only
 * runs once there are at least two characters to search on — which also keeps
 * it from firing a request per keystroke on an empty field.
 */
export function usePotentialTeammates(eventId, query = '', enabled = true) {
  const q = query.trim();
  return useQuery({
    queryKey: eventKeys.teammates(eventId, q),
    queryFn: ({ signal }) => eventRepository.getPotentialTeammates(eventId, q, { signal }),
    enabled: Boolean(eventId) && enabled && q.length >= 2,
    staleTime: 120_000,
    placeholderData: (prev) => prev,
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
    // Inside an activity, poll at the cadence the server asks for — one second
    // while a host-paced question is open. A fixed interval is how two laptops
    // saw the same question seconds apart. Bounded, so a bad value cannot turn
    // this into a hot loop or a stall.
    refetchInterval: (query) => {
      if (!fast) return POLL.LOBBY_MS;
      const asked = query.state.data?.pollAfterMs;
      return asked ? Math.min(Math.max(asked, 750), POLL.ACTIVITY_MS) : POLL.ACTIVITY_MS;
    },
    refetchIntervalInBackground: false,
    // Keep the last good status on screen while a poll is in flight, so the
    // lobby never flickers back to "loading" every interval.
    placeholderData: (prev) => prev,
    retry: false,
  });
}

/**
 * The qualifier board — who is through to each round.
 *
 * Polled far slower than the status: an organiser publishes a roster a handful
 * of times in an evening, and a team that has just been knocked out should not
 * have the list snatched off their screen a second later either.
 */
export function useEventRounds(eventId) {
  return useQuery({
    queryKey: eventKeys.rounds(eventId),
    queryFn: ({ signal }) => eventRepository.getEventRounds(eventId, { signal }),
    enabled: Boolean(eventId),
    refetchInterval: POLL.ROUNDS_MS,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
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
  const refresh = () => {
    qc.invalidateQueries({ queryKey: eventKeys.invitations(email) });
    qc.invalidateQueries({ queryKey: eventKeys.registrations(email) });
  };
  return useMutation({
    mutationFn: (vars) => eventRepository.respondToInvitation(vars),
    onSuccess: refresh,
    // An invitation answered on another device comes back 409. That is settled
    // state, not a failure, so refetch either way and let the list correct
    // itself rather than leaving a stale card the user can keep clicking.
    onError: refresh,
  });
}

/** Leader withdraws an invitation that has not been answered. */
export function useWithdrawInvitation(email) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.withdrawInvitation(vars),
    onSettled: () => qc.invalidateQueries({ queryKey: eventKeys.registrations(email) }),
  });
}

/**
 * The activities of one event. Organiser only — a participant gets a 401 and
 * the manage panel simply does not render for them.
 */
export function useActivities(eventId, enabled = true) {
  return useQuery({
    queryKey: eventKeys.activities(eventId),
    queryFn: ({ signal }) => eventRepository.getActivities(eventId, { signal }),
    enabled: Boolean(eventId) && enabled,
    retry: false,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
  });
}

export function useAdminRounds(eventId, enabled = true) {
  return useQuery({
    queryKey: eventKeys.adminRounds(eventId),
    queryFn: ({ signal }) => eventRepository.getAdminRounds(eventId, { signal }),
    enabled: Boolean(eventId) && enabled,
    retry: false,
    staleTime: 5_000,
  });
}

export function useLiveConsole(activityId, enabled = true) {
  return useQuery({
    queryKey: eventKeys.liveConsole(activityId),
    queryFn: ({ signal }) => eventRepository.getLiveConsole(activityId, { signal }),
    enabled: Boolean(activityId) && enabled,
    retry: false,
    refetchInterval: 1_000,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
  });
}

/** Start / stop / reset. Invalidates the event too, so badges follow at once. */
export function useSwitchActivity(eventId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.switchActivity({ eventId, ...vars }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: eventKeys.activities(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.list() });
    },
  });
}

export function useUpdateActivity(eventId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.updateActivity(vars),
    onSettled: () => qc.invalidateQueries({ queryKey: eventKeys.activities(eventId) }),
  });
}

export function useLiveCommand(activityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, payload }) => eventRepository.sendLiveCommand({ activityId, action, payload }),
    onSettled: () => qc.invalidateQueries({ queryKey: eventKeys.liveConsole(activityId) }),
  });
}

export function useCreateEventRound(eventId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.createEventRound({ eventId, ...vars }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: eventKeys.adminRounds(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.rounds(eventId) });
    },
  });
}

export function useUpdateEventRound(eventId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.updateEventRound(vars),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: eventKeys.adminRounds(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.rounds(eventId) });
    },
  });
}

export function useConfirmAdvancement(eventId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.confirmAdvancement(vars),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: eventKeys.activities(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.adminRounds(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.rounds(eventId) });
    },
  });
}

/** This entrant's generated paper. Refetched rarely: the clock runs locally from `endsAt`. */
export function usePaper(activityId, enabled = true) {
  return useQuery({
    queryKey: [...eventKeys.all, 'paper', activityId ?? null],
    queryFn: ({ signal }) => eventRepository.getPaper({ activityId, signal }),
    enabled: Boolean(activityId) && enabled,
    retry: false,
    refetchOnWindowFocus: true,
    // A reopened tab re-reads the paper, so a deadline that passed while the
    // laptop slept is finalised and shown rather than ticking on stale state.
    refetchInterval: (query) => query.state.data?.data?.pollAfterMs ?? false,
  });
}

export function useSavePaperAnswers(activityId) {
  return useMutation({
    mutationFn: (answers) => eventRepository.savePaperAnswers({ activityId, answers }),
  });
}

export function useSubmitPaper(activityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => eventRepository.submitPaper({ activityId }),
    onSettled: () => qc.invalidateQueries({ queryKey: [...eventKeys.all, 'paper', activityId ?? null] }),
  });
}

/** One answer to a host-opened question. The status poll carries the result. */
export function useRoundAnswer(activityId, eventId, participantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.submitRoundAnswer({ activityId, ...vars }),
    onSettled: () => qc.invalidateQueries({ queryKey: eventKeys.status(eventId, participantId) }),
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

/**
 * Fastest-finger answers and audience-poll votes.
 *
 * On success the status query is invalidated rather than patched: the server
 * decides what the participant may now see, and guessing that locally is how
 * a client ends up showing a phase the show is not in.
 */
export function useLiveAnswer(activityId, eventId, participantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => eventRepository.submitLiveAnswer({ activityId, ...vars }),
    onSettled: () => qc.invalidateQueries({ queryKey: eventKeys.status(eventId, participantId) }),
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

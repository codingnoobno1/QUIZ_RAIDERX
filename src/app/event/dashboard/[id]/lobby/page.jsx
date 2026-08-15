'use client';

/**
 * The live lobby route.
 *
 * Gated on registration, because `participantId` is what the engine keys
 * submissions on — an unregistered visitor has nothing to submit as.
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import useEventUser from '@/hooks/useEventUser';
import { useEvent, useMyRegistrations } from '@/hooks/queries/useEventQueries';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import Loading from '@/components/async/Loading';
import LobbyView from '@/components/events/LobbyView';

export default function LobbyPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, participantId } = useEventUser();

  const eventQuery = useEvent(id);
  const registrationsQuery = useMyRegistrations(user?.email);

  if (registrationsQuery.isPending) return <Loading label="Checking your pass" />;

  const isRegistered = (registrationsQuery.data ?? []).some((r) => r.eventId === id);

  if (!isRegistered) {
    return (
      <EmptyState
        icon={LockOutlinedIcon}
        title="Register to join the lobby"
        message="Live activities are for registered participants. Registration takes a few seconds."
        action={{ label: 'Register now', onClick: () => router.push(`/event/dashboard/${id}/register`) }}
      />
    );
  }

  return (
    <AsyncBoundary
      query={eventQuery}
      loadingLabel="Loading event"
      isEmpty={(e) => !e}
      empty={
        <EmptyState
          icon={EventBusyRoundedIcon}
          title="Event not found"
          action={{ label: 'Back to events', onClick: () => router.push('/event/dashboard') }}
        />
      }
    >
      {(event) => <LobbyView event={event} participantId={participantId} />}
    </AsyncBoundary>
  );
}

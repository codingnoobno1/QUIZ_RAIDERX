'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import useEventUser from '@/hooks/useEventUser';
import { useEvent, useMyRegistrations } from '@/hooks/queries/useEventQueries';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import Loading from '@/components/async/Loading';
import PassCard from '@/components/events/PassCard';

export default function PassPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useEventUser();

  const eventQuery = useEvent(id);
  const registrationsQuery = useMyRegistrations(user?.email);

  if (registrationsQuery.isPending) return <Loading label="Loading your pass" />;

  const registration = (registrationsQuery.data ?? []).find((r) => r.eventId === id);

  if (!registration) {
    return (
      <EmptyState
        icon={ConfirmationNumberRoundedIcon}
        title="No pass for this event"
        message="You haven't registered yet — register and your pass is generated instantly."
        action={{ label: 'Register now', onClick: () => router.push(`/event/dashboard/${id}/register`) }}
      />
    );
  }

  return (
    <AsyncBoundary query={eventQuery} loadingLabel="Loading pass" isEmpty={(e) => !e}>
      {(event) => (
        <PassCard
          event={event}
          registration={registration}
          onEnterLobby={() => router.push(`/event/dashboard/${event.id}/lobby`)}
        />
      )}
    </AsyncBoundary>
  );
}

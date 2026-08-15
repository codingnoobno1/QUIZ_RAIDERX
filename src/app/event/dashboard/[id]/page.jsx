'use client';

/**
 * Event detail route.
 *
 * The page itself is now only wiring — fetch, guard, hand off. Everything
 * visual lives in EventDetailView, which is where the information architecture
 * (hero, lifecycle, sections, sticky action panel) is defined.
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import useEventUser from '@/hooks/useEventUser';
import { useEvent, useRegistrationFor } from '@/hooks/queries/useEventQueries';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import EventDetailView from '@/components/events/detail/EventDetailView';

export default function EventDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useEventUser();

  const eventQuery = useEvent(id);
  const { registration } = useRegistrationFor(user?.email, id);

  return (
    <AsyncBoundary
      query={eventQuery}
      loadingLabel="Loading event"
      isEmpty={(e) => !e}
      empty={
        <EmptyState
          icon={EventBusyRoundedIcon}
          title="Event not found"
          message="It may have been removed by the organiser."
          action={{ label: 'Back to events', onClick: () => router.push('/event/dashboard') }}
        />
      }
    >
      {(event) => (
        <EventDetailView
          event={event}
          registration={registration}
          onNavigate={(sub) => router.push(`/event/dashboard/${id}/${sub}`)}
        />
      )}
    </AsyncBoundary>
  );
}

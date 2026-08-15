'use client';

/**
 * Home — what is happening, for this participant.
 *
 * Ordered by urgency rather than by date: anything live comes first, then the
 * event you are registered for next, then everything else. There is no
 * composer and no like button, because no model stores posts or reactions —
 * the "feed" is the real event list rendered as cards.
 */

import { useRouter } from 'next/navigation';
import { Box, Stack, Typography } from '@mui/material';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import { color } from '@/theme/tokens';
import useEventUser from '@/hooks/useEventUser';
import { useEvents, useInvitations, useMyRegistrations } from '@/hooks/queries/useEventQueries';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import EventPostCard from '@/components/events/EventPostCard';
import InvitationCard from '@/components/events/InvitationCard';
import PageHeading from '@/components/events/shell/PageHeading';

export default function EventHome() {
  const router = useRouter();
  const { user } = useEventUser();

  const eventsQuery = useEvents();
  const { data: registrations = [] } = useMyRegistrations(user?.email);
  const { data: invitations = [] } = useInvitations(user?.email);

  const registeredFor = (id) => registrations.find((r) => r.eventId === id) ?? null;

  return (
    <>
      <PageHeading
        title="Your community"
        subtitle="Events, teams and updates from your campus."
      />

      {/* On narrow screens the rail is hidden, so invitations surface here —
          they are time-sensitive and should not require finding a tab. */}
      {invitations.length > 0 && (
        <Box sx={{ display: { xs: 'block', xl: 'none' }, mb: 2 }}>
          <Typography sx={{ color: color.textFaint, fontSize: '0.68rem', fontWeight: 800, mb: 1 }}>
            INVITATIONS
          </Typography>
          <Stack spacing={1}>
            {invitations.map((inv) => (
              <InvitationCard key={inv.id} invitation={inv} email={user?.email} />
            ))}
          </Stack>
        </Box>
      )}

      <AsyncBoundary
        query={eventsQuery}
        loadingLabel="Loading events"
        empty={
          <EmptyState
            icon={EventBusyRoundedIcon}
            title="No events yet"
            message="When a club publishes an event it appears here."
          />
        }
      >
        {(events) =>
          sortByUrgency(events, registeredFor).map((event) => (
            <EventPostCard key={event.id} event={event} registration={registeredFor(event.id)} />
          ))
        }
      </AsyncBoundary>
    </>
  );
}

/** Live first, then mine, then soonest. Past events sink to the bottom. */
function sortByUrgency(events, registeredFor) {
  const rank = (e) => {
    if (e.isLive) return 0;
    if (registeredFor(e.id) && !e.isPast) return 1;
    if (!e.isPast) return 2;
    return 3;
  };
  return [...events].sort((a, b) => {
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0);
  });
}

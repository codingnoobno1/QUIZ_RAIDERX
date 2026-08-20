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
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
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
        subtitle={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Here is what needs your attention.`}
      />

      <AsyncBoundary query={eventsQuery} loadingLabel="Loading event overview">
        {(events) => (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 1.25, mb: 2.5 }}>
            <StatusCard icon={BoltRoundedIcon} label="Live now" value={events.filter((event) => event.isLive).length} tone={color.green} />
            <StatusCard icon={ConfirmationNumberOutlinedIcon} label="My registrations" value={registrations.length} tone={color.brand} />
            <StatusCard icon={MailOutlineRoundedIcon} label="Pending invites" value={invitations.length} tone={color.violet} />
          </Box>
        )}
      </AsyncBoundary>

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

function StatusCard({ icon: Icon, label, value, tone }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.75, borderRadius: 3, bgcolor: color.surface, border: `1px solid ${color.border}` }}>
      <Box sx={{ width: 40, height: 40, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 2, color: tone, bgcolor: `${tone}18` }}><Icon sx={{ fontSize: 20 }} /></Box>
      <Box><Typography sx={{ color: color.text, fontSize: '1.2rem', lineHeight: 1.1, fontWeight: 850 }}>{value}</Typography><Typography sx={{ color: color.textMuted, mt: .4, fontSize: '.69rem', fontWeight: 650 }}>{label}</Typography></Box>
    </Stack>
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

'use client';

/**
 * Events — everything, filtered by how it relates to you.
 *
 * The tabs are computed from the event's derived stage plus this user's
 * registrations, so each one shows a real count and an empty tab says so
 * rather than rendering an empty column.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stack, Typography } from '@mui/material';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import { color, radius, tint } from '@/theme/tokens';
import useEventUser from '@/hooks/useEventUser';
import { useEvents, useMyRegistrations } from '@/hooks/queries/useEventQueries';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import PageHeading from '@/components/events/shell/PageHeading';
import { DateBlock, Chip } from '@/components/events/shell/RightRail';

const FILTERS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'registered', label: 'Registered', test: (e, reg) => Boolean(reg) },
  { key: 'upcoming', label: 'Upcoming', test: (e) => e.isUpcoming },
  { key: 'live', label: 'Live', test: (e) => e.isLive },
  { key: 'past', label: 'Past', test: (e) => e.isPast },
];

export default function EventsPage() {
  const { user } = useEventUser();
  const eventsQuery = useEvents();
  const { data: registrations = [] } = useMyRegistrations(user?.email);
  const [filter, setFilter] = useState('all');

  const registeredFor = useMemo(
    () => (id) => registrations.find((r) => r.eventId === id) ?? null,
    [registrations],
  );

  const events = eventsQuery.data ?? [];
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.key, events.filter((e) => f.test(e, registeredFor(e.id))).length]),
  );

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const shown = events.filter((e) => active.test(e, registeredFor(e.id)));

  return (
    <>
      <PageHeading title="Events" subtitle="Everything you're registered for, or could join." />

      <Box
        className="pxe-scroll"
        sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', borderBottom: `1px solid ${color.border}`, pb: 1.25, mb: 2 }}
      >
        {FILTERS.map((f) => (
          <Box
            key={f.key}
            component="button"
            type="button"
            onClick={() => setFilter(f.key)}
            sx={{
              flexShrink: 0,
              border: 0,
              font: 'inherit',
              cursor: 'pointer',
              px: 1.4,
              py: 0.9,
              borderRadius: `${radius.sm}px`,
              fontSize: '0.8rem',
              fontWeight: filter === f.key ? 700 : 500,
              color: filter === f.key ? color.text : color.textMuted,
              bgcolor: filter === f.key ? color.surface2 : 'transparent',
              '&:hover': { color: color.text },
            }}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <Box component="span" sx={{ ml: 0.75, color: color.textFaint, fontSize: '0.72rem' }}>
                {counts[f.key]}
              </Box>
            )}
          </Box>
        ))}
      </Box>

      <AsyncBoundary
        query={eventsQuery}
        loadingLabel="Loading events"
        empty={<EmptyState icon={EventBusyRoundedIcon} title="No events yet" />}
      >
        {() =>
          shown.length === 0 ? (
            <EmptyState
              icon={EventBusyRoundedIcon}
              title={`Nothing ${active.label.toLowerCase()}`}
              message="Try another filter."
            />
          ) : (
            shown.map((event) => (
              <EventRow key={event.id} event={event} registration={registeredFor(event.id)} />
            ))
          )
        }
      </AsyncBoundary>
    </>
  );
}

function EventRow({ event, registration }) {
  const router = useRouter();

  return (
    <Box
      onClick={() => router.push(`/event/dashboard/${event.id}`)}
      sx={{
        display: 'grid',
        gridTemplateColumns: '44px minmax(0,1fr) auto',
        gap: 1.75,
        alignItems: 'center',
        p: 1.75,
        mb: 1.25,
        cursor: 'pointer',
        borderRadius: `${radius.lg}px`,
        border: `1px solid ${color.border}`,
        bgcolor: color.surface,
        '&:hover': { borderColor: color.borderStrong, bgcolor: color.surface2 },
      }}
    >
      <DateBlock date={event.date} />

      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography className="pxe-clamp-1" sx={{ color: color.text, fontSize: '0.9rem', fontWeight: 650 }}>
            {event.title}
          </Typography>
          {event.isLive && <Chip tone={color.green}>Live</Chip>}
          {registration && !event.isLive && <Chip tone={color.green}>Registered</Chip>}
        </Stack>
        <Typography className="pxe-clamp-1" sx={{ color: color.textMuted, fontSize: '0.72rem', mt: 0.4 }}>
          {[event.organizer?.name, event.time, event.location]
            .filter(Boolean)
            .join(' · ')}
          {event.participantCount > 0 ? ` · ${event.participantCount} participants` : ''}
        </Typography>
      </Box>

      <Box
        sx={{
          px: 1.5,
          py: 0.8,
          borderRadius: `${radius.sm}px`,
          border: `1px solid ${color.border}`,
          bgcolor: color.surface2,
          color: color.text,
          fontSize: '0.72rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {registration ? 'Open' : event.registrationOpen ? 'Register' : 'View'}
      </Box>
    </Box>
  );
}

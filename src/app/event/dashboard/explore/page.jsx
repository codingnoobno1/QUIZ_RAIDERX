'use client';

/**
 * Explore — search, and browse by interest.
 *
 * The interest tiles are not a fixed taxonomy: they are the distinct tags
 * actually present on events, with real counts. A platform with no tagged
 * events shows no tiles rather than an invented list of categories.
 */

import { useMemo, useState } from 'react';
import { Box, InputBase, Stack, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import { color, radius, tint } from '@/theme/tokens';
import useEventUser from '@/hooks/useEventUser';
import { useEvents, useMyRegistrations } from '@/hooks/queries/useEventQueries';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import EventPostCard from '@/components/events/EventPostCard';
import PageHeading from '@/components/events/shell/PageHeading';

export default function ExplorePage() {
  const { user } = useEventUser();
  const eventsQuery = useEvents();
  const { data: registrations = [] } = useMyRegistrations(user?.email);

  const [q, setQ] = useState('');
  const [tag, setTag] = useState(null);

  const events = eventsQuery.data ?? [];
  const registeredFor = (id) => registrations.find((r) => r.eventId === id) ?? null;

  // Real tag counts, derived from the events themselves.
  const interests = useMemo(() => {
    const counts = new Map();
    for (const e of events) {
      for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [events]);

  const term = q.trim().toLowerCase();
  const shown = events.filter((e) => {
    if (tag && !e.tags.includes(tag)) return false;
    if (!term) return true;
    return (
      e.title.toLowerCase().includes(term) ||
      e.description.toLowerCase().includes(term) ||
      e.location.toLowerCase().includes(term) ||
      e.tags.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <>
      <PageHeading title="Explore" subtitle="Find events happening across campus." />

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          px: 2,
          py: 1.4,
          mb: 2,
          borderRadius: `${radius.md}px`,
          border: `1px solid ${color.border}`,
          bgcolor: color.surface,
          '&:focus-within': { borderColor: tint(color.brand, 0.5) },
        }}
      >
        <SearchRoundedIcon sx={{ fontSize: 19, color: color.textFaint }} />
        <InputBase
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events by name, venue or topic"
          sx={{ flex: 1, color: color.text, fontSize: '0.88rem' }}
        />
      </Stack>

      {interests.length > 0 && (
        <>
          <Typography sx={{ color: color.text, fontSize: '1rem', fontWeight: 650, mb: 0.5 }}>
            Browse by interest
          </Typography>
          <Typography sx={{ color: color.textMuted, fontSize: '0.75rem', mb: 1.5 }}>
            Topics organisers are actually running events on.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 1.25,
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              mb: 3,
            }}
          >
            {interests.map(([name, count]) => {
              const on = tag === name;
              return (
                <Box
                  key={name}
                  component="button"
                  type="button"
                  onClick={() => setTag(on ? null : name)}
                  sx={{
                    border: `1px solid ${on ? tint(color.brand, 0.5) : color.border}`,
                    bgcolor: on ? tint(color.brand, 0.08) : color.surface,
                    borderRadius: `${radius.lg}px`,
                    p: 2,
                    textAlign: 'left',
                    cursor: 'pointer',
                    font: 'inherit',
                    '&:hover': { borderColor: color.borderStrong },
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: `${radius.sm}px`,
                      bgcolor: tint(color.brand, 0.1),
                      color: color.brand,
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      mb: 1.5,
                    }}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </Box>
                  <Typography className="pxe-clamp-1" sx={{ color: color.text, fontSize: '0.78rem', fontWeight: 650 }}>
                    {name}
                  </Typography>
                  <Typography sx={{ color: color.textFaint, fontSize: '0.66rem' }}>
                    {count} {count === 1 ? 'event' : 'events'}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </>
      )}

      <Typography sx={{ color: color.text, fontSize: '1rem', fontWeight: 650, mb: 1.5 }}>
        {tag ? `Tagged “${tag}”` : term ? 'Results' : 'All events'}
      </Typography>

      <AsyncBoundary
        query={eventsQuery}
        loadingLabel="Loading events"
        empty={<EmptyState icon={EventBusyRoundedIcon} title="No events yet" />}
      >
        {() =>
          shown.length === 0 ? (
            <EmptyState
              icon={EventBusyRoundedIcon}
              title="Nothing matches"
              message="Try a different search or clear the filter."
              action={{ label: 'Clear', onClick: () => { setQ(''); setTag(null); } }}
            />
          ) : (
            shown.map((event) => (
              <EventPostCard key={event.id} event={event} registration={registeredFor(event.id)} />
            ))
          )
        }
      </AsyncBoundary>
    </>
  );
}

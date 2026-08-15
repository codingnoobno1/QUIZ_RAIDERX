'use client';

/**
 * The event list — shared by the desktop sidebar and the mobile index screen,
 * so the two breakpoints can never drift apart.
 *
 * Search and filtering are client-side over the already-fetched list, matching
 * `event_list_screen.dart:71-95`.
 */

import { useMemo, useState } from 'react';
import { Box, InputAdornment, Stack, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import { color, radius } from '@/theme/tokens';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import { useEvents, useMyRegistrations } from '@/hooks/queries/useEventQueries';
import EventCard from './EventCard';
import InvitationsPanel from './InvitationsPanel';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'mine', label: 'Mine' },
];

export default function EventListPane({ user, selectedId, onSelect, showInvitations = true }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const eventsQuery = useEvents();
  const { data: registrations = [] } = useMyRegistrations(user?.email);

  const registeredIds = useMemo(
    () => new Set(registrations.map((r) => r.eventId)),
    [registrations],
  );

  const visible = useMemo(() => {
    const all = eventsQuery.data ?? [];
    const q = search.trim().toLowerCase();

    return all
      .filter((e) => {
        if (q && !`${e.title} ${e.description} ${e.location}`.toLowerCase().includes(q)) return false;
        if (filter === 'live') return e.isLive;
        if (filter === 'upcoming') return e.isUpcoming;
        if (filter === 'mine') return registeredIds.has(e.id);
        return true;
      })
      .sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1; // live first
        return (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity);
      });
  }, [eventsQuery.data, search, filter, registeredIds]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ px: 2, pt: 2, pb: 1.5, flexShrink: 0 }}>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events"
          inputProps={{ 'aria-label': 'Search events', enterKeyHint: 'search' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: color.textFaint }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.03)',
              color: color.text,
              borderRadius: `${radius.md}px`,
              minHeight: 44,
              '& fieldset': { borderColor: color.border },
              '&.Mui-focused fieldset': { borderColor: color.brand },
            },
          }}
        />

        <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5 }} className="pxe-scroll">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <Box
                key={f.id}
                component="button"
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                sx={{
                  flexShrink: 0,
                  px: 1.5,
                  py: 0.75,
                  minHeight: 34,
                  font: 'inherit',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: `${radius.pill}px`,
                  color: active ? color.bg : color.textMuted,
                  bgcolor: active ? color.brand : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? color.brand : color.border}`,
                  '&:focus-visible': { outline: `2px solid ${color.brand}`, outlineOffset: 2 },
                }}
              >
                {f.label}
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Box className="pxe-scroll" sx={{ flex: 1, minHeight: 0, px: 2, pb: 2 }}>
        {showInvitations && <InvitationsPanel user={user} />}

        <AsyncBoundary
          query={eventsQuery}
          loadingLabel="Loading events"
          empty={
            <EmptyState
              icon={EventBusyRoundedIcon}
              title="No events yet"
              message="When the club publishes an event it shows up here."
              compact
            />
          }
        >
          {() =>
            visible.length === 0 ? (
              <EmptyState
                icon={EventBusyRoundedIcon}
                title="Nothing matches"
                message={search ? `No event matches “${search}”.` : 'Try a different filter.'}
                action={{ label: 'Clear filters', onClick: () => { setSearch(''); setFilter('all'); } }}
                compact
              />
            ) : (
              <Stack spacing={1.25}>
                {visible.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={registeredIds.has(event.id)}
                    selected={selectedId === event.id}
                    onClick={() => onSelect(event)}
                  />
                ))}
              </Stack>
            )
          }
        </AsyncBoundary>
      </Box>
    </Box>
  );
}

'use client';

/**
 * Dashboard index.
 *
 * Mobile: the list is the screen.
 * Desktop: the list already lives in the sidebar, so this pane shows the
 * at-a-glance summary and a prompt to pick something.
 */

import { useRouter } from 'next/navigation';
import { Box, Stack, Typography } from '@mui/material';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import { color, radius, tint } from '@/theme/tokens';
import { BREAKPOINT } from '@/config/constants';
import useEventUser from '@/hooks/useEventUser';
import EventListPane from '@/components/events/EventListPane';
import { useEvents, useMyRegistrations, useInvitations } from '@/hooks/queries/useEventQueries';

const DESKTOP = `@media (min-width:${BREAKPOINT.DESKTOP_MIN}px)`;
const MOBILE = `@media (max-width:${BREAKPOINT.DESKTOP_MIN - 1}px)`;

export default function EventDashboardIndex() {
  const router = useRouter();
  const { user } = useEventUser();

  const { data: events = [] } = useEvents();
  const { data: registrations = [] } = useMyRegistrations(user?.email);
  const { data: invitations = [] } = useInvitations(user?.email);

  if (!user) return null; // the layout is already showing its loading state

  const stats = [
    { label: 'Available', value: events.length, tone: color.brand },
    { label: 'Live now', value: events.filter((e) => e.isLive).length, tone: color.green },
    { label: 'Registered', value: registrations.length, tone: color.violet },
    { label: 'Invites', value: invitations.length, tone: color.amber },
  ];

  return (
    <>
      {/* Mobile: the list itself */}
      <Box sx={{ height: '100%', [DESKTOP]: { display: 'none' } }}>
        <StatStrip stats={stats} />
        <EventListPane
          user={user}
          onSelect={(event) => router.push(`/event/dashboard/${event.id}`)}
        />
      </Box>

      {/* Desktop: summary + pick prompt (list is the sidebar) */}
      <Box sx={{ display: 'none', [DESKTOP]: { display: 'block', p: 4 } }}>
        <Typography sx={{ color: color.text, fontWeight: 800, fontSize: '1.35rem' }}>
          Welcome back, {user.name?.split(' ')[0]}
        </Typography>
        <Typography sx={{ color: color.textMuted, mt: 0.5 }}>
          Pick an event from the list to register, view your pass, or join the live lobby.
        </Typography>

        <Box
          sx={{
            mt: 3,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            maxWidth: 760,
          }}
        >
          {stats.map((s) => (
            <Box
              key={s.label}
              sx={{
                p: 2.5,
                borderRadius: `${radius.lg}px`,
                bgcolor: tint(s.tone, 0.06),
                border: `1px solid ${tint(s.tone, 0.22)}`,
              }}
            >
              <Typography sx={{ color: s.tone, fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>
                {s.value}
              </Typography>
              <Typography sx={{ color: color.textMuted, fontSize: '0.78rem', fontWeight: 600, mt: 0.5 }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            mt: 4,
            p: 2.5,
            maxWidth: 760,
            borderRadius: `${radius.lg}px`,
            border: `1px dashed ${color.border}`,
            color: color.textFaint,
          }}
        >
          <TouchAppRoundedIcon />
          <Typography sx={{ fontSize: '0.88rem' }}>Select an event on the left to continue.</Typography>
        </Stack>
      </Box>
    </>
  );
}

function StatStrip({ stats }) {
  return (
    <Box
      className="pxe-scroll"
      sx={{
        display: 'flex',
        gap: 1,
        px: 2,
        pt: 2,
        overflowX: 'auto',
        [`${MOBILE}`]: { scrollSnapType: 'x proximity' },
      }}
    >
      {stats.map((s) => (
        <Box
          key={s.label}
          sx={{
            flex: '0 0 auto',
            minWidth: 92,
            px: 1.75,
            py: 1.25,
            scrollSnapAlign: 'start',
            borderRadius: `${radius.md}px`,
            bgcolor: tint(s.tone, 0.07),
            border: `1px solid ${tint(s.tone, 0.22)}`,
          }}
        >
          <Typography sx={{ color: s.tone, fontWeight: 900, fontSize: '1.3rem', lineHeight: 1 }}>
            {s.value}
          </Typography>
          <Typography sx={{ color: color.textMuted, fontSize: '0.68rem', fontWeight: 600, mt: 0.25 }}>
            {s.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

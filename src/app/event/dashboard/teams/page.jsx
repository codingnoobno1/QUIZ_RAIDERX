'use client';

/**
 * Teams — the groups you are in, from your own registrations.
 *
 * A "team" here is a team registration, which is the only thing the data model
 * has. There is no team chat or team activity feed because nothing stores
 * either; what is real is the roster and each member's invite state.
 */

import { useRouter } from 'next/navigation';
import { Box, Stack, Typography } from '@mui/material';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import { color, radius, tint } from '@/theme/tokens';
import useEventUser from '@/hooks/useEventUser';
import { useEvents, useMyRegistrations } from '@/hooks/queries/useEventQueries';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import PageHeading from '@/components/events/shell/PageHeading';
import { Chip } from '@/components/events/shell/RightRail';

export default function TeamsPage() {
  const router = useRouter();
  const { user } = useEventUser();

  const registrationsQuery = useMyRegistrations(user?.email);
  const { data: events = [] } = useEvents();

  const teams = (registrationsQuery.data ?? []).filter((r) => r.isTeam);
  const eventFor = (id) => events.find((e) => e.id === id) ?? null;

  return (
    <>
      <PageHeading title="Teams" subtitle="Groups you lead or belong to." />

      <AsyncBoundary
        query={registrationsQuery}
        loadingLabel="Loading your teams"
        isEmpty={() => teams.length === 0}
        empty={
          <EmptyState
            icon={GroupsRoundedIcon}
            title="You're not in a team yet"
            message="Register for an event as a team, or accept an invitation, and it appears here."
            action={{ label: 'Browse events', onClick: () => router.push('/event/dashboard/events') }}
          />
        }
      >
        {() =>
          teams.map((team) => {
            const event = eventFor(team.eventId);
            const isLeader = (team.email ?? '').toLowerCase() === (user?.email ?? '').toLowerCase();
            const accepted = team.members.filter((m) => m.inviteStatus === 'accepted').length + 1;
            const pending = team.members.filter((m) => m.inviteStatus === 'pending').length;

            return (
              <Box
                key={team.id}
                sx={{
                  p: 2.5,
                  mb: 1.75,
                  borderRadius: `${radius.lg}px`,
                  border: `1px solid ${color.border}`,
                  bgcolor: color.surface,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: color.text, fontSize: '1.05rem', fontWeight: 700 }}>
                      {team.teamName || 'Unnamed team'}
                    </Typography>
                    <Typography sx={{ color: color.textMuted, fontSize: '0.78rem', mt: 0.4 }}>
                      {event?.title ?? 'Event'} · {accepted} {accepted === 1 ? 'member' : 'members'}
                      {pending > 0 ? ` · ${pending} invited` : ''}
                    </Typography>
                  </Box>
                  <Chip tone={isLeader ? color.brand : color.textMuted}>{isLeader ? 'Leader' : 'Member'}</Chip>
                </Stack>

                <Stack spacing={0.75} sx={{ mt: 2 }}>
                  <MemberRow name={team.name} email={team.email} status="accepted" role="Leader" />
                  {team.members.map((m) => (
                    <MemberRow key={m.email} name={m.name || m.email} email={m.email} status={m.inviteStatus} />
                  ))}
                </Stack>

                {event && (
                  <Box
                    component="button"
                    type="button"
                    onClick={() => router.push(`/event/dashboard/${event.id}`)}
                    sx={{
                      mt: 2,
                      width: '100%',
                      minHeight: 38,
                      border: `1px solid ${color.border}`,
                      bgcolor: color.surface2,
                      color: color.text,
                      borderRadius: `${radius.sm}px`,
                      font: 'inherit',
                      fontWeight: 650,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      '&:hover': { borderColor: color.borderStrong },
                    }}
                  >
                    Open event
                  </Box>
                )}
              </Box>
            );
          })
        }
      </AsyncBoundary>
    </>
  );
}

function MemberRow({ name, email, status, role }) {
  const tone = status === 'accepted' ? color.green : status === 'rejected' ? color.textFaint : color.amber;
  const text = status === 'accepted' ? role ?? 'Joined' : status === 'rejected' ? 'Declined' : 'Invited';
  const initials = (name ?? '?').slice(0, 2).toUpperCase();

  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box
        sx={{
          width: 30,
          height: 30,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          bgcolor: '#243039',
          color: color.brand,
          fontSize: '0.62rem',
          fontWeight: 800,
        }}
      >
        {initials}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography className="pxe-clamp-1" sx={{ color: color.text, fontSize: '0.82rem', fontWeight: 600 }}>
          {name}
        </Typography>
        <Typography className="pxe-clamp-1" sx={{ color: color.textFaint, fontSize: '0.68rem' }}>
          {email}
        </Typography>
      </Box>
      <Box
        sx={{
          px: 0.9,
          py: 0.3,
          borderRadius: 999,
          fontSize: '0.62rem',
          fontWeight: 700,
          color: tone,
          bgcolor: tint(tone, 0.1),
          border: `1px solid ${tint(tone, 0.22)}`,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </Box>
    </Stack>
  );
}

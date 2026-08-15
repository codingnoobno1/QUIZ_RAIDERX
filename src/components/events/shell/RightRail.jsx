'use client';

/**
 * The right rail: invitations, your team, what's next.
 *
 * Every card is backed by a query and hides itself when that query is empty —
 * the rail shrinks to nothing for a new user rather than showing placeholder
 * rows. There is deliberately no "people you may know" or "communities to
 * follow": nothing in the data model can answer either.
 */

import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography } from '@mui/material';
import { color, radius, tint } from '@/theme/tokens';
import { useEvents, useInvitations, useMyRegistrations } from '@/hooks/queries/useEventQueries';
import InvitationCard from '@/components/events/InvitationCard';

export default function RightRail({ user }) {
  const router = useRouter();

  const { data: invitations = [] } = useInvitations(user?.email);
  const { data: registrations = [] } = useMyRegistrations(user?.email);
  const { data: events = [] } = useEvents();

  const myTeams = registrations.filter((r) => r.isTeam);
  const upcoming = events.filter((e) => e.isUpcoming).slice(0, 3);

  return (
    <Stack spacing={1.5}>
      {invitations.length > 0 && (
        <Panel title={`Invitations (${invitations.length})`}>
          <Stack spacing={1}>
            {invitations.slice(0, 2).map((inv) => (
              <InvitationCard key={inv.id} invitation={inv} email={user?.email} compact />
            ))}
          </Stack>
          {invitations.length > 2 && (
            <LinkButton onClick={() => router.push('/event/dashboard/invitations')}>
              See all {invitations.length}
            </LinkButton>
          )}
        </Panel>
      )}

      {myTeams.length > 0 && (
        <Panel title="Your team">
          {myTeams.slice(0, 1).map((team) => {
            const accepted = team.members.filter((m) => m.inviteStatus === 'accepted').length + 1;
            return (
              <Box key={team.id}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '0.86rem' }}>
                    {team.teamName || 'Your team'}
                  </Typography>
                  <Chip tone={color.green}>{accepted} in</Chip>
                </Stack>

                <Stack spacing={0.5} sx={{ mt: 1.25 }}>
                  <Member name={team.name} role="Leader" status="accepted" />
                  {team.members.map((m) => (
                    <Member key={m.email} name={m.name || m.email} status={m.inviteStatus} />
                  ))}
                </Stack>
              </Box>
            );
          })}
          <LinkButton onClick={() => router.push('/event/dashboard/teams')}>+ Invite teammate</LinkButton>
        </Panel>
      )}

      {upcoming.length > 0 && (
        <Panel title="Upcoming">
          <Stack>
            {upcoming.map((e, i) => (
              <Stack
                key={e.id}
                direction="row"
                spacing={1.25}
                alignItems="center"
                onClick={() => router.push(`/event/dashboard/${e.id}`)}
                sx={{
                  py: 1.25,
                  cursor: 'pointer',
                  borderBottom: i < upcoming.length - 1 ? `1px solid ${color.border}` : 'none',
                  '&:hover strong': { color: color.brand },
                }}
              >
                <DateBlock date={e.date} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography component="strong" className="pxe-clamp-1" sx={{ color: color.text, fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>
                    {e.title}
                  </Typography>
                  <Typography sx={{ color: color.textFaint, fontSize: '0.68rem', mt: 0.25 }}>
                    {e.time} · {e.location}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Panel>
      )}
    </Stack>
  );
}

function Panel({ title, children }) {
  return (
    <Box sx={{ p: 2, borderRadius: `${radius.lg}px`, border: `1px solid ${color.border}`, bgcolor: color.surface }}>
      <Typography sx={{ color: color.text, fontSize: '0.78rem', fontWeight: 700, mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  );
}

export function DateBlock({ date }) {
  return (
    <Box
      sx={{
        width: 44,
        height: 46,
        flexShrink: 0,
        borderRadius: `${radius.sm}px`,
        border: `1px solid ${color.border}`,
        display: 'grid',
        placeContent: 'center',
        textAlign: 'center',
      }}
    >
      <Typography sx={{ color: color.textFaint, fontSize: '0.55rem', fontWeight: 700, letterSpacing: 0.5 }}>
        {date ? date.toLocaleString(undefined, { month: 'short' }).toUpperCase() : '—'}
      </Typography>
      <Typography sx={{ color: color.text, fontSize: '0.95rem', fontWeight: 700, lineHeight: 1 }}>
        {date ? String(date.getDate()).padStart(2, '0') : '··'}
      </Typography>
    </Box>
  );
}

/** Initials chip + name + role, matching the roster rows in the mock. */
function Member({ name, role, status }) {
  const tone = status === 'accepted' ? color.green : status === 'rejected' ? color.textFaint : color.amber;
  const text = status === 'accepted' ? role ?? 'Member' : status === 'rejected' ? 'Declined' : 'Invited';
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 20,
          height: 20,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '4px',
          bgcolor: tint(color.brand, 0.12),
          color: color.brand,
          fontSize: '0.52rem',
          fontWeight: 800,
        }}
      >
        {initials}
      </Box>
      <Typography className="pxe-clamp-1" sx={{ color: color.textMuted, fontSize: '0.74rem', flex: 1, minWidth: 0 }}>
        {name}
        <Box component="span" sx={{ color: color.textFaint }}> · {text}</Box>
      </Typography>
      {status !== 'accepted' && (
        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tone, flexShrink: 0 }} />
      )}
    </Stack>
  );
}

export const Chip = ({ children, tone = color.brand }) => (
  <Box
    sx={{
      px: 0.9,
      py: 0.3,
      borderRadius: 999,
      fontSize: '0.6rem',
      fontWeight: 700,
      color: tone,
      bgcolor: tint(tone, 0.1),
      border: `1px solid ${tint(tone, 0.22)}`,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </Box>
);

const LinkButton = ({ children, onClick }) => (
  <Button
    onClick={onClick}
    fullWidth
    sx={{
      mt: 1.5,
      minHeight: 36,
      borderRadius: `${radius.sm}px`,
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.76rem',
      color: color.textMuted,
      border: `1px solid ${color.border}`,
      '&:hover': { color: color.text, bgcolor: color.surface2 },
    }}
  >
    {children}
  </Button>
);

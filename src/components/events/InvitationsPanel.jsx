'use client';

/**
 * Pending team invitations, with accept/reject.
 *
 * Kept as its own component rather than living inside the dashboard page, so
 * both breakpoints render the identical control — the old split had two copies
 * of this markup that were already drifting.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Box, Button, Stack, Typography } from '@mui/material';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import { color, radius, tint } from '@/theme/tokens';
import { useInvitations, useRespondToInvitation } from '@/hooks/queries/useEventQueries';

export default function InvitationsPanel({ user }) {
  const { data: invitations = [] } = useInvitations(user?.email);
  const respond = useRespondToInvitation(user?.email);
  const [busyId, setBusyId] = useState(null);

  if (invitations.length === 0) return null;

  const act = (registrationId, response) => {
    setBusyId(registrationId);
    respond.mutate(
      { registrationId, response },
      {
        onSuccess: () => toast.success(response === 'accepted' ? 'Invitation accepted' : 'Invitation declined'),
        onError: (err) => toast.error(err.message),
        onSettled: () => setBusyId(null),
      },
    );
  };

  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        borderRadius: `${radius.lg}px`,
        bgcolor: tint(color.amber, 0.06),
        border: `1px solid ${tint(color.amber, 0.28)}`,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <GroupsRoundedIcon sx={{ fontSize: 18, color: color.amber }} />
        <Typography sx={{ color: color.amber, fontWeight: 800, fontSize: '0.8rem', letterSpacing: 0.5 }}>
          TEAM INVITATIONS ({invitations.length})
        </Typography>
      </Stack>

      <Stack spacing={1.25}>
        {invitations.map((inv) => {
          const busy = busyId === inv.id;
          return (
            <Box
              key={inv.id}
              sx={{
                p: 1.75,
                borderRadius: `${radius.md}px`,
                bgcolor: 'rgba(255,255,255,0.03)',
                border: `1px solid ${color.border}`,
              }}
            >
              <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '0.9rem' }}>
                {inv.teamName || 'A team'}
              </Typography>
              <Typography sx={{ color: color.textFaint, fontSize: '0.75rem', mt: 0.25 }}>
                Invited by {inv.name} · {inv.teamSize} members
                {inv.event?.title ? ` · ${inv.event.title}` : ''}
              </Typography>

              {/* Stacks on narrow phones so neither button gets squeezed. */}
              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mt: 1.5 }}>
                <Button
                  onClick={() => act(inv.id, 'accepted')}
                  disabled={busy}
                  variant="contained"
                  disableElevation
                  sx={{
                    minHeight: 44,
                    borderRadius: `${radius.sm}px`,
                    textTransform: 'none',
                    fontWeight: 700,
                    bgcolor: color.green,
                    color: color.bg,
                    '&:hover': { bgcolor: color.green, filter: 'brightness(1.1)' },
                  }}
                >
                  {busy ? 'Working…' : 'Accept'}
                </Button>
                <Button
                  onClick={() => act(inv.id, 'rejected')}
                  disabled={busy}
                  variant="outlined"
                  sx={{
                    minHeight: 44,
                    borderRadius: `${radius.sm}px`,
                    textTransform: 'none',
                    fontWeight: 700,
                    color: color.red,
                    borderColor: tint(color.red, 0.4),
                  }}
                >
                  Decline
                </Button>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

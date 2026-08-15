'use client';

/**
 * A team invitation, as a request rather than a form row.
 *
 * Accept and decline are both terminal, so the card reports the outcome in
 * place instead of vanishing — including the 409 the server returns when the
 * invitation was already answered somewhere else, which is settled state and
 * not an error worth a red toast.
 */

import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { color, radius, tint } from '@/theme/tokens';
import { useRespondToInvitation } from '@/hooks/queries/useEventQueries';

export default function InvitationCard({ invitation, email, compact = false }) {
  const respond = useRespondToInvitation(email);
  const [settled, setSettled] = useState(null);

  const accepted = invitation.members.filter((m) => m.inviteStatus === 'accepted').length + 1;

  const act = (response) =>
    respond.mutate(
      { registrationId: invitation.id, response },
      {
        onSuccess: () => setSettled(response),
        // A 409 means it is already answered — report that, don't cry about it.
        onError: (err) => setSettled(err?.status === 409 ? 'settled' : null),
      },
    );

  if (settled) {
    return (
      <Box sx={{ p: 1.5, borderRadius: `${radius.md}px`, bgcolor: tint(color.green, 0.06), border: `1px solid ${tint(color.green, 0.2)}` }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CheckCircleRoundedIcon sx={{ fontSize: 16, color: color.green }} />
          <Typography sx={{ color: color.green, fontSize: '0.78rem', fontWeight: 600 }}>
            {settled === 'accepted'
              ? `You joined ${invitation.teamName || 'the team'}`
              : settled === 'rejected'
                ? 'Invitation declined'
                : 'Already answered'}
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: compact ? 1.5 : 2,
        borderRadius: `${radius.md}px`,
        bgcolor: compact ? '#0D0F14' : color.surface,
        border: `1px solid ${compact ? color.border : tint(color.violet, 0.22)}`,
      }}
    >
      <Typography sx={{ color: color.text, fontSize: '0.82rem', fontWeight: 700 }}>
        {invitation.name}
      </Typography>
      <Typography sx={{ color: color.textMuted, fontSize: '0.75rem', mt: 0.5, lineHeight: 1.5 }}>
        invited you to join <b style={{ color: color.text }}>{invitation.teamName || 'their team'}</b>
        {invitation.event?.title ? ` for ${invitation.event.title}` : ''}.
      </Typography>

      <Typography sx={{ color: color.textFaint, fontSize: '0.68rem', mt: 0.75 }}>
        {accepted} {accepted === 1 ? 'member' : 'members'} so far
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, mt: 1.5 }}>
        <Button
          onClick={() => act('rejected')}
          disabled={respond.isPending}
          sx={{
            minHeight: 36,
            borderRadius: `${radius.sm}px`,
            textTransform: 'none',
            fontWeight: 650,
            fontSize: '0.75rem',
            color: color.textMuted,
            border: `1px solid ${color.border}`,
            '&:hover': { color: color.text, bgcolor: color.surface2 },
          }}
        >
          Decline
        </Button>
        <Button
          onClick={() => act('accepted')}
          disabled={respond.isPending}
          variant="contained"
          disableElevation
          sx={{
            minHeight: 36,
            borderRadius: `${radius.sm}px`,
            textTransform: 'none',
            fontWeight: 750,
            fontSize: '0.75rem',
            bgcolor: color.brand,
            color: '#061014',
            '&:hover': { bgcolor: color.brand, filter: 'brightness(1.08)' },
          }}
        >
          {respond.isPending ? '…' : 'Accept'}
        </Button>
      </Box>

      {respond.isError && respond.error?.status !== 409 && (
        <Typography sx={{ mt: 1, color: color.red, fontSize: '0.72rem' }}>{respond.error.message}</Typography>
      )}
    </Box>
  );
}

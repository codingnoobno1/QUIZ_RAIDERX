'use client';

/**
 * Event-segment boundary.
 *
 * Scoped to `/event/dashboard/*` so a throw inside a lobby, pass or
 * registration screen keeps the event shell (nav, sidebar, session) mounted —
 * the participant stays inside the event instead of being dumped on a blank
 * document in the middle of a live round.
 */

import { Box, Button, Stack, Typography } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ReportGmailerrorredRoundedIcon from '@mui/icons-material/ReportGmailerrorredRounded';
import { useRouter } from 'next/navigation';
import { color, radius, tint } from '@/theme/tokens';

export default function EventDashboardError({ error, reset }) {
  const router = useRouter();

  return (
    <Box role="alert" sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
      <Box
        sx={{
          width: 56,
          height: 56,
          mx: 'auto',
          mb: 2,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          bgcolor: tint(color.red, 0.1),
          border: `1px solid ${tint(color.red, 0.25)}`,
        }}
      >
        <ReportGmailerrorredRoundedIcon sx={{ color: color.red, fontSize: 28 }} />
      </Box>

      <Typography sx={{ color: color.text, fontWeight: 800, fontSize: '1.05rem' }}>
        This screen hit a problem
      </Typography>

      <Typography sx={{ color: color.textMuted, mt: 1, maxWidth: 420, mx: 'auto', lineHeight: 1.6 }}>
        Your registration and any answers you already submitted are safe on the server.
        Retrying reloads just this panel.
      </Typography>

      {process.env.NODE_ENV !== 'production' && error?.message && (
        <Typography sx={{ mt: 2, color: color.textFaint, fontSize: '0.75rem', fontFamily: 'monospace' }}>
          {error.message}
        </Typography>
      )}

      <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
        <Button
          onClick={() => reset()}
          startIcon={<RefreshRoundedIcon />}
          variant="contained"
          disableElevation
          sx={{
            minHeight: 44,
            px: 2.5,
            borderRadius: `${radius.md}px`,
            textTransform: 'none',
            fontWeight: 800,
            bgcolor: color.brand,
            color: color.bg,
          }}
        >
          Try again
        </Button>
        <Button
          onClick={() => router.push('/event/dashboard')}
          startIcon={<ArrowBackRoundedIcon />}
          variant="outlined"
          sx={{
            minHeight: 44,
            px: 2.5,
            borderRadius: `${radius.md}px`,
            textTransform: 'none',
            fontWeight: 700,
            color: color.text,
            borderColor: color.borderStrong,
          }}
        >
          All events
        </Button>
      </Stack>
    </Box>
  );
}

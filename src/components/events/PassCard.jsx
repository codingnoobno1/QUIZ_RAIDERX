'use client';

/**
 * Event pass — port of `screens/registration/event_pass_screen.dart`.
 *
 * The QR encodes the pass id (teamId for a team, registration id for a solo),
 * which is what `POST /api/events/access` looks up on scan.
 */

import { QRCodeSVG } from 'qrcode.react';
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import { color, radius, tint } from '@/theme/tokens';

export default function PassCard({ event, registration, onEnterLobby }) {
  const isTeam = registration.isTeam;
  const accepted = registration.members.filter((m) => m.inviteStatus === 'accepted').length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 460, mx: 'auto', width: '100%' }}>
      <Box
        sx={{
          borderRadius: `${radius.xl}px`,
          overflow: 'hidden',
          bgcolor: color.surface,
          border: `1px solid ${tint(color.violet, 0.3)}`,
        }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            {isTeam ? (
              <GroupsRoundedIcon sx={{ fontSize: 16, color: color.violet }} />
            ) : (
              <PersonRoundedIcon sx={{ fontSize: 16, color: color.violet }} />
            )}
            <Typography sx={{ color: color.violet, fontSize: '0.62rem', fontWeight: 800, letterSpacing: 1.4 }}>
              {isTeam ? 'TEAM PASS' : 'ENTRY PASS'}
            </Typography>
          </Stack>

          <Typography sx={{ color: color.text, fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.3 }}>
            {registration.displayName}
          </Typography>
          <Typography className="pxe-clamp-1" sx={{ color: color.textMuted, fontSize: '0.85rem', mt: 0.25 }}>
            {event.title}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
            <StatusChip
              label={registration.hasEntered ? 'CHECKED IN' : 'NOT SCANNED'}
              tone={registration.hasEntered ? color.green : color.textFaint}
            />
            {isTeam && (
              <StatusChip label={`${registration.teamSize} MEMBERS · ${accepted} ACCEPTED`} tone={color.violet} />
            )}
          </Stack>
        </Box>

        {/* Perforation — the physical-ticket cue the mobile pass uses. */}
        <Box sx={{ position: 'relative', py: 0.5 }}>
          <Notch side="left" />
          <Divider sx={{ borderStyle: 'dashed', borderColor: color.border, mx: 3 }} />
          <Notch side="right" />
        </Box>

        <Box sx={{ px: 3, pt: 2, pb: 3 }}>
          <Box
            sx={{
              bgcolor: '#ffffff', // a QR must be true white to scan reliably
              p: 2.5,
              borderRadius: `${radius.lg}px`,
              display: 'grid',
              placeItems: 'center',
              mx: 'auto',
              width: 'fit-content',
            }}
          >
            <QRCodeSVG value={registration.passId} size={184} level="H" />
          </Box>

          <Typography
            sx={{
              mt: 2,
              textAlign: 'center',
              color: color.textFaint,
              fontSize: '0.68rem',
              letterSpacing: 1,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}
          >
            {registration.passId}
          </Typography>

          <Typography sx={{ mt: 1.5, textAlign: 'center', color: color.textMuted, fontSize: '0.78rem', lineHeight: 1.6 }}>
            Show this at the desk. It records one entry and one exit.
          </Typography>
        </Box>
      </Box>

      <Button
        onClick={onEnterLobby}
        fullWidth
        variant="contained"
        disableElevation
        startIcon={<BoltRoundedIcon />}
        sx={{
          mt: 2.5,
          minHeight: 50,
          borderRadius: `${radius.md}px`,
          textTransform: 'none',
          fontWeight: 800,
          bgcolor: color.brand,
          color: color.bg,
          '&:hover': { bgcolor: color.brand, filter: 'brightness(1.08)' },
        }}
      >
        Enter live lobby
      </Button>

      <Stack spacing={1} sx={{ mt: 2.5 }}>
        <Step n="1" text="Register — done." done />
        <Step n="2" text="Get scanned at the desk." done={registration.hasEntered} />
        <Step n="3" text="Open the lobby to follow live activities." icon={LoginRoundedIcon} />
      </Stack>
    </Box>
  );
}

function StatusChip({ label, tone }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        height: 20,
        fontSize: '0.58rem',
        fontWeight: 800,
        letterSpacing: 0.8,
        color: tone,
        bgcolor: tint(tone, 0.12),
        border: `1px solid ${tint(tone, 0.3)}`,
      }}
    />
  );
}

function Notch({ side }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        top: '50%',
        [side]: -10,
        transform: 'translateY(-50%)',
        width: 20,
        height: 20,
        borderRadius: '50%',
        bgcolor: color.bg,
        border: `1px solid ${tint(color.violet, 0.3)}`,
      }}
    />
  );
}

function Step({ n, text, done, icon: Icon }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box
        sx={{
          width: 22,
          height: 22,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          fontSize: '0.65rem',
          fontWeight: 800,
          color: done ? color.bg : color.textMuted,
          bgcolor: done ? color.green : 'rgba(255,255,255,0.06)',
          border: `1px solid ${done ? color.green : color.border}`,
        }}
      >
        {Icon ? <Icon sx={{ fontSize: 12 }} /> : n}
      </Box>
      <Typography sx={{ color: done ? color.textMuted : color.textFaint, fontSize: '0.8rem' }}>
        {text}
      </Typography>
    </Stack>
  );
}

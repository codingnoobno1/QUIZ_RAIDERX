'use client';

/**
 * The sticky action column.
 *
 * The old page floated its buttons at the bottom of the content, so "Enter live
 * lobby" was equally prominent whether or not anything was live. This panel
 * answers one question — what should I do next — and derives that from the
 * event's stage plus the participant's own registration, so the loud action is
 * only loud when it is actually the thing to do.
 */

import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import LockClockRoundedIcon from '@mui/icons-material/LockClockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import { color, radius, tint } from '@/theme/tokens';

/**
 * One derived decision, in one place.
 * @returns {{key, label, help, cta, icon, tone, secondary}}
 */
export function nextActionFor({ event, registration }) {
  if (!registration) {
    return event.registrationOpen
      ? {
          key: 'register',
          label: 'Registration open',
          help: 'Sign up individually or bring a team.',
          cta: { text: 'Register now', href: 'register' },
          icon: HowToRegRoundedIcon,
          tone: color.brand,
        }
      : {
          key: 'closed',
          label: event.isPast ? 'Event ended' : 'Registration closed',
          help: event.isPast
            ? 'This event has finished.'
            : 'Registration for this event is no longer open.',
          icon: LockClockRoundedIcon,
          tone: color.textMuted,
        };
  }

  if (event.isLive) {
    return {
      key: 'live',
      label: 'Event is live',
      help: `${labelForMode(event.activeMode?.type)} is running right now.`,
      cta: { text: 'Enter live lobby', href: 'lobby' },
      icon: BoltRoundedIcon,
      tone: color.green,
      secondary: { text: 'My pass', href: 'pass' },
    };
  }

  if (event.isPast) {
    return {
      key: 'ended',
      label: 'Event completed',
      help: registration.hasEntered
        ? 'Thanks for taking part.'
        : 'This event has finished.',
      icon: CheckCircleRoundedIcon,
      tone: color.textMuted,
      secondary: { text: 'My pass', href: 'pass' },
    };
  }

  if (event.isToday) {
    return {
      key: 'checkin',
      label: registration.hasEntered ? "You're checked in" : 'Today',
      help: registration.hasEntered
        ? 'Wait here — activities appear automatically once they start.'
        : 'Show your pass at the entrance to check in.',
      cta: { text: registration.hasEntered ? 'Open lobby' : 'Show my pass', href: registration.hasEntered ? 'lobby' : 'pass' },
      icon: QrCode2RoundedIcon,
      tone: color.brand,
    };
  }

  return {
    key: 'registered',
    label: "You're registered",
    help: 'Your pass is ready. We will open the lobby on the day.',
    cta: { text: 'View my pass', href: 'pass' },
    icon: CheckCircleRoundedIcon,
    tone: color.green,
  };
}

const labelForMode = (type) =>
  ({ quiz: 'A quiz', voting: 'A vote', 'treasure-hunt': 'A treasure hunt' }[type] ?? 'An activity');

export default function ActionPanel({ event, registration, onNavigate }) {
  const action = nextActionFor({ event, registration });
  const Icon = action.icon;

  return (
    <Box
      sx={{
        borderRadius: `${radius.lg}px`,
        border: `1px solid ${color.border}`,
        bgcolor: color.surface,
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 2.5, pt: 2.5 }}>
        <Icon sx={{ fontSize: 18, color: action.tone }} />
        <Typography sx={{ color: action.tone, fontWeight: 700, fontSize: '0.9rem' }}>
          {action.label}
        </Typography>
      </Stack>

      <Typography sx={{ px: 2.5, pt: 0.75, color: color.textMuted, fontSize: '0.85rem', lineHeight: 1.6 }}>
        {action.help}
      </Typography>

      <Box sx={{ px: 2.5, pt: 2 }}>
        {action.cta && (
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={() => onNavigate(action.cta.href)}
            sx={{
              minHeight: 46,
              borderRadius: `${radius.md}px`,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              bgcolor: action.tone,
              color: color.bg,
              '&:hover': { bgcolor: action.tone, filter: 'brightness(1.08)' },
            }}
          >
            {action.cta.text}
          </Button>
        )}

        {action.secondary && (
          <Button
            fullWidth
            variant="outlined"
            onClick={() => onNavigate(action.secondary.href)}
            sx={{
              mt: 1,
              minHeight: 42,
              borderRadius: `${radius.md}px`,
              textTransform: 'none',
              fontWeight: 600,
              color: color.text,
              borderColor: color.border,
              '&:hover': { borderColor: color.borderStrong, bgcolor: 'rgba(255,255,255,0.03)' },
            }}
          >
            {action.secondary.text}
          </Button>
        )}
      </Box>

      {registration && (
        <>
          <Divider sx={{ mt: 2.5, borderColor: color.border }} />
          <Stack spacing={1.5} sx={{ p: 2.5 }}>
            <Field label="Registration" value={registration.isTeam ? 'Team' : 'Individual'} />
            {registration.isTeam && <Field label="Team" value={registration.teamName || '—'} />}
            <Field label="Reference" value={registration.passId.slice(-8).toUpperCase()} mono />

            {registration.isTeam && (
              <Box>
                <Typography sx={{ color: color.textFaint, fontSize: '0.7rem', fontWeight: 600, mb: 0.75 }}>
                  MEMBERS
                </Typography>
                <Stack spacing={0.75}>
                  <MemberRow name={registration.name} role="Leader" status="accepted" />
                  {registration.members.map((m) => (
                    <MemberRow key={m.email} name={m.name || m.email} status={m.inviteStatus} />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </>
      )}
    </Box>
  );
}

function Field({ label, value, mono }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2}>
      <Typography sx={{ color: color.textFaint, fontSize: '0.78rem' }}>{label}</Typography>
      <Typography
        sx={{
          color: color.text,
          fontSize: '0.82rem',
          fontWeight: 600,
          fontFamily: mono ? 'ui-monospace, monospace' : undefined,
          textAlign: 'right',
          minWidth: 0,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/** Invite state is shown plainly — pending is information, not a warning. */
function MemberRow({ name, role, status }) {
  const tone =
    status === 'accepted' ? color.green : status === 'rejected' ? color.textFaint : color.amber;
  const text = status === 'accepted' ? role ?? 'Joined' : status === 'rejected' ? 'Declined' : 'Invited';

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <GroupsRoundedIcon sx={{ fontSize: 14, color: color.textFaint }} />
      <Typography className="pxe-clamp-1" sx={{ color: color.text, fontSize: '0.82rem', flex: 1, minWidth: 0 }}>
        {name}
      </Typography>
      <Chip
        size="small"
        label={text}
        sx={{
          height: 20,
          fontSize: '0.65rem',
          fontWeight: 600,
          color: tone,
          bgcolor: tint(tone, 0.1),
          border: `1px solid ${tint(tone, 0.22)}`,
        }}
      />
    </Stack>
  );
}

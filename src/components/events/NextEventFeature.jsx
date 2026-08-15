'use client';

/**
 * "Your next event" — the split feature panel.
 *
 * The prototype's most deliberate piece of layout: event on the left, a
 * numbered progress ladder on the right, divided by a hairline. It earns the
 * space because it answers the two questions a participant actually has —
 * which event is next, and what do I do about it — without a click.
 *
 * Shown only when there is a next event to feature. No placeholder version.
 */

import { useRouter } from 'next/navigation';
import { Box, Stack, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { color, radius, tint } from '@/theme/tokens';

export default function NextEventFeature({ event, registration }) {
  const router = useRouter();
  if (!event) return null;

  const steps = buildSteps(event, registration);
  const go = (sub) => router.push(`/event/dashboard/${event.id}${sub ? `/${sub}` : ''}`);

  return (
    <Box
      sx={{
        mt: 2,
        mb: 3,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.45fr 0.8fr' },
        borderRadius: `${radius.lg}px`,
        border: `1px solid ${color.border}`,
        bgcolor: color.surface,
        overflow: 'hidden',
      }}
    >
      {/* left — the event */}
      <Box sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography sx={{ color: color.textFaint, fontSize: '0.6rem', fontWeight: 800, letterSpacing: 1 }}>
          {event.isLive ? 'HAPPENING NOW' : event.isPast ? 'MOST RECENT' : 'YOUR NEXT EVENT'}
        </Typography>

        <Typography
          sx={{
            color: color.text,
            fontSize: { xs: '1.5rem', md: '1.7rem' },
            fontWeight: 700,
            letterSpacing: '-0.6px',
            mt: 0.75,
            lineHeight: 1.15,
          }}
        >
          {event.title}
        </Typography>

        {event.organizer?.name && (
          <Typography sx={{ color: color.textMuted, fontSize: '0.8rem', mt: 0.5 }}>
            {event.organizer.name}
          </Typography>
        )}

        <Typography sx={{ color: '#D7DADE', fontSize: '0.85rem', mt: 2.5 }}>
          {formatDate(event.date)}
          <Sep />
          {event.time}
          <Sep />
          {event.location}
        </Typography>

        <StatusCallout event={event} registration={registration} />

        <Stack direction="row" spacing={1} sx={{ mt: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Action primary onClick={() => go('')}>
            Open event
          </Action>
          {registration && <Action onClick={() => go('pass')}>View pass</Action>}
          {event.isLive && <Action onClick={() => go('lobby')}>Live lobby</Action>}
        </Stack>
      </Box>

      {/* right — the ladder */}
      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          borderLeft: { md: `1px solid ${color.border}` },
          borderTop: { xs: `1px solid ${color.border}`, md: 'none' },
          bgcolor: 'rgba(255,255,255,0.012)',
        }}
      >
        <Typography sx={{ color: color.textFaint, fontSize: '0.6rem', fontWeight: 800, letterSpacing: 1, mb: 2 }}>
          EVENT PROGRESS
        </Typography>

        <Stack spacing={0}>
          {steps.map((s, i) => (
            <Stack key={s.label} direction="row" spacing={1.5} alignItems="flex-start">
              {/* dot + connector, so the ladder reads as one line not four chips */}
              <Stack alignItems="center" sx={{ alignSelf: 'stretch' }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '50%',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    border: `1px solid ${s.done ? tint(color.green, 0.45) : s.current ? color.brand : color.border}`,
                    bgcolor: s.done ? tint(color.green, 0.1) : s.current ? color.brand : 'transparent',
                    color: s.done ? color.green : s.current ? '#061014' : color.textFaint,
                  }}
                >
                  {s.done ? <CheckRoundedIcon sx={{ fontSize: 14 }} /> : i + 1}
                </Box>
                {i < steps.length - 1 && (
                  <Box sx={{ width: '1px', flex: 1, minHeight: 18, bgcolor: color.border, my: 0.25 }} />
                )}
              </Stack>

              <Box sx={{ pb: i < steps.length - 1 ? 1.5 : 0 }}>
                <Typography
                  sx={{
                    color: s.current ? color.text : s.done ? color.text : color.textFaint,
                    fontSize: '0.78rem',
                    fontWeight: s.current ? 700 : 600,
                    lineHeight: 1.3,
                  }}
                >
                  {s.label}
                </Typography>
                <Typography sx={{ color: color.textFaint, fontSize: '0.66rem', mt: 0.2 }}>{s.hint}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

const Sep = () => (
  <Box component="span" sx={{ color: color.textFaint, px: 1.25 }}>
    ·
  </Box>
);

/** The one green callout — used sparingly so it still reads as a signal. */
function StatusCallout({ event, registration }) {
  const tone = event.isLive ? color.green : registration ? color.green : color.amber;
  const text = event.isLive
    ? 'This event is live right now'
    : registration
      ? `You're registered${registration.isTeam ? ` with ${registration.teamName}` : ''}`
      : event.registrationOpen
        ? 'Registration is open'
        : 'Registration has closed';

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        mt: 2.5,
        px: 1.75,
        py: 1.25,
        borderRadius: `${radius.md}px`,
        border: `1px solid ${tint(tone, 0.25)}`,
        bgcolor: tint(tone, 0.07),
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tone, flexShrink: 0 }} />
      <Typography sx={{ color: tone, fontSize: '0.78rem', fontWeight: 650 }}>{text}</Typography>
    </Stack>
  );
}

function Action({ children, primary, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      className="pxe-tap"
      sx={{
        minHeight: 38,
        px: 2,
        border: `1px solid ${primary ? color.brand : color.border}`,
        bgcolor: primary ? color.brand : color.surface2,
        color: primary ? '#061014' : color.text,
        borderRadius: `${radius.sm}px`,
        font: 'inherit',
        fontWeight: 750,
        fontSize: '0.76rem',
        cursor: 'pointer',
        transition: 'filter 150ms ease, border-color 150ms ease',
        '&:hover': { filter: primary ? 'brightness(1.08)' : 'none', borderColor: primary ? color.brand : color.borderStrong },
      }}
    >
      {children}
    </Box>
  );
}

function buildSteps(event, registration) {
  const registered = Boolean(registration);
  const checkedIn = Boolean(registration?.hasEntered);

  return [
    {
      label: 'Registration',
      hint: registered ? 'Completed' : event.registrationOpen ? 'Open now' : 'Closed',
      done: registered,
      current: !registered && event.registrationOpen,
    },
    {
      label: 'Check-in',
      hint: checkedIn ? 'Done' : registered ? `Opens on the day` : 'After you register',
      done: checkedIn,
      current: registered && !checkedIn && event.isToday,
    },
    {
      label: 'Event',
      hint: event.isPast ? 'Finished' : event.isLive ? 'Running now' : `Starts ${event.time}`,
      done: event.isPast,
      current: event.isLive,
    },
    {
      label: 'Results',
      hint: event.isPast ? 'Available' : 'After the event',
      done: false,
      current: event.isPast,
    },
  ];
}

function formatDate(d) {
  return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) : 'Date TBA';
}

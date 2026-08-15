'use client';

/**
 * An event, presented as a post rather than a list row.
 *
 * The banner is the event's own poster when it has one; when it doesn't, it
 * falls back to a generated gradient rather than a broken image or a grey box.
 * Every fact on the card is real: the participant count is a seat count from
 * the API, the status comes from the event's derived stage, and the action
 * reflects whether this user is registered. Nothing is placeholder.
 */

import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography } from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { color, radius, tint } from '@/theme/tokens';

const STAGE = {
  live: { text: 'Live now', tone: '#65BD91' },
  today: { text: 'Today', tone: '#38B9D3' },
  open: { text: 'Registration open', tone: '#969CA8' },
  closed: { text: 'Registration closed', tone: '#646B77' },
  ended: { text: 'Completed', tone: '#646B77' },
};

/** Stable per-event tint so cards differ without being random on every render. */
function hueFor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

export default function EventPostCard({ event, registration, organizerFallback = 'Pixel Events' }) {
  const router = useRouter();
  const stage = STAGE[event.stage] ?? STAGE.open;
  const open = () => router.push(`/event/dashboard/${event.id}`);
  const hue = hueFor(event.id);

  const organiser = event.organizer?.name || organizerFallback;
  const initials = organiser.slice(0, 2).toUpperCase();

  return (
    <Box
      sx={{
        mb: 1.75,
        borderRadius: `${radius.lg}px`,
        border: `1px solid ${color.border}`,
        bgcolor: color.surface,
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ p: 1.75 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'grid',
            placeItems: 'center',
            borderRadius: `${radius.md}px`,
            bgcolor: tint(color.brand, 0.1),
            color: color.brand,
            fontWeight: 900,
            fontSize: '0.68rem',
          }}
        >
          {initials}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ color: color.text, fontSize: '0.82rem', fontWeight: 700 }}>{organiser}</Typography>
          <Typography sx={{ color: color.textFaint, fontSize: '0.66rem' }}>
            {event.organizer?.subtitle || formatWhen(event.date)}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 1,
            py: 0.4,
            borderRadius: 999,
            fontSize: '0.62rem',
            fontWeight: 700,
            color: stage.tone,
            bgcolor: tint(stage.tone, 0.1),
            border: `1px solid ${tint(stage.tone, 0.22)}`,
          }}
        >
          {stage.text}
        </Box>
      </Stack>

      {event.description && (
        <Typography sx={{ px: 1.75, pb: 1.5, color: '#D7DADE', fontSize: '0.83rem', lineHeight: 1.55 }}>
          {truncate(event.description, 180)}
        </Typography>
      )}

      {/* banner */}
      <Box
        onClick={open}
        sx={{
          mx: 1.25,
          height: 200,
          cursor: 'pointer',
          borderRadius: `${radius.md}px ${radius.md}px 0 0`,
          display: 'flex',
          alignItems: 'end',
          p: 2.5,
          backgroundImage: event.imageUrl
            ? `linear-gradient(180deg, rgba(4,8,12,.25), rgba(4,8,12,.92)), url(${JSON.stringify(event.imageUrl)})`
            : `linear-gradient(110deg, rgba(4,8,12,.96), rgba(4,12,18,.5)), radial-gradient(circle at 80% 25%, hsl(${hue} 42% 26%) 0, transparent 38%), linear-gradient(135deg, #111A21, #0C1016)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box>
          <Typography sx={{ color: color.text, fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.2 }}>
            {event.title}
          </Typography>
          {event.tags.length > 0 && (
            <Typography sx={{ color: '#C0C5CA', fontSize: '0.74rem', mt: 0.5 }}>
              {event.tags.join(' · ')}
            </Typography>
          )}
        </Box>
      </Box>

      {/* facts — three real fields */}
      <Box
        sx={{
          mx: 1.25,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          border: `1px solid ${color.border}`,
          borderTop: 0,
        }}
      >
        {[
          ['Date', formatDate(event.date)],
          ['Time', event.time],
          ['Venue', event.location],
        ].map(([label, value], i) => (
          <Box
            key={label}
            sx={{
              p: 1.5,
              borderRight: { sm: i < 2 ? `1px solid ${color.border}` : 'none' },
              borderBottom: { xs: i < 2 ? `1px solid ${color.border}` : 'none', sm: 'none' },
            }}
          >
            <Typography sx={{ color: color.textFaint, fontSize: '0.55rem', fontWeight: 800, letterSpacing: 0.6 }}>
              {label.toUpperCase()}
            </Typography>
            <Typography className="pxe-clamp-1" sx={{ color: color.text, fontSize: '0.76rem', mt: 0.25 }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          mx: 1.25,
          mb: 1.25,
          px: 1.75,
          py: 1.5,
          border: `1px solid ${color.border}`,
          borderTop: 0,
          borderRadius: `0 0 ${radius.md}px ${radius.md}px`,
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          <PeopleAltOutlinedIcon sx={{ fontSize: 15, color: color.textFaint }} />
          <Typography sx={{ color: color.textMuted, fontSize: '0.74rem' }}>
            {event.participantCount > 0
              ? `${event.participantCount} ${event.participantCount === 1 ? 'participant' : 'participants'}`
              : 'Be the first to register'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {registration && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CheckCircleRoundedIcon sx={{ fontSize: 15, color: color.green }} />
              <Typography sx={{ color: color.green, fontSize: '0.72rem', fontWeight: 650 }}>Registered</Typography>
            </Stack>
          )}
          <Button
            onClick={open}
            variant="contained"
            disableElevation
            sx={{
              minHeight: 34,
              px: 1.75,
              borderRadius: `${radius.sm}px`,
              textTransform: 'none',
              fontWeight: 750,
              fontSize: '0.73rem',
              bgcolor: color.brand,
              color: '#061014',
              '&:hover': { bgcolor: color.brand, filter: 'brightness(1.08)' },
            }}
          >
            View event
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

function formatDate(d) {
  return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA';
}

function formatWhen(d) {
  return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
}

'use client';

/**
 * The two-up discovery card.
 *
 * Browsing and following are different jobs. The feed card is full width and
 * leads with the poster because you are reading it; this one is half width and
 * leads with a colour field because you are scanning a grid of them. Cover,
 * chip, one line of provenance, title, one line of description, then a footer
 * that puts the facts and the action on the same baseline.
 */

import { useRouter } from 'next/navigation';
import { Box, Stack, Typography } from '@mui/material';
import { color, radius, tint } from '@/theme/tokens';

/** Stable per-event hue, so a card keeps its colour between renders. */
function hueFor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

const STAGE = {
  live: { text: 'Live', tone: color.green },
  today: { text: 'Today', tone: color.brand },
  open: { text: 'Open', tone: color.brand },
  closed: { text: 'Closed', tone: color.textFaint },
  ended: { text: 'Ended', tone: color.textFaint },
};

export default function DiscoverCard({ event, registration }) {
  const router = useRouter();
  const open = () => router.push(`/event/dashboard/${event.id}`);

  const hue = hueFor(event.id);
  const stage = STAGE[event.stage] ?? STAGE.open;
  const organiser = event.organizer?.name || 'Pixel Events';

  return (
    <Box
      onClick={open}
      sx={{
        cursor: 'pointer',
        borderRadius: `${radius.lg}px`,
        border: `1px solid ${color.border}`,
        bgcolor: color.surface,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 180ms ease, transform 180ms ease',
        '&:hover': { borderColor: color.borderStrong, transform: 'translateY(-2px)' },
        '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
      }}
    >
      {/* Cover: the poster when there is one, otherwise a colour field keyed to
          this event so a wall of cards never reads as a wall of grey boxes. */}
      <Box
        sx={{
          height: 155,
          display: 'flex',
          alignItems: 'flex-start',
          p: 1.5,
          backgroundImage: event.imageUrl
            ? `linear-gradient(180deg, rgba(5,8,12,.15), rgba(5,8,12,.86)), url(${JSON.stringify(event.imageUrl)})`
            : `linear-gradient(180deg, rgba(0,0,0,.05), rgba(5,8,12,.94)), radial-gradient(circle at 70% 25%, hsl(${hue} 40% 28%) 0, transparent 40%), #111820`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box
          sx={{
            px: 1,
            py: 0.35,
            borderRadius: 999,
            fontSize: '0.6rem',
            fontWeight: 700,
            color: stage.tone,
            bgcolor: 'rgba(9,10,14,0.66)',
            border: `1px solid ${tint(stage.tone, 0.3)}`,
            backdropFilter: 'blur(6px)',
          }}
        >
          {stage.text}
        </Box>
      </Box>

      <Box sx={{ p: 1.75, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              px: 0.6,
              py: 0.15,
              borderRadius: `${radius.sm - 4}px`,
              bgcolor: tint(color.brand, 0.12),
              color: color.brand,
              fontSize: '0.55rem',
              fontWeight: 800,
              letterSpacing: 0.3,
            }}
          >
            {organiser.slice(0, 2).toUpperCase()}
          </Box>
          <Typography className="pxe-clamp-1" sx={{ color: color.textFaint, fontSize: '0.66rem' }}>
            {organiser}
          </Typography>
        </Stack>

        <Typography
          sx={{
            color: color.text,
            fontSize: '1rem',
            fontWeight: 700,
            lineHeight: 1.25,
            mt: 0.9,
            letterSpacing: '-0.2px',
          }}
        >
          {event.title}
        </Typography>

        {event.description && (
          <Typography
            className="pxe-clamp-2"
            sx={{ color: color.textMuted, fontSize: '0.72rem', lineHeight: 1.55, mt: 0.6 }}
          >
            {event.description}
          </Typography>
        )}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          sx={{ mt: 'auto', pt: 1.75 }}
        >
          <Typography className="pxe-clamp-1" sx={{ color: color.textFaint, fontSize: '0.66rem', minWidth: 0 }}>
            {[shortDate(event.date), event.location].filter(Boolean).join(' · ')}
            {event.participantCount > 0 ? ` · ${event.participantCount} going` : ''}
          </Typography>

          <Box
            component="button"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="pxe-tap"
            sx={{
              flexShrink: 0,
              minHeight: 32,
              px: 1.75,
              border: `1px solid ${registration ? color.border : color.brand}`,
              bgcolor: registration ? color.surface2 : color.brand,
              color: registration ? color.text : '#061014',
              borderRadius: `${radius.sm}px`,
              font: 'inherit',
              fontWeight: 750,
              fontSize: '0.7rem',
              cursor: 'pointer',
              transition: 'filter 150ms ease',
              '&:hover': { filter: 'brightness(1.1)' },
            }}
          >
            {registration ? 'Open' : 'View'}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

function shortDate(d) {
  return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : null;
}

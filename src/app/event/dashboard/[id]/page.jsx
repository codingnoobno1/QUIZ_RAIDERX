'use client';

/**
 * Event detail — port of `screens/events/event_detail_screen.dart`.
 *
 * The primary CTA is one control derived from one boolean: not registered →
 * "Register"; registered → "Access pass". Same label/colour/destination logic
 * as `event_detail_screen.dart:220-232`.
 *
 * The poster is rendered as a contained banner with the title BELOW it, not
 * overlaid — event posters carry their own typography, and overlaying ours on
 * top produced two competing headlines.
 */

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import { color, radius, tint } from '@/theme/tokens';
import { BREAKPOINT } from '@/config/constants';
import useEventUser from '@/hooks/useEventUser';
import { useEvent, useRegistrationFor } from '@/hooks/queries/useEventQueries';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';

const DESKTOP = `@media (min-width:${BREAKPOINT.DESKTOP_MIN}px)`;

export default function EventDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useEventUser();

  const eventQuery = useEvent(id);
  const { isRegistered } = useRegistrationFor(user?.email, id);

  return (
    <AsyncBoundary
      query={eventQuery}
      loadingLabel="Loading event"
      isEmpty={(e) => !e}
      empty={
        <EmptyState
          icon={EventBusyRoundedIcon}
          title="Event not found"
          message="It may have been removed by the organiser."
          action={{ label: 'Back to events', onClick: () => router.push('/event/dashboard') }}
        />
      }
    >
      {(event) => (
        <Box
          sx={{
            // A readable measure on any width. Without this the copy stretched
            // across the whole 900px pane on desktop.
            maxWidth: 940,
            mx: 'auto',
            px: { xs: 2, md: 4 },
            py: { xs: 2, md: 3.5 },
            // Wide panes: poster beside the content. Posters here are square or
            // portrait, so a full-width banner would be mostly letterbox.
            display: 'grid',
            gap: { xs: 0, lg: 4 },
            gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr)' },
            alignItems: 'start',
          }}
        >
          <Poster event={event} />

          <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mt: 2.5, mb: 1, flexWrap: 'wrap', rowGap: 1 }}
          >
            <StatusPill event={event} />
            {isRegistered && (
              <Chip
                size="small"
                icon={<QrCode2RoundedIcon sx={{ fontSize: 13, color: `${color.violet} !important` }} />}
                label="YOU'RE IN"
                sx={{
                  height: 22,
                  fontWeight: 800,
                  fontSize: '0.6rem',
                  letterSpacing: 0.8,
                  color: color.violet,
                  bgcolor: tint(color.violet, 0.12),
                  border: `1px solid ${tint(color.violet, 0.3)}`,
                }}
              />
            )}
          </Stack>

          <Typography
            component="h1"
            sx={{
              color: color.text,
              fontWeight: 900,
              fontSize: { xs: '1.5rem', md: '2rem' },
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {event.title}
          </Typography>

          {/* Facts as a grid — reads as one block instead of drifting chips. */}
          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              mt: 2.5,
            }}
          >
            <Fact
              icon={CalendarMonthRoundedIcon}
              label="Date"
              value={
                event.date
                  ? event.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long' })
                  : 'To be announced'
              }
            />
            <Fact icon={ScheduleRoundedIcon} label="Time" value={event.time} />
            <Fact icon={PlaceOutlinedIcon} label="Venue" value={event.location} />
          </Box>

          {event.description && (
            <Typography
              sx={{
                color: color.textMuted,
                lineHeight: 1.8,
                whiteSpace: 'pre-line',
                mt: 3,
                fontSize: '0.95rem',
              }}
            >
              {event.description}
            </Typography>
          )}

          {event.modes.length > 0 && (
            <Box sx={{ mt: 3.5 }}>
              <SectionLabel>What happens here</SectionLabel>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                {event.modes.map((m) => (
                  <Chip
                    key={m.type}
                    label={m.type.replace('-', ' ')}
                    sx={{
                      textTransform: 'capitalize',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: color.indigo,
                      bgcolor: tint(color.indigo, 0.1),
                      border: `1px solid ${tint(color.indigo, 0.25)}`,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* CTAs — stacked on phones, side by side once there's room. */}
          <Box
            sx={{
              display: 'grid',
              gap: 1.25,
              gridTemplateColumns: { xs: '1fr', sm: isRegistered ? '1fr 1fr' : '1fr' },
              mt: 4,
              maxWidth: { sm: isRegistered ? '100%' : 380 },
            }}
          >
            <Button
              variant="contained"
              disableElevation
              startIcon={isRegistered ? <QrCode2RoundedIcon /> : <BoltRoundedIcon />}
              onClick={() => router.push(`/event/dashboard/${event.id}/${isRegistered ? 'pass' : 'register'}`)}
              sx={{
                minHeight: 52,
                borderRadius: `${radius.md}px`,
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.95rem',
                bgcolor: isRegistered ? 'rgba(255,255,255,0.06)' : color.brand,
                color: isRegistered ? color.text : color.bg,
                border: isRegistered ? `1px solid ${color.borderStrong}` : 'none',
                '&:hover': {
                  bgcolor: isRegistered ? 'rgba(255,255,255,0.1)' : color.brand,
                  filter: isRegistered ? 'none' : 'brightness(1.08)',
                },
              }}
            >
              {isRegistered ? 'My pass' : 'Register for this event'}
            </Button>

            {isRegistered && (
              <Button
                variant="contained"
                disableElevation
                startIcon={<BoltRoundedIcon />}
                onClick={() => router.push(`/event/dashboard/${event.id}/lobby`)}
                sx={{
                  minHeight: 52,
                  borderRadius: `${radius.md}px`,
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  bgcolor: event.isLive ? color.green : color.brand,
                  color: color.bg,
                  '&:hover': { filter: 'brightness(1.08)' },
                }}
              >
                {event.isLive ? 'Join live now' : 'Live lobby'}
              </Button>
            )}
          </Box>
          </Box>
        </Box>
      )}
    </AsyncBoundary>
  );
}

/**
 * Poster.
 *
 * `object-fit: contain` on a blurred backdrop, because these posters are square
 * or portrait artwork with baked-in typography — `cover` cropped the subject and
 * sliced the poster's own headline in half.
 *
 * The image is absolutely positioned so it can never push the container past its
 * aspect ratio: a 1600x1599 poster was forcing a 16:10 box to 357px tall.
 */
function Poster({ event }) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(event.imageUrl) && !failed;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        // Mobile: a wide-ish banner. Wide panes: a portrait card in the side
        // column, which suits square/portrait artwork with no letterboxing.
        aspectRatio: { xs: '16 / 10', lg: '4 / 5' },
        mb: { xs: 0, lg: 0 },
        borderRadius: `${radius.lg}px`,
        overflow: 'hidden',
        bgcolor: '#07070b',
        border: `1px solid ${color.border}`,
        position: 'relative',
      }}
    >
      {hasImage ? (
        <>
          {/* Blurred fill so letterbox bars aren't dead black. */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${event.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(30px) saturate(1.2)',
              opacity: 0.4,
              transform: 'scale(1.2)',
            }}
          />
          <Box
            component="img"
            src={event.imageUrl}
            alt={`${event.title} poster`}
            onError={() => setFailed(true)}
            sx={{
              position: 'absolute',
              inset: 0,
              margin: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </>
      ) : (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: `linear-gradient(135deg, ${tint(color.violet, 0.25)}, ${tint(color.brand, 0.12)})`,
          }}
        >
          <ImageNotSupportedOutlinedIcon sx={{ fontSize: 32, color: color.textFaint }} />
        </Box>
      )}
    </Box>
  );
}

function StatusPill({ event }) {
  const s = event.isLive
    ? { label: '● LIVE NOW', tone: color.green }
    : event.isToday
      ? { label: 'TODAY', tone: color.amber }
      : event.isUpcoming
        ? { label: 'UPCOMING', tone: color.brand }
        : { label: 'ENDED', tone: color.textFaint };

  return (
    <Chip
      size="small"
      label={s.label}
      sx={{
        height: 22,
        fontWeight: 800,
        fontSize: '0.6rem',
        letterSpacing: 0.8,
        color: s.tone,
        bgcolor: tint(s.tone, 0.12),
        border: `1px solid ${tint(s.tone, 0.3)}`,
      }}
    />
  );
}

function SectionLabel({ children }) {
  return (
    <Typography
      sx={{
        color: color.textFaint,
        fontSize: '0.66rem',
        fontWeight: 800,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        mb: 1.25,
      }}
    >
      {children}
    </Typography>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{
        px: 1.75,
        py: 1.5,
        borderRadius: `${radius.md}px`,
        bgcolor: 'rgba(255,255,255,0.025)',
        border: `1px solid ${color.border}`,
        minWidth: 0,
      }}
    >
      <Icon sx={{ fontSize: 18, color: color.brand, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: color.textFaint, fontSize: '0.62rem', fontWeight: 700, letterSpacing: 0.8 }}>
          {label.toUpperCase()}
        </Typography>
        <Typography className="pxe-clamp-1" sx={{ color: color.text, fontSize: '0.85rem', fontWeight: 600 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

'use client';

/**
 * One event in the list. Ported from the Flutter event list card.
 *
 * The whole card is the tap target (mobile pattern), and the trailing CTA
 * derives from registration state exactly like `event_detail_screen.dart:220-232`:
 * one control whose label, colour and destination all come from one boolean.
 */

import { Box, Chip, Stack, Typography } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { color, radius, tint } from '@/theme/tokens';

function statusOf(event) {
  if (event.isLive) return { label: 'LIVE NOW', tone: color.green, pulse: true };
  if (event.isToday) return { label: 'TODAY', tone: color.amber };
  if (event.isUpcoming) return { label: 'UPCOMING', tone: color.brand };
  return { label: 'ENDED', tone: color.textFaint };
}

const DATE_FMT = { day: 'numeric', month: 'short' };

export default function EventCard({ event, isRegistered = false, selected = false, onClick }) {
  const status = statusOf(event);

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      className="pxe-lift pxe-tap"
      aria-current={selected ? 'true' : undefined}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        appearance: 'none',
        font: 'inherit',
        p: 2,
        borderRadius: `${radius.lg}px`,
        bgcolor: selected ? tint(color.brand, 0.07) : color.surface,
        border: `1px solid ${selected ? tint(color.brand, 0.45) : color.border}`,
        '&:focus-visible': { outline: `2px solid ${color.brand}`, outlineOffset: 2 },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {/* Date block — scannable anchor on both breakpoints */}
        <Box
          aria-hidden
          sx={{
            flexShrink: 0,
            width: 52,
            py: 1,
            borderRadius: `${radius.md}px`,
            bgcolor: tint(status.tone, 0.1),
            border: `1px solid ${tint(status.tone, 0.25)}`,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: status.tone, fontWeight: 800, fontSize: '1.15rem', lineHeight: 1 }}>
            {event.date ? event.date.toLocaleDateString(undefined, { day: 'numeric' }) : '--'}
          </Typography>
          <Typography sx={{ color: tint(status.tone, 0.75), fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, mt: 0.25 }}>
            {event.date ? event.date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : 'TBA'}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Chip
              size="small"
              label={status.label}
              sx={{
                height: 20,
                fontSize: '0.6rem',
                fontWeight: 800,
                letterSpacing: 0.8,
                color: status.tone,
                bgcolor: tint(status.tone, 0.12),
                border: `1px solid ${tint(status.tone, 0.3)}`,
                ...(status.pulse && {
                  animation: 'liveBlink 1.8s ease-in-out infinite',
                  '@keyframes liveBlink': { '50%': { opacity: 0.55 } },
                  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }),
              }}
            />
            {isRegistered && (
              <Chip
                size="small"
                icon={<QrCode2RoundedIcon sx={{ fontSize: 13, color: `${color.violet} !important` }} />}
                label="REGISTERED"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: color.violet,
                  bgcolor: tint(color.violet, 0.12),
                  border: `1px solid ${tint(color.violet, 0.3)}`,
                }}
              />
            )}
          </Stack>

          <Typography
            className="pxe-clamp-1"
            sx={{ color: color.text, fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.35 }}
          >
            {event.title}
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
            <Meta icon={ScheduleRoundedIcon} text={event.time} />
            <Meta icon={PlaceOutlinedIcon} text={event.location} />
          </Stack>

          {event.tags.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
              {event.tags.slice(0, 3).map((tag) => (
                <Box
                  key={tag}
                  sx={{
                    px: 0.9,
                    py: 0.2,
                    borderRadius: `${radius.pill}px`,
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    color: color.textMuted,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${color.border}`,
                  }}
                >
                  {tag}
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        <Box sx={{ alignSelf: 'center', display: 'flex', alignItems: 'center', color: color.textFaint }}>
          {event.isLive ? (
            <BoltRoundedIcon sx={{ fontSize: 20, color: color.green }} />
          ) : (
            <ChevronRightRoundedIcon sx={{ fontSize: 20 }} />
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function Meta({ icon: Icon, text }) {
  return (
    <Stack direction="row" spacing={0.4} alignItems="center" sx={{ minWidth: 0 }}>
      <Icon sx={{ fontSize: 13, color: color.textFaint }} />
      <Typography
        className="pxe-clamp-1"
        sx={{ color: color.textMuted, fontSize: '0.74rem', minWidth: 0 }}
      >
        {text}
      </Typography>
    </Stack>
  );
}

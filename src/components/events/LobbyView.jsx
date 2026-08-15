'use client';

/**
 * The live lobby — port of `screens/events/live_event_lobby_screen.dart`.
 *
 * This is the piece the website never had. The server already publishes what is
 * live (`/api/flutter/events/status`); this subscribes on the same cadence the
 * mobile app uses and lets the returned type decide what renders.
 *
 * The server owns the state machine. This is a subscriber, not a controller.
 */

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { color, radius, tint } from '@/theme/tokens';
import { useEventStatus } from '@/hooks/queries/useEventQueries';
import { POLL } from '@/config/constants';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import ErrorBoundary from '@/components/async/ErrorBoundary';
import ActivityRenderer, { metaFor } from './activities';

export default function LobbyView({ event, participantId }) {
  const [openActivityId, setOpenActivityId] = useState(null);

  // Poll faster while an activity is open — host-paced quizzes advance between
  // renders and the mobile app does the same (5s inside, 30s in the lobby).
  const statusQuery = useEventStatus(event.id, participantId, { fast: Boolean(openActivityId) });
  const status = statusQuery.data;
  const activity = status?.activeActivity ?? null;

  // If the organiser ends the activity we were in, fall back to the lobby
  // rather than leaving a dead screen open.
  useEffect(() => {
    if (openActivityId && activity?.id !== openActivityId) setOpenActivityId(null);
  }, [activity?.id, openActivityId]);

  const isOpen = Boolean(openActivityId) && activity?.id === openActivityId;

  // A poll that failed while we still hold a previous status: the screen is
  // showing something real but no longer current, and the participant needs to
  // know that before they trust an idle lobby.
  const isStale = statusQuery.isError && Boolean(status);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <LobbyHeader
        event={event}
        status={status}
        isFetching={statusQuery.isFetching}
        isStale={isStale}
      />

      <AsyncBoundary query={statusQuery} loadingLabel="Connecting to the event">
        {() =>
          isOpen ? (
            // Scoped so a malformed activity payload costs the participant the
            // activity, not the lobby — the poll underneath stays alive and
            // will pick up whatever the organiser starts next.
            <ErrorBoundary
              label={`activity:${activity?.type}`}
              resetKey={activity?.id}
              fallback={(err, reset) => (
                <ActivityCrashed error={err} onRetry={reset} onExit={() => setOpenActivityId(null)} />
              )}
            >
              <ActivityRenderer
                activity={activity}
                participantId={participantId}
                onExit={() => setOpenActivityId(null)}
              />
            </ErrorBoundary>
          ) : activity ? (
            <LiveActivityCard activity={activity} onJoin={() => setOpenActivityId(activity.id)} />
          ) : (
            <IdleState />
          )
        }
      </AsyncBoundary>
    </Box>
  );
}

function LobbyHeader({ event, status, isFetching, isStale }) {
  const live = Boolean(status?.activeActivity);

  let connection;
  if (isStale) connection = "can't reach the server — retrying";
  else if (isFetching) connection = 'syncing…';
  else connection = `checks every ${Math.round(POLL.LOBBY_MS / 1000)}s`;

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: 2,
        borderBottom: `1px solid ${color.border}`,
        bgcolor: color.surface,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography className="pxe-clamp-1" sx={{ color: color.text, fontWeight: 800 }}>
            {event.title}
          </Typography>
          <Typography
            sx={{ color: isStale ? color.amber : color.textFaint, fontSize: '0.72rem', mt: 0.25 }}
          >
            {live ? 'An activity is running' : 'Waiting for the organiser'}
            {' · '}
            {connection}
          </Typography>
        </Box>

        <Chip
          size="small"
          label={isStale ? 'OFFLINE' : live ? 'LIVE' : 'IDLE'}
          sx={{
            flexShrink: 0,
            fontWeight: 800,
            fontSize: '0.62rem',
            letterSpacing: 1,
            color: isStale ? color.amber : live ? color.green : color.textFaint,
            bgcolor: tint(isStale ? color.amber : live ? color.green : color.textFaint, 0.12),
            border: `1px solid ${tint(isStale ? color.amber : live ? color.green : color.textFaint, 0.3)}`,
            ...(live && !isStale && {
              animation: 'lobbyPulse 1.8s ease-in-out infinite',
              '@keyframes lobbyPulse': { '50%': { opacity: 0.55 } },
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }),
          }}
        />
      </Stack>
    </Box>
  );
}

function ActivityCrashed({ error, onRetry, onExit }) {
  return (
    <Box role="alert" sx={{ p: 4, textAlign: 'center' }}>
      <Typography sx={{ color: color.text, fontWeight: 700 }}>
        This activity couldn&apos;t be displayed
      </Typography>
      <Typography sx={{ color: color.textMuted, mt: 1, fontSize: '0.88rem', lineHeight: 1.6 }}>
        The lobby is still connected — you&apos;ll see the next activity as soon as it starts.
      </Typography>
      {process.env.NODE_ENV !== 'production' && (
        <Typography sx={{ mt: 1.5, color: color.textFaint, fontSize: '0.72rem', fontFamily: 'monospace' }}>
          {error?.message}
        </Typography>
      )}
      <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
        <Button onClick={onRetry} variant="contained" disableElevation
          sx={{ minHeight: 44, px: 2.5, borderRadius: `${radius.md}px`, textTransform: 'none', fontWeight: 800, bgcolor: color.brand, color: color.bg }}>
          Try again
        </Button>
        <Button onClick={onExit} variant="outlined"
          sx={{ minHeight: 44, px: 2.5, borderRadius: `${radius.md}px`, textTransform: 'none', fontWeight: 700, color: color.text, borderColor: color.borderStrong }}>
          Back to lobby
        </Button>
      </Stack>
    </Box>
  );
}

/**
 * The "an activity just went live" card — the web equivalent of the animated
 * banner + confirm dialog at `live_event_lobby_screen.dart:134-149`.
 */
function LiveActivityCard({ activity, onJoin }) {
  const meta = metaFor(activity.type);
  const Icon = meta.icon;
  const submitted = activity.hasSubmitted;

  // "Did this activity just appear?" — tracked in an effect, not by writing a
  // ref during render. A render-time write is not safe under StrictMode or a
  // re-render React discards, and it made the entrance animation fire on
  // renders that weren't a new activity at all.
  const seen = useRef(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    setIsNew(seen.current !== null && seen.current !== activity.id);
    seen.current = activity.id;
  }, [activity.id]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          p: 3,
          borderRadius: `${radius.lg}px`,
          bgcolor: tint(meta.tone, 0.06),
          border: `1px solid ${tint(meta.tone, 0.35)}`,
          textAlign: 'center',
          ...(isNew && {
            animation: 'activityIn 420ms cubic-bezier(0.2, 0.9, 0.3, 1)',
            '@keyframes activityIn': {
              from: { opacity: 0, transform: 'translateY(12px) scale(0.98)' },
              to: { opacity: 1, transform: 'none' },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }),
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 1.5,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            bgcolor: tint(meta.tone, 0.14),
            border: `1px solid ${tint(meta.tone, 0.35)}`,
          }}
        >
          <Icon sx={{ fontSize: 30, color: meta.tone }} />
        </Box>

        <Typography sx={{ color: meta.tone, fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1.5 }}>
          {meta.label.toUpperCase()} · LIVE NOW
        </Typography>

        <Typography sx={{ color: color.text, fontWeight: 800, fontSize: '1.15rem', mt: 0.5 }}>
          {activity.title}
        </Typography>

        {activity.description && (
          <Typography sx={{ color: color.textMuted, fontSize: '0.88rem', mt: 1, lineHeight: 1.6 }}>
            {activity.description}
          </Typography>
        )}

        {submitted && (
          <Stack direction="row" spacing={0.75} justifyContent="center" alignItems="center" sx={{ mt: 1.5 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: color.green }} />
            <Typography sx={{ color: color.green, fontSize: '0.78rem', fontWeight: 700 }}>
              You&apos;ve already taken part
            </Typography>
          </Stack>
        )}

        <Button
          onClick={onJoin}
          variant="contained"
          disableElevation
          fullWidth
          startIcon={submitted ? <CheckCircleRoundedIcon /> : <BoltRoundedIcon />}
          sx={{
            mt: 2.5,
            minHeight: 48,
            borderRadius: `${radius.md}px`,
            textTransform: 'none',
            fontWeight: 800,
            letterSpacing: 0.5,
            bgcolor: submitted ? 'rgba(255,255,255,0.08)' : meta.tone,
            color: submitted ? color.text : color.bg,
            '&:hover': { bgcolor: submitted ? 'rgba(255,255,255,0.12)' : meta.tone, filter: 'brightness(1.08)' },
          }}
        >
          {submitted ? 'View my result' : 'Join now'}
        </Button>
      </Box>
    </Box>
  );
}

function IdleState() {
  return (
    <EmptyState
      icon={HourglassEmptyRoundedIcon}
      title="No activity is live right now"
      message="Keep this open. When the organiser starts a quiz, vote or hunt, it appears here automatically — no need to refresh."
      accent={color.textMuted}
    />
  );
}

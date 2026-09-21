'use client';

/**
 * The qualifier board in the lobby — which teams are through to each round.
 *
 * Rounds sat on paper leave nothing in the database, so this list is whatever
 * the organiser published from the console. It is read-only and deliberately
 * plain: a team looking for its own name during the five minutes after a cut
 * should find it without reading anything else on the screen.
 *
 * Renders nothing at all until a roster is published, so a lobby at an event
 * that never uses rounds is unchanged.
 */

import { useState } from 'react';
import { Box, Chip, Collapse, Stack, Typography } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { color, radius, tint } from '@/theme/tokens';
import { useEventRounds } from '@/hooks/queries/useEventQueries';

const FORMAT_LABEL = {
  paper: 'On paper',
  live: 'Live round',
  online: 'Online',
  other: '',
};

export default function RoundRoster({ eventId }) {
  const { data } = useEventRounds(eventId);
  const rounds = data?.rounds ?? [];

  // The newest published round is the one the room is asking about. Earlier
  // ones stay as history, a tap away.
  //
  // `chosen === undefined` means the participant has not touched the board, so
  // it follows the newest round as rosters are published. Derived rather than
  // synced in an effect: a poll returns a fresh array every minute, and an
  // effect keyed on it would re-run — and re-render — on every one of them.
  const [chosen, setChosen] = useState(undefined);
  const latestId = rounds.length ? rounds[rounds.length - 1].id : null;
  const openId = chosen === undefined ? latestId : chosen;

  if (!rounds.length) return null;

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <EmojiEventsRoundedIcon sx={{ fontSize: 16, color: color.textFaint }} />
        <Typography sx={{ color: color.textFaint, fontSize: '0.64rem', fontWeight: 800, letterSpacing: 1.2 }}>
          WHO IS THROUGH
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        {[...rounds].reverse().map((round) => (
          <RoundCard
            key={round.id}
            round={round}
            hasTeam={Boolean(data?.yourTeamId)}
            open={openId === round.id}
            onToggle={() => setChosen(openId === round.id ? null : round.id)}
          />
        ))}
      </Stack>
    </Box>
  );
}

function RoundCard({ round, hasTeam, open, onToggle }) {
  // Three states, not two. A participant with no team of their own is told who
  // advanced; they are never told they personally did not, because for a solo
  // viewer that is not a fact about them.
  const verdict = !hasTeam ? null : round.youAreIn ? 'in' : 'out';
  const tone = verdict === 'in' ? color.green : verdict === 'out' ? color.textMuted : color.brand;
  const formatLabel = FORMAT_LABEL[round.format] ?? '';

  return (
    <Box
      sx={{
        borderRadius: `${radius.lg}px`,
        border: `1px solid ${verdict === 'in' ? tint(color.green, 0.35) : color.border}`,
        bgcolor: verdict === 'in' ? tint(color.green, 0.05) : color.surface,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        sx={{ px: 2, py: 1.75, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography className="pxe-clamp-1" sx={{ color: color.text, fontWeight: 800, fontSize: '0.92rem' }}>
            Round {round.roundNumber} · {round.title}
          </Typography>
          <Typography sx={{ color: color.textFaint, fontSize: '0.72rem', mt: 0.25 }}>
            {round.teamCount} {round.teamCount === 1 ? 'team' : 'teams'} through
            {formatLabel ? ` · ${formatLabel}` : ''}
            {round.status === 'completed' ? ' · finished' : ''}
          </Typography>
        </Box>

        {verdict && (
          <Chip
            size="small"
            label={verdict === 'in' ? "YOU'RE IN" : 'NOT THROUGH'}
            sx={{
              flexShrink: 0,
              fontWeight: 800,
              fontSize: '0.6rem',
              letterSpacing: 0.8,
              color: tone,
              bgcolor: tint(tone, 0.12),
              border: `1px solid ${tint(tone, 0.3)}`,
            }}
          />
        )}

        <ExpandMoreRoundedIcon
          sx={{
            flexShrink: 0,
            color: color.textFaint,
            transition: 'transform 180ms',
            transform: open ? 'rotate(180deg)' : 'none',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />
      </Stack>

      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 2, pb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {round.teams.map((team) => (
            <Chip
              key={team.teamId}
              size="small"
              label={team.isYou ? `${team.teamName} · you` : team.teamName}
              sx={{
                maxWidth: '100%',
                fontWeight: team.isYou ? 800 : 600,
                fontSize: '0.74rem',
                color: team.isYou ? color.green : color.textMuted,
                bgcolor: team.isYou ? tint(color.green, 0.14) : color.surface2,
                border: `1px solid ${team.isYou ? tint(color.green, 0.4) : color.border}`,
              }}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

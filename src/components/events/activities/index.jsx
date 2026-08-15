'use client';

/**
 * Activity renderer — the web transcription of
 * `live_event_lobby_screen.dart:151-195`.
 *
 * The server names the activity type; this switch picks the view. Adding a
 * sixth activity type server-side means adding one case here and nothing else.
 */

import { Box, Button, Stack, Typography } from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import HowToVoteRoundedIcon from '@mui/icons-material/HowToVoteRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import LiveTvRoundedIcon from '@mui/icons-material/LiveTvRounded';
import { color, radius, tint } from '@/theme/tokens';
import { useSubmitVote, useVoteResults } from '@/hooks/queries/useEventQueries';
import Loading from '@/components/async/Loading';
import QuizActivity from './QuizActivity';
import KbcActivity from './kbc/KbcActivity';

/** Icon + accent per activity type — `_typeMeta` in the Flutter lobby. */
export const ACTIVITY_META = {
  quiz: { icon: QuizRoundedIcon, tone: color.brand, label: 'Quiz' },
  voting: { icon: HowToVoteRoundedIcon, tone: color.violet, label: 'Voting' },
  hunt: { icon: ExploreRoundedIcon, tone: color.amber, label: 'Treasure hunt' },
  external: { icon: OpenInNewRoundedIcon, tone: color.indigo, label: 'External game' },
  announcement: { icon: CampaignRoundedIcon, tone: color.green, label: 'Announcement' },
};

export const metaFor = (type) => ACTIVITY_META[type] ?? { icon: LiveTvRoundedIcon, tone: color.brand, label: 'Activity' };

export default function ActivityRenderer({ activity, participantId, eventId, onExit }) {
  switch (activity.type) {
    case 'quiz':
      // KBC is a live show with roles, not a worksheet everyone fills in.
      return activity.quiz?.quizType === 'kbc' ? (
        <KbcActivity activity={activity} participantId={participantId} eventId={eventId} onExit={onExit} />
      ) : (
        <QuizActivity activity={activity} participantId={participantId} onExit={onExit} />
      );
    case 'voting':
      return <VotingActivity activity={activity} participantId={participantId} onExit={onExit} />;
    case 'hunt':
      return <HuntActivity activity={activity} onExit={onExit} />;
    case 'external':
      return <ExternalActivity activity={activity} onExit={onExit} />;
    case 'announcement':
      return <AnnouncementActivity activity={activity} onExit={onExit} />;
    default:
      return <UnknownActivity activity={activity} onExit={onExit} />;
  }
}

/* ── voting ─────────────────────────────────────────────────────────────── */

function VotingActivity({ activity, participantId, onExit }) {
  const voting = activity.voting;

  // Load the tally before offering a vote: a participant who already voted on
  // another device (or before a reload) must see their choice, not a fresh
  // ballot the server will answer with a 409.
  const tally = useVoteResults(activity.id, participantId, { live: voting.showLiveResults });
  const vote = useSubmitVote(activity.id, participantId);

  const state = tally.data ?? null;
  const myVote = state?.myVote ?? null;
  const hasVoted = Boolean(myVote);
  const locked = hasVoted || vote.isPending;

  // Only show percentages once we are allowed to and there is something to show.
  const showShares = Boolean(state?.resultsVisible && state.total > 0);

  if (tally.isPending && !state) {
    return (
      <Box sx={{ p: 4 }}>
        <Loading label="Opening the poll" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}>
        {voting.question}
      </Typography>
      <Typography sx={{ color: color.textFaint, fontSize: '0.72rem', mb: 2.5 }}>
        {state?.total
          ? `${state.total} vote${state.total === 1 ? '' : 's'} so far`
          : 'Be the first to vote'}
      </Typography>

      <Stack spacing={1.25} role="radiogroup" aria-label={voting.question}>
        {voting.options.map((option) => {
          const isMine = myVote === option;
          const share = showShares ? (state.results[option]?.percentage ?? 0) : null;

          return (
            <Box
              key={option}
              component="button"
              type="button"
              role="radio"
              aria-checked={isMine}
              disabled={locked}
              onClick={() => vote.mutate({ option })}
              className="pxe-tap"
              sx={{
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                textAlign: 'left',
                font: 'inherit',
                cursor: locked ? 'default' : 'pointer',
                px: 2,
                py: 1.5,
                borderRadius: `${radius.md}px`,
                color: color.text,
                bgcolor: isMine ? tint(color.violet, 0.12) : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isMine ? tint(color.violet, 0.6) : color.border}`,
                opacity: locked && !isMine ? 0.75 : 1,
                '&:focus-visible': { outline: `2px solid ${color.violet}`, outlineOffset: 2 },
              }}
            >
              {share != null && (
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: `${share}%`,
                    bgcolor: tint(color.violet, 0.14),
                    transition: 'width 400ms ease',
                  }}
                />
              )}
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ position: 'relative' }}>
                <span>{option}</span>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  {isMine && <CheckCircleRoundedIcon sx={{ fontSize: 17, color: color.violet }} />}
                  {share != null && <strong style={{ color: color.violet }}>{share}%</strong>}
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {/* A 409 is not a failure — the vote is on the server, we just didn't
          know about it. The refetch triggered by the mutation resolves it, so
          only report errors that are still unresolved. */}
      {vote.isError && !hasVoted && (
        <Typography sx={{ mt: 2, color: color.red, fontSize: '0.8rem', textAlign: 'center' }}>
          {vote.error.message}
        </Typography>
      )}

      {hasVoted && (
        <Typography sx={{ mt: 2, color: color.green, fontSize: '0.85rem', textAlign: 'center' }}>
          Vote recorded{state?.resultsVisible ? '' : ' — results stay hidden until the organiser shares them'}.
        </Typography>
      )}

      <BackButton onExit={onExit} tone={color.violet} />
    </Box>
  );
}

/* ── hunt ───────────────────────────────────────────────────────────────── */

function HuntActivity({ activity, onExit }) {
  const hunt = activity.hunt;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography sx={{ color: color.textMuted, fontSize: '0.72rem', fontWeight: 800, letterSpacing: 1.5, mb: 1 }}>
        {hunt.totalCheckpoints} CHECKPOINTS {hunt.ordered ? '· IN ORDER' : '· ANY ORDER'}
      </Typography>

      <Stack spacing={1.25}>
        {hunt.checkpoints.map((cp, i) => (
          <Box
            key={cp.checkpointId || i}
            sx={{
              p: 2,
              borderRadius: `${radius.md}px`,
              bgcolor: 'rgba(255,255,255,0.02)',
              border: `1px solid ${color.border}`,
            }}
          >
            <Typography sx={{ color: color.amber, fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1 }}>
              CHECKPOINT {i + 1}
            </Typography>
            <Typography sx={{ color: color.text, mt: 0.5 }}>{cp.hint}</Typography>
          </Box>
        ))}
      </Stack>

      <Typography sx={{ mt: 2.5, color: color.textFaint, fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.6 }}>
        Checkpoint QR codes are scanned in the Pixel Events mobile app.
        Hints stay in sync here.
      </Typography>

      <BackButton onExit={onExit} tone={color.amber} />
    </Box>
  );
}

/* ── external ───────────────────────────────────────────────────────────── */

/**
 * The only place the app renders a link whose href came out of the database.
 * Anything that isn't plain http(s) — `javascript:`, `data:` — is treated as
 * "not published yet" rather than handed to the browser.
 */
function safeExternalUrl(raw) {
  if (!raw) return null;
  try {
    // No base URL on purpose: this must resolve the same during SSR as it does
    // in the browser, and an organiser's game link is always absolute.
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function ExternalActivity({ activity, onExit }) {
  const ext = activity.external;
  const href = safeExternalUrl(ext.url);

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <OpenInNewRoundedIcon sx={{ fontSize: 44, color: color.indigo, mb: 1.5 }} />
      <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.05rem' }}>{activity.title}</Typography>
      {activity.description && (
        <Typography sx={{ color: color.textMuted, mt: 1, fontSize: '0.9rem' }}>{activity.description}</Typography>
      )}
      {ext.durationMinutes > 0 && (
        <Typography sx={{ color: color.textFaint, mt: 1, fontSize: '0.78rem' }}>
          {ext.durationMinutes} minutes · {ext.points} points
        </Typography>
      )}

      {href ? (
        <Button
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          disableElevation
          endIcon={<OpenInNewRoundedIcon />}
          sx={{
            mt: 3,
            minHeight: 48,
            px: 3,
            borderRadius: `${radius.md}px`,
            textTransform: 'none',
            fontWeight: 800,
            bgcolor: color.indigo,
          }}
        >
          Open the game
        </Button>
      ) : (
        <Typography sx={{ mt: 3, color: color.amber, fontSize: '0.85rem' }}>
          The organiser hasn&apos;t published the link yet.
        </Typography>
      )}

      <BackButton onExit={onExit} tone={color.indigo} />
    </Box>
  );
}

/* ── announcement ───────────────────────────────────────────────────────── */

function AnnouncementActivity({ activity, onExit }) {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <CampaignRoundedIcon sx={{ fontSize: 44, color: color.green, mb: 1.5 }} />
      <Typography sx={{ color: color.text, fontWeight: 800, fontSize: '1.15rem', mb: 1.5 }}>
        {activity.title}
      </Typography>
      <Typography sx={{ color: color.textMuted, fontSize: '1rem', lineHeight: 1.7, maxWidth: 460, mx: 'auto' }}>
        {activity.announcement.message}
      </Typography>
      <BackButton onExit={onExit} tone={color.green} />
    </Box>
  );
}

function UnknownActivity({ activity, onExit }) {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography sx={{ color: color.text, fontWeight: 700 }}>{activity.title}</Typography>
      <Typography sx={{ color: color.textMuted, mt: 1, fontSize: '0.88rem' }}>
        This activity type ({activity.type}) needs a newer version of the app.
      </Typography>
      <BackButton onExit={onExit} tone={color.brand} />
    </Box>
  );
}

function BackButton({ onExit, tone }) {
  return (
    <Button
      onClick={onExit}
      variant="outlined"
      fullWidth
      sx={{
        mt: 3,
        minHeight: 44,
        borderRadius: `${radius.md}px`,
        textTransform: 'none',
        fontWeight: 700,
        color: tone,
        borderColor: tint(tone, 0.4),
        '&:hover': { borderColor: tone, bgcolor: tint(tone, 0.08) },
      }}
    >
      Back to lobby
    </Button>
  );
}

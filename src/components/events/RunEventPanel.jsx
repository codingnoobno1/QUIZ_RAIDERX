'use client';

/**
 * Start the event.
 *
 * This is the control that did not exist. Activities lived in the database
 * with no screen to list them and no button to run one, so the lobby had
 * content nobody could reach and "how do I start it" had no answer.
 *
 * Renders only for organisers — the endpoint behind it is admin-gated, and a
 * participant's request 401s, which this treats as "not for you" and hides.
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SettingsRemoteRoundedIcon from '@mui/icons-material/SettingsRemoteRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { color, radius, tint } from '@/theme/tokens';
import {
  useActivities,
  useAdminRounds,
  useSwitchActivity,
  useUpdateActivity,
  useLiveCommand,
  useLiveConsole,
  useConfirmAdvancement,
} from '@/hooks/queries/useEventQueries';
import RoundManager from '@/components/events/RoundManager';

const TYPE_LABEL = {
  quiz: 'Quiz',
  voting: 'Poll',
  hunt: 'Treasure hunt',
  external: 'External game',
  announcement: 'Announcement',
};

export default function RunEventPanel({ eventId }) {
  const activitiesQuery = useActivities(eventId);
  const roundsQuery = useAdminRounds(eventId);
  const switchActivity = useSwitchActivity(eventId);
  const updateActivity = useUpdateActivity(eventId);
  const confirmAdvancement = useConfirmAdvancement(eventId);
  const [editing, setEditing] = useState(null);

  // 401/403 means this viewer is not an organiser. Nothing to say to them.
  if (activitiesQuery.isError) return null;
  if (!activitiesQuery.data) return null;

  const activities = activitiesQuery.data;
  const running = activities.find((a) => a.status === 'active') ?? null;

  return (
    <Box
      sx={{
        mt: 3,
        borderRadius: `${radius.lg}px`,
        border: `1px solid ${tint(color.amber, 0.28)}`,
        bgcolor: tint(color.amber, 0.04),
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${color.border}` }}
      >
        <SettingsRemoteRoundedIcon sx={{ fontSize: 18, color: color.amber }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: color.amber, fontSize: '0.7rem', fontWeight: 800, letterSpacing: 0.8 }}>
            ORGANISER CONTROLS
          </Typography>
          <Typography sx={{ color: color.textMuted, fontSize: '0.72rem' }}>
            {running
              ? `"${running.title}" is live — everyone in the lobby sees it now.`
              : 'Nothing is running. Start an activity to open the lobby.'}
          </Typography>
        </Box>
      </Stack>

      {activities.length === 0 ? (
        <Typography sx={{ p: 2.5, color: color.textMuted, fontSize: '0.85rem', lineHeight: 1.6 }}>
          This event has no activities yet. Create one in the admin console, then start it here.
        </Typography>
      ) : (
        <Stack sx={{ p: 1.25 }} spacing={1}>
          {activities.map((a) => {
            const isLive = a.status === 'active';
            return (
              <Stack
                key={a.id}
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ sm: 'center' }}
                spacing={1.25}
                sx={{
                  p: 1.5,
                  borderRadius: `${radius.md}px`,
                  bgcolor: isLive ? tint(color.green, 0.07) : color.surface,
                  border: `1px solid ${isLive ? tint(color.green, 0.3) : color.border}`,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography className="pxe-clamp-1" sx={{ color: color.text, fontSize: '0.86rem', fontWeight: 650 }}>
                      {a.title || 'Untitled activity'}
                    </Typography>
                    {isLive && (
                      <Box
                        sx={{
                          px: 0.9, py: 0.2, borderRadius: 999, fontSize: '0.6rem', fontWeight: 800,
                          color: color.green, bgcolor: tint(color.green, 0.12),
                          border: `1px solid ${tint(color.green, 0.3)}`,
                        }}
                      >
                        LIVE
                      </Box>
                    )}
                  </Stack>
                  <Typography sx={{ color: color.textFaint, fontSize: '0.68rem', mt: 0.3 }}>
                    {[
                      TYPE_LABEL[a.type] ?? a.type,
                      a.quizType && a.quizType !== 'rapid_fire' ? a.quizType : null,
                      a.questionCount ? `${a.questionCount} questions` : null,
                      a.scope ? `${a.scope} scoring` : null,
                      a.roundDurationSeconds ? `${Math.round(a.roundDurationSeconds / 60)} min round` : null,
                      a.phase && a.phase !== 'lobby' ? `phase: ${a.phase}` : null,
                      a.status !== 'active' ? a.status : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
                  {a.type === 'quiz' && (
                    <Ctl
                      tone={color.amber}
                      icon={TuneRoundedIcon}
                      busy={updateActivity.isPending}
                      onClick={() => setEditing(a)}
                    >
                      Configure
                    </Ctl>
                  )}
                  {a.type === 'quiz' && a.advancement?.count > 0 && !isLive && (
                    <Ctl
                      tone={color.brand}
                      icon={CheckCircleRoundedIcon}
                      busy={confirmAdvancement.isPending}
                      onClick={() => confirmAdvancement.mutate({
                        activityId: a.id,
                        count: a.advancement.count,
                        replace: Boolean(a.advancement.confirmedAt),
                      })}
                    >
                      {a.advancement.confirmedAt ? 'Reconfirm top' : `Confirm top ${a.advancement.count}`}
                    </Ctl>
                  )}
                  {isLive ? (
                    <Ctl
                      tone={color.red}
                      icon={StopRoundedIcon}
                      busy={switchActivity.isPending}
                      onClick={() => switchActivity.mutate({ activityId: a.id, action: 'stop' })}
                    >
                      Stop
                    </Ctl>
                  ) : (
                    <Ctl
                      primary
                      tone={color.green}
                      icon={PlayArrowRoundedIcon}
                      busy={switchActivity.isPending}
                      onClick={() => switchActivity.mutate({ activityId: a.id, action: 'start' })}
                    >
                      Start
                    </Ctl>
                  )}
                  {a.status === 'completed' && (
                    <Ctl
                      tone={color.textMuted}
                      icon={RestartAltRoundedIcon}
                      busy={switchActivity.isPending}
                      onClick={() => switchActivity.mutate({ activityId: a.id, action: 'reset' })}
                    >
                      Reset
                    </Ctl>
                  )}
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}

      {running?.quizType === 'custom_live' && <LiveRoundControls activity={running} />}

      {switchActivity.isError && (
        <Typography sx={{ px: 2.5, pb: 2, color: color.red, fontSize: '0.76rem' }}>
          {switchActivity.error.message}
        </Typography>
      )}

      {updateActivity.isError && (
        <Typography sx={{ px: 2.5, pb: 2, color: color.red, fontSize: '0.76rem' }}>
          {updateActivity.error.message}
        </Typography>
      )}

      {confirmAdvancement.isError && (
        <Typography sx={{ px: 2.5, pb: 2, color: color.red, fontSize: '0.76rem' }}>
          {confirmAdvancement.error.message}
        </Typography>
      )}

      <Typography sx={{ px: 2.5, pb: 2, color: color.textFaint, fontSize: '0.68rem', lineHeight: 1.6 }}>
        Starting one activity stops whatever else was running — the lobby shows one thing at a time.
      </Typography>

      <RoundManager eventId={eventId} />

      <QuizConfigDialog
        activity={editing}
        rounds={roundsQuery.data?.rounds ?? []}
        busy={updateActivity.isPending}
        onClose={() => setEditing(null)}
        onSave={({ quiz, questionType }) => updateActivity.mutate(
          { activityId: editing.id, quiz, questionType },
          { onSuccess: () => setEditing(null) },
        )}
      />
    </Box>
  );
}

function LiveRoundControls({ activity }) {
  const consoleQuery = useLiveConsole(activity.id);
  const command = useLiveCommand(activity.id);
  const state = consoleQuery.data;
  if (!state) return null;

  const roundState = state.state ?? 'idle';
  const index = state.questionIndex ?? 0;
  const lastQuestion = index >= (state.totalQuestions ?? 0) - 1;
  const secondsLeft = (endsAt) => endsAt
    ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000))
    : null;
  const questionLeft = secondsLeft(state.liveRound?.endsAt);
  const roundLeft = secondsLeft(state.roundClock?.endsAt);
  const send = (action, payload) => command.mutate({ action, payload });

  return (
    <Box sx={{ mx: 1.25, mb: 1.25, p: 1.5, borderRadius: `${radius.md}px`, border: `1px solid ${tint(color.brand, 0.3)}`, bgcolor: tint(color.brand, 0.05) }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1.25}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: color.brand, fontWeight: 800, fontSize: '0.68rem', letterSpacing: 0.8 }}>
            LIVE ROUND · {roundState.toUpperCase()}
          </Typography>
          <Typography className="pxe-clamp-1" sx={{ color: color.text, fontWeight: 700, fontSize: '0.82rem', mt: 0.25 }}>
            Q{index + 1}/{state.totalQuestions}: {state.question?.text ?? 'Ready to open the first question'}
          </Typography>
          <Typography sx={{ color: color.textMuted, fontSize: '0.67rem', mt: 0.25 }}>
            {state.answerCount ?? 0} answers
            {questionLeft !== null ? ` · question ${questionLeft}s` : ''}
            {roundLeft !== null ? ` · round ${Math.floor(roundLeft / 60)}:${String(roundLeft % 60).padStart(2, '0')}` : ''}
          </Typography>
        </Box>
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={0.75}>
          {roundState === 'idle' && (
            <Button size="small" variant="contained" disabled={command.isPending} onClick={() => send('OPEN_QUESTION', { questionIndex: index })}>
              Open question
            </Button>
          )}
          {roundState === 'open' && (
            <Button size="small" variant="outlined" disabled={command.isPending} onClick={() => send('LOCK_QUESTION')}>
              Lock
            </Button>
          )}
          {(roundState === 'open' || roundState === 'locked') && (
            <Button size="small" variant="outlined" disabled={command.isPending} onClick={() => send('REVEAL_QUESTION')}>
              Reveal
            </Button>
          )}
          {(roundState === 'locked' || roundState === 'revealed') && !lastQuestion && (
            <Button size="small" variant="contained" disabled={command.isPending} onClick={() => send('NEXT_QUESTION')}>
              Next question
            </Button>
          )}
          <Button size="small" color="error" disabled={command.isPending} onClick={() => send('END_ROUND')}>
            End round
          </Button>
        </Stack>
      </Stack>
      {command.isError && (
        <Typography sx={{ color: color.red, fontSize: '0.7rem', mt: 1 }}>{command.error.message}</Typography>
      )}
    </Box>
  );
}

function QuizConfigDialog({ activity, rounds, busy, onClose, onSave }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!activity) return;
    setForm({
      scope: activity.scope ?? 'individual',
      shuffle: activity.shuffle !== false,
      timePerQuestion: activity.timePerQuestion ?? 78,
      roundDurationSeconds: activity.roundDurationSeconds ?? 1800,
      qualificationRoundId: activity.qualificationRoundId ?? '',
      advancementCount: activity.advancement?.count ?? 0,
      targetRoundId: activity.advancement?.targetRoundId ?? '',
      questionType: activity.questionType === 'text' ? 'text' : 'choice',
    });
  }, [activity]);

  if (!form) return null;
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={Boolean(activity)} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Configure {activity?.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            select
            label="Scoring scope"
            value={form.scope}
            onChange={(event) => set('scope', event.target.value)}
            helperText="For team scope, the first teammate's answer is the team's answer."
          >
            <MenuItem value="individual">Individual</MenuItem>
            <MenuItem value="team">Team</MenuItem>
          </TextField>

          <TextField
            select
            label="Answer format"
            value={form.questionType}
            onChange={(event) => set('questionType', event.target.value)}
            helperText="Applies to every question; typed answers are matched after trimming spaces and ignoring case."
          >
            <MenuItem value="choice">Multiple choice</MenuItem>
            <MenuItem value="text">Typed / no choices</MenuItem>
          </TextField>

          <FormControlLabel
            control={(
              <Switch
                checked={form.shuffle}
                onChange={(event) => set('shuffle', event.target.checked)}
              />
            )}
            label="Shuffle question order"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              type="number"
              label="Seconds per question"
              value={form.timePerQuestion}
              onChange={(event) => set('timePerQuestion', event.target.value)}
              inputProps={{ min: 5, max: 600 }}
              fullWidth
            />
            <TextField
              type="number"
              label="Whole round (seconds)"
              value={form.roundDurationSeconds}
              onChange={(event) => set('roundDurationSeconds', event.target.value)}
              inputProps={{ min: 60, max: 14400 }}
              helperText="1800 = 30 minutes; this caps the complete host-paced round."
              fullWidth
            />
          </Stack>

          <TextField
            select
            label="Eligible teams roster"
            value={form.qualificationRoundId}
            onChange={(event) => set('qualificationRoundId', event.target.value)}
            disabled={form.scope !== 'team'}
            helperText="Only teams on this roster can see or answer the quiz."
          >
            <MenuItem value="">All registered teams</MenuItem>
            {rounds.map((round) => (
              <MenuItem key={round.id} value={round.id}>
                {round.roundNumber}. {round.title} ({round.teamCount})
              </MenuItem>
            ))}
          </TextField>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              type="number"
              label="Teams advancing"
              value={form.advancementCount}
              onChange={(event) => set('advancementCount', event.target.value)}
              inputProps={{ min: 0 }}
              fullWidth
            />
            <TextField
              select
              label="Populate next roster"
              value={form.targetRoundId}
              onChange={(event) => set('targetRoundId', event.target.value)}
              disabled={form.scope !== 'team'}
              helperText="Filled when standings are confirmed."
              fullWidth
            >
              <MenuItem value="">Do not auto-populate</MenuItem>
              {rounds.map((round) => (
                <MenuItem key={round.id} value={round.id}>{round.roundNumber}. {round.title}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button
          variant="contained"
          disabled={busy}
          onClick={() => onSave({
            questionType: form.questionType,
            quiz: {
              scope: form.scope,
              shuffle: form.shuffle,
              timePerQuestion: Number(form.timePerQuestion),
              roundDurationSeconds: Number(form.roundDurationSeconds),
              qualificationRoundId: form.scope === 'team' ? (form.qualificationRoundId || null) : null,
              advancement: {
                count: Number(form.advancementCount),
                targetRoundId: form.scope === 'team' ? (form.targetRoundId || null) : null,
              },
            },
          })}
        >
          Save configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Ctl({ children, icon: Icon, tone, primary, busy, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={busy}
      className="pxe-tap"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.6,
        minHeight: 34,
        px: 1.5,
        border: `1px solid ${primary ? tone : color.border}`,
        bgcolor: primary ? tone : color.surface2,
        color: primary ? '#061014' : tone,
        borderRadius: `${radius.sm}px`,
        font: 'inherit',
        fontWeight: 750,
        fontSize: '0.73rem',
        cursor: busy ? 'default' : 'pointer',
        opacity: busy ? 0.6 : 1,
        transition: 'filter 150ms ease',
        '&:hover': { filter: busy ? 'none' : 'brightness(1.1)' },
      }}
    >
      <Icon sx={{ fontSize: 15 }} />
      {children}
    </Box>
  );
}

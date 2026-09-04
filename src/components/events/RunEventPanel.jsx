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

import { Box, Stack, Typography } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SettingsRemoteRoundedIcon from '@mui/icons-material/SettingsRemoteRounded';
import { color, radius, tint } from '@/theme/tokens';
import { useActivities, useSwitchActivity } from '@/hooks/queries/useEventQueries';

const TYPE_LABEL = {
  quiz: 'Quiz',
  voting: 'Poll',
  hunt: 'Treasure hunt',
  external: 'External game',
  announcement: 'Announcement',
};

export default function RunEventPanel({ eventId }) {
  const activitiesQuery = useActivities(eventId);
  const switchActivity = useSwitchActivity(eventId);

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
                      a.phase && a.phase !== 'lobby' ? `phase: ${a.phase}` : null,
                      a.status !== 'active' ? a.status : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
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

      {switchActivity.isError && (
        <Typography sx={{ px: 2.5, pb: 2, color: color.red, fontSize: '0.76rem' }}>
          {switchActivity.error.message}
        </Typography>
      )}

      <Typography sx={{ px: 2.5, pb: 2, color: color.textFaint, fontSize: '0.68rem', lineHeight: 1.6 }}>
        Starting one activity stops whatever else was running — the lobby shows one thing at a time.
      </Typography>
    </Box>
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

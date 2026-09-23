'use client';

/**
 * Electric Answers — the buzzer round on a phone or a laptop.
 *
 * The server owns the phase. This screen draws `quiz.buzzer` from the status
 * poll and sends two calls: press, and (if this leader has the seat and the
 * question is in-app) answer. It never retries either call, and it never
 * treats an answer response as a verdict. The correct answer appears only
 * when the poll's reveal says the host has revealed it.
 */

import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import { color, radius, tint } from '@/theme/tokens';
import { useAnswerBuzzer, usePressBuzzer } from '@/hooks/queries/useEventQueries';
import { formatClock, useRemaining, useServerOffset } from './serverClock';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const PHASE_LABEL = {
  lobby: 'Welcome to Electric Answers',
  staged: 'Question on stage',
  countdown: 'Get ready',
  buzzing: 'The buzzer is open',
  seated: 'A team has the floor',
  judged_correct: 'Waiting for the host',
  judged_wrong: 'Waiting for the host',
  no_buzz: 'Buzz window closed',
  revealed: 'Answer revealed',
  completed: 'Round complete',
};

const REFUSAL = {
  NOT_LEADER: 'Only your team leader can buzz.',
  NOT_ELIGIBLE: 'Your team is not eligible for this question.',
  FALSE_START: 'Too early. Your team is locked out for this question.',
  LOCKED_OUT: 'Your team is locked out for this question.',
  BUZZ_CLOSED: 'The buzz window has closed.',
  ALREADY_PRESSED: 'Your team has already buzzed.',
  STALE_QUESTION: 'The host has moved to another question.',
  NOT_YOUR_SEAT: 'Another team has the seat.',
  SPOKEN_MODE: 'Answer aloud. The host will judge your answer.',
  TOO_LATE: 'The answer window has closed.',
  ALREADY_ANSWERED: 'Your team has already answered. Wait for the reveal.',
};

export default function ElectricAnswers({ activity, serverTime, onExit }) {
  const round = activity.quiz?.buzzer ?? null;
  const offset = useServerOffset(serverTime);
  const now = Date.now() + offset;
  const phase = phaseAt(round, now);

  const press = usePressBuzzer(activity.id);
  const answer = useAnswerBuzzer(activity.id);
  const [note, setNote] = useState(null);
  const [draft, setDraft] = useState('');
  const [pressedId, setPressedId] = useState(null);

  const deadline =
    phase === 'countdown' ? round?.armsAt
      : phase === 'buzzing' ? round?.buzzClosesAt
        : phase === 'seated' ? round?.answerEndsAt
          : null;
  const left = useRemaining(deadline, offset, Boolean(deadline));

  const canBuzz = Boolean(
    round?.canBuzz &&
    round.amLeader &&
    round.myTeam &&
    !round.lockedOut &&
    round.instanceId &&
    phase === 'buzzing' &&
    round.armsAt &&
    round.buzzClosesAt &&
    now >= new Date(round.armsAt).getTime() &&
    now < new Date(round.buzzClosesAt).getTime(),
  );

  const canAnswer = Boolean(
    round?.mySeat &&
    round.amLeader &&
    round.answerMode === 'in_app' &&
    round.phase === 'seated' &&
    round.answerEndsAt &&
    now < new Date(round.answerEndsAt).getTime(),
  );

  const buzz = () => {
    if (!canBuzz || press.isPending) return;
    setNote(null);
    press.mutate(round.instanceId, {
      onSuccess: (body) => {
        setPressedId(round.instanceId);
        setNote(body?.seated
          ? 'You have the seat. Answer now.'
          : `Buzz sent. You are #${body?.queuePosition ?? '—'} in the queue.`);
      },
      onError: (error) => setNote(REFUSAL[error?.code] || 'The buzz was not confirmed. It will not be sent again.'),
    });
  };

  const sendAnswer = (value) => {
    const text = String(value ?? '').trim();
    if (!canAnswer || !text || answer.isPending) return;
    setNote(null);
    answer.mutate(
      { instanceId: round.instanceId, answer: text },
      {
        onSuccess: () => {
          setDraft('');
          setNote('Answer sent. Waiting for the host.');
        },
        onError: (error) => setNote(REFUSAL[error?.code] || 'The answer was not confirmed. It will not be sent again.'),
      },
    );
  };

  const showBuzz = round && ['staged', 'countdown', 'buzzing'].includes(phase);
  const options = round?.question?.options ?? [];
  const qType = round?.question?.type;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: { xs: '100dvh', md: 'auto' }, bgcolor: color.bg }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, pt: 'max(10px, env(safe-area-inset-top, 0px))', pb: 1.25, borderBottom: `1px solid ${color.border}` }}
      >
        <Box>
          <Button onClick={onExit} sx={{ minHeight: 28, px: 0, py: 0, color: color.textMuted, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}>
            ← Lobby
          </Button>
          <Typography sx={{ color: color.amber, fontSize: '0.68rem', fontWeight: 800, letterSpacing: 1.3 }}>
            ELECTRIC ANSWERS{round?.isTiebreak ? ' · TIE-BREAK' : ''}
          </Typography>
        </Box>
        {deadline && (
          <Typography sx={{ color: left < 4000 ? color.red : color.text, fontWeight: 800, fontSize: '1.6rem', fontVariantNumeric: 'tabular-nums' }}>
            {phase === 'countdown' ? Math.max(1, Math.ceil(left / 1000)) : formatClock(left)}
          </Typography>
        )}
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', px: 2, py: 2 }}>
        <Typography sx={{ color: color.text, fontWeight: 800, fontSize: { xs: '1.45rem', md: '1.8rem' }, lineHeight: 1.15 }}>
          {PHASE_LABEL[phase] || 'Waiting for the host'}
        </Typography>
        <Typography sx={{ color: color.textMuted, mt: 1, lineHeight: 1.5 }}>
          {roleLine(round)}
        </Typography>

        {round?.question?.text && (
          <Box sx={{ mt: 2.5, p: 2, borderRadius: `${radius.lg}px`, border: `1px solid ${color.border}`, bgcolor: color.surface }}>
            <Typography sx={{ color: color.brand, fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1.4 }}>
              ON STAGE
            </Typography>
            <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.45, mt: 1.25 }}>
              {round.question.text}
            </Typography>
            {options.length > 0 && !canAnswer && (
              <Stack spacing={0.75} sx={{ mt: 2 }}>
                {options.map((option, i) => (
                  <Typography key={option} sx={{ color: color.textMuted, fontSize: '1rem' }}>
                    {LETTERS[i] ?? i + 1}. {option}
                  </Typography>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {round?.seat && (
          <Box sx={{ mt: 2, p: 2, borderRadius: `${radius.md}px`, bgcolor: tint(color.amber, 0.1), border: `1px solid ${tint(color.amber, 0.35)}` }}>
            <Typography sx={{ color: color.amber, fontWeight: 800 }}>
              {round.mySeat ? 'Your team has the seat' : `${round.seat.teamName} has the seat`}
            </Typography>
            <Typography sx={{ color: color.textMuted, fontSize: '0.88rem', mt: 0.5 }}>
              {round.seat.leaderName ? `${round.seat.leaderName} on the buzzer. ` : ''}
              {round.answerMode === 'spoken'
                ? (round.mySeat && round.amLeader && round.phase === 'seated'
                  ? 'SPEAK NOW. The host will judge.'
                  : 'The seated team answers aloud.')
                : 'Only the seated leader can submit.'}
            </Typography>
          </Box>
        )}

        {round?.myQueuePosition != null && (
          <Typography sx={{ color: color.brand, mt: 2, fontWeight: 700 }}>
            Your team is #{round.myQueuePosition} in the queue.
          </Typography>
        )}

        {canAnswer && (
          <Stack spacing={1.25} sx={{ mt: 2.5 }}>
            {(qType === 'mcq' || qType === 'truefalse') &&
              (options.length ? options : qType === 'truefalse' ? ['True', 'False'] : []).map((option, i) => (
                <Button
                  key={option}
                  onClick={() => sendAnswer(option)}
                  disabled={answer.isPending}
                  variant="outlined"
                  sx={{ minHeight: 52, justifyContent: 'flex-start', px: 2, textTransform: 'none', fontWeight: 700, fontSize: 16, color: color.text, borderColor: color.border }}
                >
                  {LETTERS[i] ? `${LETTERS[i]}. ` : ''}{option}
                </Button>
              ))}
            {qType === 'fillup' && (
              <>
                <TextField
                  fullWidth
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Your answer"
                  inputProps={{ maxLength: 500, 'aria-label': 'Your answer' }}
                  sx={{ '& .MuiOutlinedInput-root': { color: color.text, fontSize: 16 }, '& fieldset': { borderColor: color.border } }}
                />
                <Button
                  onClick={() => sendAnswer(draft)}
                  disabled={!draft.trim() || answer.isPending}
                  variant="contained"
                  disableElevation
                  sx={{ minHeight: 48, textTransform: 'none', fontWeight: 800, bgcolor: color.brand, color: color.bg }}
                >
                  {answer.isPending ? 'Sending…' : 'Submit answer'}
                </Button>
              </>
            )}
            {qType && !['mcq', 'truefalse', 'fillup'].includes(qType) && (
              <Typography sx={{ color: color.amber }}>This question format is not supported on this screen. Ask the host.</Typography>
            )}
          </Stack>
        )}

        {note && (
          <Typography sx={{ mt: 2, color: color.textMuted, lineHeight: 1.5 }} role="status">
            {note}
          </Typography>
        )}

        {round?.reveal?.correctAnswer && (
          <Box sx={{ mt: 2.5, p: 2, borderRadius: `${radius.md}px`, border: `1px solid ${tint(color.green, 0.35)}`, bgcolor: tint(color.green, 0.08) }}>
            <Typography sx={{ color: color.green, fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1.4 }}>HOST REVEAL</Typography>
            <Typography sx={{ color: color.text, fontWeight: 800, fontSize: '1.2rem', mt: 1 }}>{round.reveal.correctAnswer}</Typography>
          </Box>
        )}

        {round?.scoreboard?.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ color: color.textFaint, fontSize: '0.68rem', fontWeight: 800, letterSpacing: 1.2, mb: 1 }}>
              TEAM STANDINGS
            </Typography>
            <Stack spacing={0.75}>
              {round.scoreboard.map((row) => (
                <Stack key={row.teamId || row.teamName} direction="row" alignItems="center" sx={{ px: 1.5, py: 1.25, borderRadius: `${radius.md}px`, border: `1px solid ${color.border}` }}>
                  <Typography sx={{ flex: 1, color: color.text, fontWeight: 700 }}>{row.teamName}</Typography>
                  <Typography sx={{ color: color.brand, fontWeight: 800, fontSize: '1.15rem', fontVariantNumeric: 'tabular-nums' }}>{row.score}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {showBuzz && (
        <Box sx={{ px: 2, pt: 1.25, pb: 'max(12px, env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${color.border}`, bgcolor: color.bg }}>
          <Button
            fullWidth
            onClick={buzz}
            disabled={!canBuzz || press.isPending}
            variant="contained"
            disableElevation
            startIcon={<BoltRoundedIcon />}
            sx={{
              minHeight: 88,
              borderRadius: `${radius.lg}px`,
              textTransform: 'none',
              fontWeight: 900,
              fontSize: '1.45rem',
              letterSpacing: 1,
              bgcolor: canBuzz ? color.amber : 'rgba(255,255,255,0.06)',
              color: canBuzz ? '#1A1408' : color.textFaint,
            }}
          >
            {press.isPending ? 'Sending…'
              : pressedId && pressedId === round.instanceId ? 'Buzz sent'
                : phase === 'countdown' ? 'Get ready'
                  : round.lockedOut ? 'Locked out'
                    : 'BUZZ'}
          </Button>
          <Typography sx={{ mt: 1, textAlign: 'center', color: color.textFaint, fontSize: '0.75rem', lineHeight: 1.45 }}>
            First to the server wins the seat. Only the team leader can buzz.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function phaseAt(round, nowMs) {
  if (!round) return 'lobby';
  const { phase, armsAt, buzzClosesAt } = round;
  if ((phase === 'countdown' || phase === 'buzzing') && buzzClosesAt && nowMs >= new Date(buzzClosesAt).getTime()) {
    return 'no_buzz';
  }
  if (phase === 'countdown' && armsAt && nowMs >= new Date(armsAt).getTime()) return 'buzzing';
  return phase;
}

function roleLine(round) {
  if (!round) return 'Waiting for the host to open Electric Answers.';
  if (round.lockedOut) return 'Your team is locked out for this question. Stay for the reveal.';
  if (!round.myTeam) return 'Spectator mode. Electric Answers is a team round.';
  if (!round.amLeader) return `${round.myTeam.teamName} · Your leader controls the buzzer.`;
  return `${round.myTeam.teamName} · You control the buzzer. Buzz first. Answer right.`;
}

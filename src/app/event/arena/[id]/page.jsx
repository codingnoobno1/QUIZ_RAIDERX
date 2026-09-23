'use client';

/**
 * Projector for Electric Answers.
 *
 * Opens at /event/arena/:eventId. Polls GET /api/events/:id/arena, which the
 * engine will serve with no session and no answer before reveal.
 */

import { use, useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { color, radius, tint } from '@/theme/tokens';
import { formatClock, useRemaining, useServerOffset } from '@/components/events/activities/serverClock';

const HOT = new Set(['staged', 'countdown', 'buzzing', 'seated']);

export default function ArenaPage({ params }) {
  const { id } = use(params);
  const [payload, setPayload] = useState(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let stop = false;
    let timer;

    const tick = async () => {
      let phase = 'lobby';
      try {
        const res = await fetch(`/api/events/${id}/arena`, { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        const next = json?.data ?? json;
        phase = next?.phase || 'lobby';
        if (!stop) {
          setPayload(next);
          setOffline(false);
        }
      } catch {
        if (!stop) setOffline(true);
      }
      if (stop) return;
      const wait = HOT.has(phase) ? 500 : phase === 'lobby' || phase === 'completed' ? 10_000 : 2_000;
      timer = setTimeout(tick, wait);
    };

    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [id]);

  const round = payload;
  const offset = useServerOffset(round?.serverTime);
  const now = Date.now() + offset;
  const phase = derive(round, now);
  const deadline = phase === 'countdown' ? round?.armsAt : phase === 'buzzing' ? round?.buzzClosesAt : phase === 'seated' ? round?.answerEndsAt : null;
  const left = useRemaining(deadline, offset, Boolean(deadline));
  const seat = round?.seat;
  const rawPresses = round?.presses ?? round?.leadingPresses;
  const presses = Array.isArray(rawPresses) ? rawPresses : [];
  const revealed = phase === 'revealed' || phase === 'completed';

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#07080C', color: color.text, px: { xs: 2, md: 6 }, py: { xs: 3, md: 5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography sx={{ color: color.amber, fontWeight: 800, letterSpacing: 2, fontSize: '0.8rem' }}>
          ELECTRIC ANSWERS{round?.isTiebreak ? ' · TIE-BREAK' : ''}
        </Typography>
        <Typography sx={{ color: offline ? color.red : color.text, fontWeight: 800, fontSize: '1.4rem', fontVariantNumeric: 'tabular-nums' }}>
          {offline ? 'Reconnecting' : deadline ? (phase === 'countdown' ? Math.max(1, Math.ceil(left / 1000)) : formatClock(left)) : phaseLabel(phase)}
        </Typography>
      </Stack>

      <Typography sx={{ mt: 4, fontWeight: 900, fontSize: { xs: '2rem', md: '3.4rem' }, lineHeight: 1.15, maxWidth: 1100 }}>
        {round?.question?.text || phaseLabel(phase)}
      </Typography>

      {seat?.teamName && (
        <Typography sx={{ mt: 3, color: color.amber, fontWeight: 800, fontSize: { xs: '1.4rem', md: '2rem' } }}>
          {seat.teamName}{seat.leaderName ? `, ${seat.leaderName}` : ''} on the buzzer
        </Typography>
      )}

      {revealed && round?.reveal?.correctAnswer && (
        <Typography sx={{ mt: 3, color: color.green, fontWeight: 800, fontSize: { xs: '1.6rem', md: '2.4rem' } }}>
          {round.reveal.correctAnswer}
        </Typography>
      )}

      {presses.length > 0 && !revealed && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 3 }}>
          {presses.slice(0, 6).map((press, i) => (
            <Box key={`${press.teamName}-${i}`} sx={{ px: 1.5, py: 1, borderRadius: `${radius.md}px`, border: `1px solid ${i === 0 ? tint(color.amber, 0.5) : color.border}` }}>
              <Typography sx={{ fontWeight: 800 }}>{press.teamName}</Typography>
              <Typography sx={{ color: color.textFaint, fontSize: '0.8rem' }}>+{press.offsetMs ?? 0} ms</Typography>
            </Box>
          ))}
        </Stack>
      )}

      <Stack spacing={1} sx={{ mt: 6, maxWidth: 720 }}>
        {(round?.scoreboard ?? []).map((row, i) => (
          <Stack key={row.teamId || row.teamName} direction="row" alignItems="baseline" sx={{ py: 1.25, borderBottom: `1px solid ${color.border}` }}>
            <Typography sx={{ width: 40, color: color.textFaint, fontWeight: 800 }}>{i + 1}</Typography>
            <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '1.35rem' }}>{row.teamName}</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: color.brand, fontVariantNumeric: 'tabular-nums' }}>{row.score}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function derive(round, nowMs) {
  if (!round?.phase) return 'lobby';
  const { phase, armsAt, buzzClosesAt } = round;
  if ((phase === 'countdown' || phase === 'buzzing') && buzzClosesAt && nowMs >= new Date(buzzClosesAt).getTime()) return 'no_buzz';
  if (phase === 'countdown' && armsAt && nowMs >= new Date(armsAt).getTime()) return 'buzzing';
  return phase;
}

function phaseLabel(phase) {
  return {
    lobby: 'Waiting for the host',
    staged: 'Question on stage',
    countdown: 'Get ready',
    buzzing: 'Buzz',
    seated: 'Answer',
    judged_correct: 'Correct',
    judged_wrong: 'Passed',
    no_buzz: 'No buzz',
    revealed: 'Answer',
    completed: 'Round complete',
  }[phase] || 'Electric Answers';
}

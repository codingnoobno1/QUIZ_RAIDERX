'use client';

/**
 * Rock the Show — the buzzer-round stage.
 *
 * A room display for Electric Answers. It reads the host console, so the
 * operator can see the answer, and it plays that verdict on the stage: the
 * team on the floor, the question, then a correct or wrong animation.
 * The engine still owns the phase. This screen only posts the host commands.
 */

import { useCallback, useEffect, useState } from 'react';
import { keyframes } from '@emotion/react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';

const C = {
  bg: '#0C0E12',
  panel: '#14171D',
  line: 'rgba(255,255,255,0.08)',
  text: '#F6F4F0',
  muted: '#8E949E',
  faint: '#5C636E',
  brass: '#C4A574',
  correct: '#2F9E6B',
  correctInk: '#E8FFF3',
  wrong: '#D45656',
  wrongInk: '#FFECEC',
};

const wipe = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;
const stampIn = keyframes`
  0% { transform: scale(1.35) rotate(-8deg); opacity: 0; }
  70% { transform: scale(0.97) rotate(-2deg); opacity: 1; }
  100% { transform: scale(1) rotate(-3deg); opacity: 1; }
`;
const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  18% { transform: translateX(-14px); }
  36% { transform: translateX(12px); }
  54% { transform: translateX(-8px); }
  72% { transform: translateX(5px); }
`;

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function RockTheShow({ activityId: initialId = '' }) {
  const [activityId, setActivityId] = useState(initialId);
  const [draftId, setDraftId] = useState(initialId);
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [desk, setDesk] = useState(true);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/events/live/command?activityId=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not read the round.');
        return;
      }
      const next = data.data ?? data;
      setState(next);
      if (next?.serverTime) setOffset(new Date(next.serverTime).getTime() - Date.now());
      setError(next?.quizType && next.quizType !== 'buzzer' ? 'This activity is not a buzzer round.' : null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    if (!initialId) return;
    setActivityId(initialId);
    setDraftId(initialId);
    load(initialId);
  }, [initialId, load]);

  useEffect(() => {
    if (!activityId || state?.quizType !== 'buzzer') return undefined;
    const id = setInterval(() => load(activityId), 700);
    return () => clearInterval(id);
  }, [activityId, state?.quizType, load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const send = async (action) => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch('/api/events/live/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId, action, payload: {} }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || data?.message || `${action} was refused.`);
        return;
      }
      await load(activityId);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const openStage = () => {
    const id = draftId.trim();
    if (!id) return;
    setState(null);
    setActivityId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('activityId', id);
    window.history.replaceState(null, '', url);
    load(id);
  };

  if (!activityId || (state && state.quizType !== 'buzzer') || (error && !state)) {
    return <Gate draftId={draftId} setDraftId={setDraftId} error={error} onOpen={openStage} />;
  }

  if (!state) {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: C.bg, color: C.brass, display: 'grid', placeItems: 'center' }}>
        <Typography sx={{ letterSpacing: '0.28em', fontWeight: 700, fontSize: '0.72rem' }}>ROCK THE SHOW</Typography>
      </Box>
    );
  }

  const phase = state.phase || 'lobby';
  const seat = state.round?.seat;
  const question = state.question;
  const attempts = state.attempts ?? [];
  const submitted = seat?.submittedAnswer || attempts.at(-1)?.submittedAnswer || '';
  const correct = question?.correctAnswer || '';
  const showAnswer = phase === 'revealed' || phase === 'completed';
  const verdict =
    phase === 'judged_correct' ? 'correct'
      : phase === 'judged_wrong' ? 'wrong'
        : showAnswer ? 'answer'
          : null;
  const options = optionsFor(question);
  const clock = clockFor(state, now + offset);
  const stampKey = `${state.round?.instanceId || 'q'}-${phase}-${seat?.attempt ?? attempts.length}`;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: C.bg, color: C.text, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: { xs: 2.5, md: 5 }, pt: 3, pb: 1 }}>
        <Box>
          <Typography sx={{ color: C.brass, fontWeight: 700, letterSpacing: '0.28em', fontSize: '0.72rem' }}>
            ROCK THE SHOW
          </Typography>
          <Typography sx={{ color: C.faint, fontSize: '0.78rem', mt: 0.4 }}>
            Electric Answers{state.round?.isTiebreak ? ' · Tie-break' : ''}
          </Typography>
        </Box>
        <Stack direction="row" spacing={3} alignItems="baseline">
          <Typography sx={{ color: C.muted, fontVariantNumeric: 'tabular-nums', fontWeight: 650 }}>
            {(state.questionIndex ?? 0) + 1} / {state.totalQuestions || '—'}
          </Typography>
          <Typography sx={{ color: clock?.urgent ? C.wrong : C.text, fontWeight: 700, fontSize: '1.35rem', fontVariantNumeric: 'tabular-nums', minWidth: 72, textAlign: 'right' }}>
            {clock ? clock.label : phaseLabel(phase)}
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, px: { xs: 2.5, md: 5 }, pb: desk ? 2 : 5, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 280px' }, gap: { xs: 3, lg: 6 }, alignItems: 'start' }}>
        <Box sx={{ pt: { xs: 2, md: 4 }, position: 'relative' }}>
          <Typography sx={{ color: C.faint, fontSize: '0.72rem', letterSpacing: '0.16em', fontWeight: 700 }}>
            {seat ? 'ON THE FLOOR' : 'THE FLOOR'}
          </Typography>
          <Typography sx={{ fontWeight: 650, letterSpacing: '-0.04em', lineHeight: 0.95, fontSize: { xs: '2.6rem', md: '5.2rem' }, mt: 1 }}>
            {seat?.teamName || phaseLabel(phase)}
          </Typography>
          {seat?.leaderName && (
            <Typography sx={{ color: C.muted, fontSize: { xs: '1.05rem', md: '1.35rem' }, mt: 1.5 }}>
              {seat.leaderName}
            </Typography>
          )}

          {verdict && (
            <Verdict key={stampKey} kind={verdict} answer={showAnswer ? correct : ''} />
          )}

          {question?.text && (
            <Typography sx={{ mt: 5, maxWidth: 920, fontWeight: 560, fontSize: { xs: '1.35rem', md: '2.15rem' }, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              {question.text}
            </Typography>
          )}

          {options.length > 0 && (
            <Stack spacing={1.25} sx={{ mt: 3.5, maxWidth: 760 }}>
              {options.map((option, i) => (
                <OptionRow
                  key={option}
                  letter={LETTERS[i] || String(i + 1)}
                  text={option}
                  tone={toneFor(option, { phase, submitted, correct, showAnswer })}
                />
              ))}
            </Stack>
          )}

          {!options.length && submitted && (
            <AnswerCard label="Their answer" text={submitted} tone={phase === 'judged_correct' || (showAnswer && submitted === correct) ? 'correct' : phase === 'judged_wrong' || showAnswer ? 'wrong' : 'idle'} />
          )}
          {showAnswer && correct && submitted !== correct && (
            <AnswerCard label="Correct answer" text={correct} tone="correct" />
          )}
        </Box>

        <Box sx={{ pt: { lg: 4 } }}>
          <Typography sx={{ color: C.faint, fontSize: '0.72rem', letterSpacing: '0.16em', fontWeight: 700, mb: 1.5 }}>
            STANDINGS
          </Typography>
          <Stack spacing={0}>
            {(state.standings ?? []).map((row, i) => (
              <Stack key={row.teamId || row.teamName} direction="row" alignItems="baseline" sx={{ py: 1.15, borderTop: `1px solid ${C.line}` }}>
                <Typography sx={{ width: 28, color: C.faint, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</Typography>
                <Typography sx={{ flex: 1, fontWeight: seat?.teamId && row.teamId === seat.teamId ? 750 : 550 }}>{row.teamName}</Typography>
                <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: C.brass }}>{row.score ?? 0}</Typography>
              </Stack>
            ))}
            {(state.standings ?? []).length === 0 && (
              <Typography sx={{ color: C.faint, fontSize: '0.9rem' }}>Scores appear after the first judgement.</Typography>
            )}
          </Stack>
        </Box>
      </Box>

      {error && (
        <Typography sx={{ px: { xs: 2.5, md: 5 }, pb: 1, color: C.wrong, fontSize: '0.9rem' }}>{error}</Typography>
      )}

      {desk ? (
        <Desk phase={phase} busy={busy} correct={correct} onSend={send} onHide={() => setDesk(false)} />
      ) : (
        <Button onClick={() => setDesk(true)} sx={{ position: 'fixed', right: 16, bottom: 16, color: C.faint, textTransform: 'none', fontSize: '0.75rem' }}>
          Show desk
        </Button>
      )}
    </Box>
  );
}

function Verdict({ kind, answer }) {
  const wrong = kind === 'wrong';
  const color = wrong ? C.wrong : C.correct;
  const label = kind === 'correct' ? 'CORRECT' : kind === 'wrong' ? 'WRONG' : 'THE ANSWER';
  return (
    <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2, animation: wrong ? `${shake} 0.45s ease` : undefined }}>
      <Box sx={{
        px: 1.5, py: 0.6,
        border: `2px solid ${color}`,
        color,
        fontWeight: 800,
        letterSpacing: '0.14em',
        fontSize: '1.05rem',
        animation: `${stampIn} 0.45s cubic-bezier(.2,.8,.2,1) both`,
      }}>
        {label}
      </Box>
      {answer && (
        <Typography sx={{ color, fontWeight: 700, fontSize: '1.35rem' }}>{answer}</Typography>
      )}
    </Box>
  );
}

function OptionRow({ letter, text, tone }) {
  const toneColor = tone === 'correct' ? C.correct : tone === 'wrong' ? C.wrong : C.line;
  const ink = tone === 'correct' ? C.correctInk : tone === 'wrong' ? C.wrongInk : C.text;
  return (
    <Box sx={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '10px',
      border: `1px solid ${tone === 'idle' ? C.line : toneColor}`,
      minHeight: 64,
      display: 'flex',
      alignItems: 'center',
      px: 2,
      gap: 2,
      animation: tone === 'wrong' ? `${shake} 0.4s ease` : undefined,
    }}>
      {tone !== 'idle' && (
        <Box sx={{
          position: 'absolute', inset: 0, transformOrigin: 'left center',
          bgcolor: tone === 'correct' ? 'rgba(47,158,107,0.18)' : 'rgba(212,86,86,0.16)',
          animation: `${wipe} 0.55s cubic-bezier(.2,.8,.2,1) both`,
        }} />
      )}
      <Typography sx={{ position: 'relative', width: 28, fontWeight: 750, color: tone === 'idle' ? C.brass : ink }}>{letter}</Typography>
      <Typography sx={{ position: 'relative', fontSize: '1.15rem', fontWeight: 600, color: ink }}>{text}</Typography>
    </Box>
  );
}

function AnswerCard({ label, text, tone }) {
  const color = tone === 'correct' ? C.correct : tone === 'wrong' ? C.wrong : C.muted;
  return (
    <Box sx={{ mt: 2.5, maxWidth: 760, p: 2, borderRadius: '10px', border: `1px solid ${tone === 'idle' ? C.line : color}`, animation: tone === 'wrong' ? `${shake} 0.4s ease` : undefined }}>
      <Typography sx={{ color, fontSize: '0.68rem', letterSpacing: '0.14em', fontWeight: 750 }}>{label.toUpperCase()}</Typography>
      <Typography sx={{ mt: 0.75, fontSize: '1.35rem', fontWeight: 650 }}>{text}</Typography>
    </Box>
  );
}

function Desk({ phase, busy, correct, onSend, onHide }) {
  const actions = actionsFor(phase);
  return (
    <Box sx={{ borderTop: `1px solid ${C.line}`, bgcolor: '#101218', px: { xs: 2, md: 4 }, py: 1.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: C.faint, fontSize: '0.68rem', letterSpacing: '0.14em', fontWeight: 700 }}>OPERATOR</Typography>
          {correct && (
            <Typography sx={{ color: C.muted, fontSize: '0.85rem' }} noWrap>Answer on file: {correct}</Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {actions.map((action) => (
            <Button
              key={action.id}
              onClick={() => onSend(action.id)}
              disabled={Boolean(busy)}
              variant={action.primary ? 'contained' : 'outlined'}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                minHeight: 40,
                color: action.primary ? '#1A1408' : C.text,
                bgcolor: action.primary ? C.brass : 'transparent',
                borderColor: C.line,
                '&:hover': { bgcolor: action.primary ? '#D4B88A' : 'rgba(255,255,255,0.04)', borderColor: C.line },
              }}
            >
              {busy === action.id ? 'Sending…' : action.label}
            </Button>
          ))}
          <Button onClick={onHide} sx={{ textTransform: 'none', color: C.faint, minHeight: 40 }}>Stage view</Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function Gate({ draftId, setDraftId, error, onOpen }) {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: C.bg, color: C.text, display: 'grid', placeItems: 'center', px: 3 }}>
      <Box sx={{ width: '100%', maxWidth: 460 }}>
        <Typography sx={{ color: C.brass, fontWeight: 700, letterSpacing: '0.28em', fontSize: '0.72rem' }}>ROCK THE SHOW</Typography>
        <Typography sx={{ fontWeight: 650, fontSize: '2rem', letterSpacing: '-0.03em', mt: 1.5 }}>Buzzer round display</Typography>
        <Typography sx={{ color: C.muted, mt: 1, mb: 3, lineHeight: 1.5 }}>
          Open the Electric Answers activity. The stage shows the team on the floor, the question, and the correct or wrong verdict.
        </Typography>
        <TextField
          fullWidth
          value={draftId}
          onChange={(e) => setDraftId(e.target.value)}
          placeholder="Activity ID"
          onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
          sx={{
            mb: 1.5,
            '& .MuiOutlinedInput-root': { color: C.text, bgcolor: C.panel },
            '& fieldset': { borderColor: C.line },
          }}
        />
        {error && <Typography sx={{ color: C.wrong, mb: 1.5, fontSize: '0.9rem' }}>{error}</Typography>}
        <Button onClick={onOpen} variant="contained" disableElevation sx={{ bgcolor: C.brass, color: '#1A1408', fontWeight: 750, textTransform: 'none', minHeight: 44, px: 2.5 }}>
          Open the stage
        </Button>
      </Box>
    </Box>
  );
}

function toneFor(option, { phase, submitted, correct, showAnswer }) {
  const picked = submitted && option === submitted;
  const right = correct && option === correct;
  if (phase === 'judged_correct' && (picked || right)) return 'correct';
  if (phase === 'judged_wrong' && picked) return 'wrong';
  if (showAnswer && right) return 'correct';
  if (showAnswer && picked && !right) return 'wrong';
  return 'idle';
}

function optionsFor(question) {
  const options = (question?.options ?? []).filter(Boolean);
  if (options.length) return options;
  if (question?.type === 'truefalse') return ['True', 'False'];
  return [];
}

function actionsFor(phase) {
  if (phase === 'staged') return [{ id: 'START_COUNTDOWN', label: 'Start countdown', primary: true }];
  if (phase === 'seated') return [
    { id: 'MARK_CORRECT', label: 'Correct', primary: true },
    { id: 'MARK_WRONG', label: 'Wrong' },
  ];
  if (phase === 'judged_wrong') return [
    { id: 'PASS', label: 'Pass to next team' },
    { id: 'REBUZZ', label: 'Re-buzz' },
    { id: 'REVEAL', label: 'Reveal answer', primary: true },
  ];
  if (phase === 'judged_correct' || phase === 'no_buzz') return [{ id: 'REVEAL', label: 'Reveal answer', primary: true }];
  if (phase === 'revealed') return [{ id: 'END_GAME', label: 'End round' }];
  return [];
}

function phaseLabel(phase) {
  return {
    lobby: 'Waiting',
    staged: 'Question is set',
    countdown: 'Get ready',
    buzzing: 'Floor is open',
    seated: 'A team is in',
    judged_correct: 'Correct',
    judged_wrong: 'Wrong',
    no_buzz: 'No buzz',
    revealed: 'Answer',
    completed: 'Round complete',
  }[phase] || 'Rock the Show';
}

function clockFor(state, nowMs) {
  const phase = state.phase;
  const round = state.round ?? {};
  const target = phase === 'countdown' ? round.armsAt : phase === 'buzzing' ? round.buzzClosesAt : phase === 'seated' ? round.seat?.answerEndsAt : null;
  if (!target) return null;
  const left = new Date(target).getTime() - nowMs;
  if (phase === 'countdown') return { label: String(Math.max(1, Math.ceil(left / 1000))), urgent: left < 1500 };
  const total = Math.max(0, Math.ceil(left / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return { label: `${m}:${String(s).padStart(2, '0')}`, urgent: total <= 5 };
}

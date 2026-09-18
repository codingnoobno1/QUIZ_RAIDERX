'use client';

/**
 * Quiz activity — the web counterpart of the mobile quiz screens.
 *
 * Four formats, chosen by the server:
 *
 *   paper       — Round 2: a dealt paper per team, its own clock, saved as you
 *                 go. Rendered by PaperActivity.
 *   rapid_fire  — per-question countdown, auto-advance at zero
 *   preloaded   — self-paced, one submit at the end
 *   custom_live — host-paced: the server opens a question with a deadline and
 *                 decides who may answer it
 *
 * Nothing here grades anything. The web used to receive every question's
 * correct answer, flash right or wrong locally, and show its own score — so
 * anyone with the browser console open could read the answer key, and a result
 * could appear that the server never recorded. It now uses the v2 contract: no
 * answers are sent, and every score shown is the server's.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { color, radius, tint } from '@/theme/tokens';
import { useQuizSubmission, useRoundAnswer, useSubmitQuiz } from '@/hooks/queries/useEventQueries';
import Loading from '@/components/async/Loading';
import PaperActivity from './PaperActivity';
import { formatClock, useRemaining, useServerOffset } from './serverClock';

export default function QuizActivity({ activity, participantId, eventId, serverTime, onExit }) {
  const quiz = activity.quiz;

  if (quiz?.paper?.enabled) return <PaperActivity activity={activity} onExit={onExit} />;

  const isLive = quiz?.quizType === 'custom_live';
  if (isLive) {
    return (
      <LiveQuiz
        activity={activity}
        participantId={participantId}
        eventId={eventId}
        serverTime={serverTime}
        onExit={onExit}
      />
    );
  }

  return <SelfPaced activity={activity} participantId={participantId} onExit={onExit} />;
}

/* ── rapid_fire + preloaded ─────────────────────────────────────────────── */

function SelfPaced({ activity, participantId, onExit }) {
  const submissionQuery = useQuizSubmission(activity.id, participantId);
  const existing = submissionQuery.data?.submitted ? submissionQuery.data : null;

  if (submissionQuery.isPending) return <Loading label="Checking your attempt" />;

  // Already played — show the result instead of the quiz.
  if (activity.hasSubmitted || existing) {
    return (
      <ResultView
        score={existing?.score ?? 0}
        total={existing?.totalPossible ?? null}
        correctCount={existing?.correctCount ?? null}
        percentage={existing?.percentage ?? null}
        title={activity.title}
        onExit={onExit}
        restored
      />
    );
  }

  return <SelfPacedQuiz activity={activity} participantId={participantId} onExit={onExit} />;
}

function SelfPacedQuiz({ activity, participantId, onExit }) {
  const quiz = activity.quiz;
  const questions = quiz.questions;
  const timed = quiz.quizType === 'rapid_fire';
  const perQuestion = Math.max(3, quiz.timePerQuestion || 10);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> option
  const [timeLeft, setTimeLeft] = useState(perQuestion);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());
  const answersRef = useRef({});

  // The countdown hitting zero and a tap on the last question can both reach
  // the end at once; this latch keeps it to one submit.
  const submitted = useRef(false);
  const advanceTimer = useRef(null);

  const submit = useSubmitQuiz(activity.id, participantId);
  const question = questions[index];
  const isLast = index >= questions.length - 1;

  const send = useCallback(() => {
    submit.mutate({
      answers: Object.entries(answersRef.current).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      })),
      timeTakenSeconds: Math.round((Date.now() - startedAt.current) / 1000),
    });
  }, [submit]);

  const finish = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    setDone(true);
    send();
  }, [send]);

  const advance = useCallback(() => {
    if (isLast) finish();
    else {
      setIndex((i) => i + 1);
      setTimeLeft(perQuestion);
    }
  }, [isLast, finish, perQuestion]);

  // Countdown — rapid_fire only. Auto-advances with whatever is selected.
  useEffect(() => {
    if (!timed || done || !question) return undefined;
    if (timeLeft <= 0) {
      advance();
      return undefined;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timed, timeLeft, done, question, advance]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  if (!question) {
    return <ResultView score={0} total={0} title={activity.title} onExit={onExit} />;
  }

  if (done) {
    // An attempt that already exists is not a failure: the refusal carries it.
    const already = submit.error?.code === 'ALREADY_SUBMITTED' || submit.error?.code === 'ALREADY_SUBMITTED_BY_TEAMMATE';
    const result = submit.data ?? (already ? submit.error?.data : null);

    if (result) {
      return (
        <ResultView
          score={result.score ?? 0}
          total={result.totalPossible ?? null}
          correctCount={result.correctCount ?? null}
          percentage={result.percentage ?? null}
          title={activity.title}
          onExit={onExit}
          restored={already}
        />
      );
    }

    return <Sending pending={submit.isPending} error={submit.error} onRetry={() => send()} onExit={onExit} />;
  }

  const chosen = answers[question.id];

  const choose = (option) => {
    if (chosen) return; // locked once answered
    answersRef.current = { ...answersRef.current, [question.id]: option };
    setAnswers(answersRef.current);
    if (timed) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(advance, 450);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ color: color.textMuted, fontSize: '0.75rem', fontWeight: 700, letterSpacing: 1 }}>
          QUESTION {index + 1} / {questions.length}
        </Typography>
        {timed && (
          <Typography sx={{ color: timeLeft <= 3 ? color.red : color.brand, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {timeLeft}s
          </Typography>
        )}
      </Stack>

      <LinearProgress
        variant="determinate"
        value={timed ? (timeLeft / perQuestion) * 100 : ((index + 1) / questions.length) * 100}
        sx={{
          height: 4,
          borderRadius: 2,
          mb: 3,
          bgcolor: 'rgba(255,255,255,0.06)',
          '& .MuiLinearProgress-bar': {
            bgcolor: timed && timeLeft <= 3 ? color.red : color.brand,
            transition: timed ? 'transform 1s linear' : undefined,
          },
        }}
      />

      <QuestionBody question={question} chosen={chosen} onChoose={choose} />

      {!timed && (
        <PrimaryButton disabled={!chosen} onClick={advance}>
          {isLast ? 'Finish' : 'Next question'}
        </PrimaryButton>
      )}
    </Box>
  );
}

/* ── custom_live — the server's round ───────────────────────────────────── */

function LiveQuiz({ activity, participantId, eventId, serverTime, onExit }) {
  const round = activity.quiz.liveRound;
  const question = activity.quiz.activeQuestion;

  const offset = useServerOffset(serverTime);
  const open = round?.state === 'open';
  const remaining = useRemaining(round?.endsAt, offset, open);

  const answer = useRoundAnswer(activity.id, eventId, participantId);
  const [pending, setPending] = useState(null);
  const [refusal, setRefusal] = useState(null);
  const lastInstance = useRef(round?.instanceId ?? null);

  // A new question clears the previous question's refusal and optimistic tap.
  useEffect(() => {
    if (round?.instanceId !== lastInstance.current) {
      lastInstance.current = round?.instanceId ?? null;
      setRefusal(null);
      setPending(null);
    }
  }, [round?.instanceId]);

  // The server's record supersedes the optimistic tap.
  useEffect(() => {
    if (round?.answered) setPending(null);
  }, [round?.answered]);

  if (!round) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: color.amber, fontWeight: 700 }}>This live quiz needs the updated event server.</Typography>
        <Button onClick={onExit} sx={{ mt: 2, textTransform: 'none' }}>Back to lobby</Button>
      </Box>
    );
  }

  if (round.state === 'idle' || !question) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Loading label="Waiting for the host" />
        <Typography variant="body2" sx={{ color: color.textMuted }}>
          The next question opens on the host&apos;s cue. Stay on this screen.
        </Typography>
        {round.myTeamName && (
          <Typography sx={{ color: color.textFaint, mt: 2, fontSize: '0.85rem' }}>
            {round.myTeamName}
            {round.myTeamLeaderName ? ` · led by ${round.myTeamLeaderName}` : ''}
          </Typography>
        )}
      </Box>
    );
  }

  const canAnswer = open && round.targeted && !round.answered && !answer.isPending;
  const chosen = round.myOption ?? pending;
  const revealed = round.state === 'revealed';

  const choose = (option) => {
    if (!canAnswer) return;
    setPending(option);
    setRefusal(null);
    answer.mutate(
      { instanceId: round.instanceId, option },
      {
        onError: (error) => {
          setPending(null);
          // The server writes these for participants mid-round ("Time is up
          // for this question."); showing its own sentence beats inventing one.
          setRefusal(error?.message || 'That answer did not go through.');
        },
      },
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <TurnBanner round={round} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, mt: 2 }}>
        <Typography sx={{ color: color.green, fontSize: '0.72rem', fontWeight: 800, letterSpacing: 1.5 }}>
          ● LIVE · QUESTION {round.questionIndex + 1}
        </Typography>
        <Typography
          sx={{
            color: !open ? color.textFaint : remaining <= 3000 ? color.red : remaining <= 7000 ? color.amber : color.brand,
            fontWeight: 800,
            fontSize: '1.2rem',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {open ? formatClock(remaining) : round.state === 'locked' ? 'LOCKED' : 'REVEALED'}
        </Typography>
      </Stack>

      <QuestionBody
        question={{ text: question.text, options: question.options }}
        chosen={chosen}
        onChoose={choose}
        disabled={!canAnswer}
        correctOption={revealed ? round.reveal?.correctAnswer : null}
      />

      {refusal && <Note tone={color.amber}>{refusal}</Note>}
      {round.answered && !revealed && (
        <Note tone={color.brand}>
          {round.answeredBy ? `${round.answeredBy} answered for your team. Locked in.` : 'Answer locked. Waiting for the host to reveal.'}
        </Note>
      )}
      {round.state === 'locked' && !round.answered && round.targeted && !refusal && (
        <Note tone={color.red}>Time is up. No answer recorded.</Note>
      )}
      {revealed && round.reveal && (
        <Note tone={round.reveal.isCorrect ? color.green : color.red}>
          {round.reveal.isCorrect
            ? `Correct — +${round.reveal.pointsAwarded} points${round.scope === 'team' && round.myTeamName ? ` to ${round.myTeamName}` : ''}.`
            : round.answered
              ? `Not this time. The answer was ${round.reveal.correctAnswer ?? '—'}.`
              : `The answer was ${round.reveal.correctAnswer ?? '—'}.`}
        </Note>
      )}
    </Box>
  );
}

/** Who is up. In a team round, the thing that matters most on the screen. */
function TurnBanner({ round }) {
  if (round.scope !== 'team' && round.targetKind === 'all') return null;

  const yours = round.targeted;
  const others = round.targetTeams.map((t) => t.teamName).filter(Boolean).join(' & ') || 'Another team';
  const leader = yours
    ? round.myTeamLeaderName
    : round.targetTeams.length === 1
      ? round.targetTeams[0].leaderName
      : null;
  const tone = yours ? color.green : color.amber;
  const Icon = yours ? BoltRoundedIcon : VisibilityRoundedIcon;

  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{ px: 2, py: 1.25, borderRadius: `${radius.md}px`, bgcolor: tint(tone, 0.08), border: `1px solid ${tint(tone, 0.3)}` }}
    >
      <Icon sx={{ color: tone, fontSize: 20 }} />
      <Box>
        <Typography sx={{ color: tone, fontWeight: 800, fontSize: '0.78rem', letterSpacing: 1.2 }}>
          {yours ? 'YOUR TEAM IS UP' : `${others.toUpperCase()} IS ANSWERING`}
          {round.isTeamLeader && yours ? ' · YOU LEAD' : ''}
        </Typography>
        <Typography sx={{ color: color.textMuted, fontSize: '0.82rem' }}>
          {[yours ? round.myTeamName : others, leader ? `led by ${leader}` : null].filter(Boolean).join(' · ')}
          {!yours ? ' — you can watch, but this one is not yours to answer.' : ''}
        </Typography>
      </Box>
    </Stack>
  );
}

/* ── shared pieces ──────────────────────────────────────────────────────── */

/**
 * The question and its options. It shows a selection, and after a host reveal
 * the correct option — never a verdict it worked out itself, because it no
 * longer has anything to work one out from.
 */
function QuestionBody({ question, chosen, onChoose, disabled = false, correctOption = null }) {
  const locked = disabled || Boolean(chosen);

  return (
    <>
      <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.45, mb: 2.5 }}>
        {question.text}
      </Typography>

      <Stack spacing={1.25}>
        {question.options.map((option) => {
          const picked = chosen === option;
          const isCorrect = correctOption != null && option === correctOption;
          const isWrongPick = correctOption != null && picked && option !== correctOption;

          let tone = color.border;
          if (isCorrect) tone = color.green;
          else if (isWrongPick) tone = color.red;
          else if (picked) tone = color.brand;

          return (
            <Box
              key={option}
              component="button"
              type="button"
              onClick={() => onChoose(option)}
              disabled={locked}
              className="pxe-tap"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                width: '100%',
                textAlign: 'left',
                font: 'inherit',
                cursor: locked ? 'default' : 'pointer',
                px: 2,
                py: 1.5,
                borderRadius: `${radius.md}px`,
                color: locked && !picked && !isCorrect ? color.textMuted : color.text,
                bgcolor: picked || isCorrect ? tint(tone, 0.1) : 'rgba(255,255,255,0.02)',
                border: `1px solid ${picked || isCorrect ? tint(tone, 0.6) : color.border}`,
                transition: 'background-color 150ms ease, border-color 150ms ease',
                '&:focus-visible': { outline: `2px solid ${color.brand}`, outlineOffset: 2 },
              }}
            >
              <span>{option}</span>
              {isCorrect && <CheckCircleRoundedIcon sx={{ fontSize: 20, color: color.green }} />}
              {isWrongPick && <CancelRoundedIcon sx={{ fontSize: 20, color: color.red }} />}
            </Box>
          );
        })}
      </Stack>
    </>
  );
}

function Note({ tone, children }) {
  return (
    <Box sx={{ mt: 2, px: 2, py: 1.25, borderRadius: `${radius.md}px`, bgcolor: tint(tone, 0.08), border: `1px solid ${tint(tone, 0.3)}` }}>
      <Typography sx={{ color: tone, fontSize: '0.88rem' }}>{children}</Typography>
    </Box>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <Button
      fullWidth
      variant="contained"
      disableElevation
      {...props}
      sx={{
        mt: 3,
        minHeight: 48,
        borderRadius: `${radius.md}px`,
        textTransform: 'none',
        fontWeight: 800,
        bgcolor: color.brand,
        color: color.bg,
        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.06)', color: color.textFaint },
      }}
    >
      {children}
    </Button>
  );
}

/**
 * The attempt is in flight, or did not land. A score the server did not record
 * is not shown as if it were — the old screen did exactly that, marked "shown
 * locally", which a participant reasonably read as their result.
 */
function Sending({ pending, error, onRetry, onExit }) {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      {pending || !error ? (
        <Loading label="Sending your answers" />
      ) : (
        <>
          <Typography sx={{ color: color.red, fontWeight: 800, letterSpacing: 1 }}>NOT RECORDED</Typography>
          <Typography sx={{ color: color.textMuted, mt: 1.5 }}>{error.message}</Typography>
          <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
            <Button onClick={onRetry} variant="contained" disableElevation sx={{ textTransform: 'none', fontWeight: 800, bgcolor: color.brand, color: color.bg }}>
              Try again
            </Button>
            <Button onClick={onExit} sx={{ textTransform: 'none', color: color.textMuted }}>
              Back to lobby
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}

function ResultView({ score, total, correctCount, percentage, title, onExit, restored }) {
  const pct = percentage ?? (total ? Math.round((score / total) * 100) : null);

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Box
        sx={{
          width: 84,
          height: 84,
          mx: 'auto',
          mb: 2,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          bgcolor: tint(color.amber, 0.1),
          border: `1px solid ${tint(color.amber, 0.3)}`,
        }}
      >
        <EmojiEventsRoundedIcon sx={{ fontSize: 40, color: color.amber }} />
      </Box>

      <Typography sx={{ color: color.textMuted, fontSize: '0.72rem', fontWeight: 800, letterSpacing: 1.5 }}>
        {restored ? 'ALREADY SUBMITTED' : 'YOUR SCORE'}
      </Typography>

      <Typography sx={{ color: color.text, fontWeight: 900, fontSize: '3rem', lineHeight: 1.1, my: 0.5, fontVariantNumeric: 'tabular-nums' }}>
        {score}
        {total ? <span style={{ color: color.textFaint, fontSize: '1.4rem' }}> / {total}</span> : null}
      </Typography>

      <Typography sx={{ color: color.textMuted, fontSize: '0.9rem' }}>
        {title}
        {correctCount != null ? ` · ${correctCount} correct` : ''}
        {pct != null ? ` · ${pct}%` : ''}
      </Typography>

      <Button
        onClick={onExit}
        variant="outlined"
        sx={{
          mt: 3,
          minHeight: 44,
          px: 3,
          borderRadius: `${radius.md}px`,
          textTransform: 'none',
          fontWeight: 700,
          color: color.brand,
          borderColor: tint(color.brand, 0.4),
        }}
      >
        Back to lobby
      </Button>
    </Box>
  );
}

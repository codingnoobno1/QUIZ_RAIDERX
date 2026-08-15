'use client';

/**
 * Quiz activity — port of `screens/events/modes/quiz_mode_screen.dart`.
 *
 * Three pacing models, chosen by the server's `quiz.quizType`:
 *
 *   rapid_fire  — per-question countdown, auto-advance at zero
 *   preloaded   — self-paced, one submit at the end
 *   custom_live — the host controls the question index; we follow the poll
 *
 * Answers are graded locally for instant feedback and re-graded server-side on
 * submit (the server keeps the best score), which is exactly what the mobile
 * app does. `timeTakenSeconds` is measured, not invented.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { color, radius, tint } from '@/theme/tokens';
import { useQuizSubmission, useSubmitQuiz } from '@/hooks/queries/useEventQueries';
import Loading from '@/components/async/Loading';

export default function QuizActivity({ activity, participantId, onExit }) {
  const quiz = activity.quiz;
  const isLive = quiz?.quizType === 'custom_live';

  const submissionQuery = useQuizSubmission(activity.id, participantId, !isLive);
  const existing = submissionQuery.data?.submitted ? submissionQuery.data : null;

  if (submissionQuery.isPending && !isLive) {
    return <Loading label="Checking your attempt" />;
  }

  // Already played — show the result instead of the quiz (quiz_mode_screen.dart:57-85)
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

  if (isLive) {
    return <LiveQuiz activity={activity} participantId={participantId} onExit={onExit} />;
  }

  return <SelfPacedQuiz activity={activity} participantId={participantId} onExit={onExit} />;
}

/* ── rapid_fire + preloaded ─────────────────────────────────────────────── */

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

  // Two paths can reach the last question at once: the countdown hitting zero
  // and the 650ms "you answered" flash. Without this latch both fire finish()
  // and the participant submits twice.
  const submitted = useRef(false);
  const flashTimer = useRef(null);

  const submit = useSubmitQuiz(activity.id, participantId);
  const question = questions[index];
  const isLast = index >= questions.length - 1;

  const finish = useCallback(
    (finalAnswers) => {
      if (submitted.current) return;
      submitted.current = true;
      setDone(true);
      submit.mutate({
        answers: Object.entries(finalAnswers).map(([questionId, selectedOption]) => ({
          questionId,
          selectedOption,
        })),
        timeTakenSeconds: Math.round((Date.now() - startedAt.current) / 1000),
      });
    },
    [submit],
  );

  const advance = useCallback(
    (next) => {
      if (isLast) finish(next);
      else {
        setIndex((i) => i + 1);
        setTimeLeft(perQuestion);
      }
    },
    [isLast, finish, perQuestion],
  );

  // Countdown — rapid_fire only. Auto-advances with whatever is selected.
  useEffect(() => {
    if (!timed || done || !question) return undefined;
    if (timeLeft <= 0) {
      advance(answers);
      return undefined;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timed, timeLeft, done, question, advance, answers]);

  // Leaving mid-question (organiser ends the round, participant backs out) must
  // not leave a timer that fires setState into an unmounted tree.
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  if (!question) {
    return <ResultView score={0} total={0} title={activity.title} onExit={onExit} />;
  }

  if (done) {
    const localScore = questions.reduce(
      (sum, q) => (answers[q.id] && answers[q.id] === q.correctAnswer ? sum + q.points : sum),
      0,
    );
    const totalPossible = questions.reduce((s, q) => s + q.points, 0);
    return (
      <ResultView
        score={submit.data?.score ?? localScore}
        total={submit.data?.totalPossible ?? totalPossible}
        correctCount={submit.data?.correctCount ?? null}
        percentage={submit.data?.percentage ?? null}
        title={activity.title}
        onExit={onExit}
        syncing={submit.isPending}
        syncError={submit.error}
      />
    );
  }

  const chosen = answers[question.id];

  const choose = (option) => {
    if (chosen) return; // locked once answered, like the mobile app
    const next = { ...answers, [question.id]: option };
    setAnswers(next);
    if (timed) {
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => advance(next), 650); // brief correctness flash
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ color: color.textMuted, fontSize: '0.75rem', fontWeight: 700, letterSpacing: 1 }}>
          QUESTION {index + 1} / {questions.length}
        </Typography>
        {timed && (
          <Typography
            sx={{
              color: timeLeft <= 3 ? color.red : color.brand,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
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
        <Button
          fullWidth
          disabled={!chosen}
          onClick={() => advance(answers)}
          variant="contained"
          disableElevation
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
          {isLast ? 'Finish' : 'Next question'}
        </Button>
      )}
    </Box>
  );
}

/* ── custom_live — host controls the index ──────────────────────────────── */

function LiveQuiz({ activity, participantId, onExit }) {
  const active = activity.quiz.activeQuestion;
  const [answers, setAnswers] = useState({});
  const startedAt = useRef(Date.now());
  const submit = useSubmitQuiz(activity.id, participantId);

  // Keyed by the question's real id. It used to be keyed by index and stripped
  // back to "0"/"1" on submit, which matched no question server-side — every
  // host-paced answer was graded as unanswered and the whole round scored zero.
  const key = active?.id || null;
  const chosen = key ? answers[key] : null;

  if (!active) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Loading label="Waiting for the host" />
        <Typography variant="body2" sx={{ color: color.textMuted }}>
          The next question appears here automatically.
        </Typography>
      </Box>
    );
  }

  // An older server that doesn't send the question id can still show the
  // question, but an answer would be silently discarded — so say so rather than
  // accept a tap that scores nothing.
  if (!key) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: color.text, fontWeight: 700 }}>{active.text}</Typography>
        <Typography sx={{ color: color.amber, mt: 2, fontSize: '0.85rem' }}>
          This question can&apos;t accept answers right now. The organiser has been sent the details.
        </Typography>
      </Box>
    );
  }

  const choose = (option) => {
    if (chosen) return;
    const next = { ...answers, [key]: option };
    setAnswers(next);
    // Live rounds submit cumulatively after each question — the host can end
    // the round at any moment, so nothing may be held back until the end.
    submit.mutate({
      answers: Object.entries(next).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      })),
      timeTakenSeconds: Math.round((Date.now() - startedAt.current) / 1000),
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography sx={{ color: color.green, fontSize: '0.72rem', fontWeight: 800, letterSpacing: 1.5, mb: 1 }}>
        ● LIVE · QUESTION {active.index + 1}
      </Typography>
      <QuestionBody
        question={{ text: active.text, options: active.options, points: active.points }}
        chosen={chosen}
        onChoose={choose}
        revealCorrect={false}
      />
      {chosen && (
        <Typography sx={{ mt: 2, color: color.textMuted, fontSize: '0.8rem', textAlign: 'center' }}>
          {submit.isPending
            ? 'Sending your answer…'
            : submit.isError
              ? "We couldn't save that answer — it will retry on the next question."
              : 'Answer locked. Waiting for the host to advance…'}
        </Typography>
      )}
    </Box>
  );
}

/* ── shared question body ───────────────────────────────────────────────── */

function QuestionBody({ question, chosen, onChoose, revealCorrect = true }) {
  return (
    <>
      <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.45, mb: 2.5 }}>
        {question.text}
      </Typography>

      <Stack spacing={1.25}>
        {question.options.map((option) => {
          const picked = chosen === option;
          const isCorrect = revealCorrect && chosen && option === question.correctAnswer;
          const isWrongPick = revealCorrect && picked && option !== question.correctAnswer;

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
              disabled={Boolean(chosen)}
              className="pxe-tap"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                width: '100%',
                textAlign: 'left',
                font: 'inherit',
                cursor: chosen ? 'default' : 'pointer',
                px: 2,
                py: 1.5,
                borderRadius: `${radius.md}px`,
                color: color.text,
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

/* ── result ─────────────────────────────────────────────────────────────── */

function ResultView({ score, total, correctCount, percentage, title, onExit, syncing, syncError, restored }) {
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

      <Typography sx={{ color: color.text, fontWeight: 900, fontSize: '3rem', lineHeight: 1.1, my: 0.5 }}>
        {score}
        {total ? <span style={{ color: color.textFaint, fontSize: '1.4rem' }}> / {total}</span> : null}
      </Typography>

      <Typography sx={{ color: color.textMuted, fontSize: '0.9rem' }}>
        {title}
        {correctCount != null ? ` · ${correctCount} correct` : ''}
        {pct != null ? ` · ${pct}%` : ''}
      </Typography>

      {syncing && (
        <Typography sx={{ mt: 2, color: color.textFaint, fontSize: '0.75rem' }}>
          Saving your result…
        </Typography>
      )}
      {syncError && (
        <Typography sx={{ mt: 2, color: color.amber, fontSize: '0.75rem' }}>
          Shown locally — we couldn&apos;t reach the server. {syncError.message}
        </Typography>
      )}

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

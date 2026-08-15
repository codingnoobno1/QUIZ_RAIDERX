'use client';

/**
 * The KBC live show, client side.
 *
 * One rule governs this whole file: it renders the phase the server reports and
 * never decides the next one. There is no `if (timeLeft === 0) reveal()` here.
 * The countdown is cosmetic — it counts toward the server's `endsAt` and then
 * simply reads zero until the host acts.
 *
 * Which view you get is `viewer.role` plus `phase`, and the server has already
 * removed anything your role may not see, so there is no client-side hiding of
 * a correct answer that was sent anyway.
 */

import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import HowToVoteRoundedIcon from '@mui/icons-material/HowToVoteRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { color, radius, tint } from '@/theme/tokens';
import Loading from '@/components/async/Loading';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function KbcExperience({ quiz, onSubmit, submitting }) {
  const viewer = quiz.viewer ?? {};
  const isContestant = Boolean(viewer.isActiveContestant);

  switch (quiz.phase) {
    case 'fastest_finger':
      return <FastestFinger quiz={quiz} onSubmit={onSubmit} submitting={submitting} />;
    case 'fastest_finger_result':
      return <FastestFingerResult quiz={quiz} />;
    case 'contestant_intro':
      return <ContestantIntro quiz={quiz} isYou={isContestant} />;
    case 'hot_seat':
    case 'answer_locked':
      return isContestant ? <ContestantHotSeat quiz={quiz} /> : <AudienceHotSeat quiz={quiz} />;
    case 'audience_poll':
      return isContestant ? (
        <ContestantPollWaiting quiz={quiz} />
      ) : (
        <AudiencePollVoting quiz={quiz} onSubmit={onSubmit} submitting={submitting} />
      );
    case 'answer_reveal':
      return <AnswerReveal quiz={quiz} isYou={isContestant} />;
    case 'leaderboard':
    case 'completed':
      return <Leaderboard quiz={quiz} />;
    default:
      return <ShowLobby quiz={quiz} />;
  }
}

/* ── shared ─────────────────────────────────────────────────────────────── */

/** Counts toward the server's endsAt. Reaching zero changes nothing by itself. */
function useServerCountdown(timer) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    if (!timer?.endsAt) {
      setLeft(null);
      return undefined;
    }
    // Correct for clock skew between this device and the server.
    const skew = timer.serverNow ? Date.now() - new Date(timer.serverNow).getTime() : 0;
    const end = new Date(timer.endsAt).getTime() + skew;

    const tick = () => setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timer?.endsAt, timer?.serverNow]);

  return left;
}

function ShowBar({ label, right, tone = color.brand }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${color.border}`, bgcolor: color.surface }}
    >
      <Typography sx={{ color: tone, fontSize: '0.68rem', fontWeight: 800, letterSpacing: 1.2 }}>
        {label}
      </Typography>
      {right}
    </Stack>
  );
}

function Timer({ seconds }) {
  if (seconds == null) return null;
  const urgent = seconds <= 5;
  return (
    <Typography
      sx={{
        color: urgent ? color.red : color.text,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        fontSize: '1rem',
      }}
    >
      {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
    </Typography>
  );
}

/** The four-option grid, shared by contestant and audience. */
function OptionGrid({ options, selected, lockedOption, correctAnswer, onPick, disabled }) {
  return (
    <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mt: 2.5 }}>
      {options.map((option, i) => {
        const isSelected = selected === option;
        const isLocked = lockedOption === option;
        const isCorrect = correctAnswer && option === correctAnswer;
        const isWrong = correctAnswer && isLocked && option !== correctAnswer;

        let tone = color.border;
        if (isCorrect) tone = color.green;
        else if (isWrong) tone = color.red;
        else if (isLocked) tone = color.amber;
        else if (isSelected) tone = color.brand;

        const lit = isSelected || isLocked || isCorrect || isWrong;

        return (
          <Box
            key={option}
            component="button"
            type="button"
            disabled={disabled}
            onClick={() => onPick?.(option)}
            className="pxe-tap"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
              textAlign: 'left',
              font: 'inherit',
              cursor: disabled ? 'default' : 'pointer',
              px: 2,
              py: 1.75,
              borderRadius: `${radius.md}px`,
              color: color.text,
              bgcolor: lit ? tint(tone, 0.12) : 'rgba(255,255,255,0.02)',
              border: `1px solid ${lit ? tint(tone, 0.65) : color.border}`,
              transition: 'background-color 160ms ease, border-color 160ms ease',
              '&:focus-visible': { outline: `2px solid ${color.brand}`, outlineOffset: 2 },
            }}
          >
            <Box component="span" sx={{ color: lit ? tone : color.textFaint, fontWeight: 800, fontSize: '0.8rem' }}>
              {LETTERS[i]}
            </Box>
            <Box component="span" sx={{ flex: 1 }}>
              {option}
            </Box>
            {isCorrect && <CheckCircleRoundedIcon sx={{ fontSize: 19, color: color.green }} />}
            {isWrong && <CancelRoundedIcon sx={{ fontSize: 19, color: color.red }} />}
            {isLocked && !correctAnswer && <LockRoundedIcon sx={{ fontSize: 17, color: color.amber }} />}
          </Box>
        );
      })}
    </Box>
  );
}

function HotSeatBanner({ contestant, youAreOn }) {
  if (!contestant) return null;
  return (
    <Stack alignItems="center" sx={{ py: 3 }}>
      <Typography sx={{ color: color.amber, fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1.5 }}>
        {youAreOn ? 'YOU ARE ON THE HOT SEAT' : 'ON THE HOT SEAT'}
      </Typography>
      <Box
        sx={{
          width: 62,
          height: 62,
          mt: 1.5,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          bgcolor: tint(color.amber, 0.12),
          border: `1px solid ${tint(color.amber, 0.4)}`,
          color: color.amber,
          fontWeight: 800,
        }}
      >
        {(contestant.name ?? '?').slice(0, 2).toUpperCase()}
      </Box>
      <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.05rem', mt: 1 }}>
        {contestant.name}
      </Typography>
      {contestant.teamName && (
        <Typography sx={{ color: color.textMuted, fontSize: '0.8rem' }}>{contestant.teamName}</Typography>
      )}
    </Stack>
  );
}

/* ── phases ─────────────────────────────────────────────────────────────── */

function ShowLobby({ quiz }) {
  return (
    <Box sx={{ p: 5, textAlign: 'center' }}>
      <BoltRoundedIcon sx={{ fontSize: 42, color: color.textFaint }} />
      <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.05rem', mt: 1.5 }}>
        The show is about to begin
      </Typography>
      <Typography sx={{ color: color.textMuted, fontSize: '0.88rem', mt: 1, maxWidth: 420, mx: 'auto', lineHeight: 1.6 }}>
        Stay on this screen. When the host opens the fastest-finger round it appears here automatically.
      </Typography>
      {quiz.audienceCount > 0 && (
        <Typography sx={{ color: color.textFaint, fontSize: '0.75rem', mt: 2 }}>
          {quiz.audienceCount} in the room
        </Typography>
      )}
    </Box>
  );
}

/** Everyone who is not seated may qualify — ordering answer, one attempt. */
function FastestFinger({ quiz, onSubmit, submitting }) {
  const ff = quiz.fastestFinger ?? {};
  const seconds = useServerCountdown(quiz.timer);
  const [order, setOrder] = useState([]);
  const answered = quiz.viewer?.hasAnsweredFastestFinger;

  const options = ff.question?.options ?? [];

  const toggle = (option) =>
    setOrder((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));

  if (answered) {
    return (
      <>
        <ShowBar label="FASTEST FINGER FIRST" right={<Timer seconds={seconds} />} tone={color.amber} />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <LockRoundedIcon sx={{ fontSize: 34, color: color.amber }} />
          <Typography sx={{ color: color.text, fontWeight: 700, mt: 1.5 }}>Answer locked</Typography>
          <Typography sx={{ color: color.textMuted, fontSize: '0.86rem', mt: 1 }}>
            {ff.mySubmission ? `${(ff.mySubmission.elapsedMs / 1000).toFixed(2)}s` : ''} — waiting for the host to
            close the round.
          </Typography>
          <Typography sx={{ color: color.textFaint, fontSize: '0.75rem', mt: 2 }}>
            {ff.submissionCount} answered
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <ShowBar label="FASTEST FINGER FIRST" right={<Timer seconds={seconds} />} tone={color.amber} />
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.45 }}>
          {ff.question?.text}
        </Typography>
        <Typography sx={{ color: color.textMuted, fontSize: '0.8rem', mt: 1 }}>
          Tap in the correct order. Tap again to remove.
        </Typography>

        <Stack spacing={1.25} sx={{ mt: 2.5 }}>
          {options.map((option, i) => {
            const pos = order.indexOf(option);
            const picked = pos >= 0;
            return (
              <Box
                key={option}
                component="button"
                type="button"
                onClick={() => toggle(option)}
                className="pxe-tap"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  width: '100%',
                  textAlign: 'left',
                  font: 'inherit',
                  cursor: 'pointer',
                  px: 2,
                  py: 1.5,
                  borderRadius: `${radius.md}px`,
                  color: color.text,
                  bgcolor: picked ? tint(color.amber, 0.12) : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${picked ? tint(color.amber, 0.6) : color.border}`,
                }}
              >
                <Box component="span" sx={{ color: color.textFaint, fontWeight: 800, fontSize: '0.78rem' }}>
                  {LETTERS[i]}
                </Box>
                <Box component="span" sx={{ flex: 1 }}>
                  {option}
                </Box>
                {picked && (
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '50%',
                      bgcolor: color.amber,
                      color: '#0B0C10',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                    }}
                  >
                    {pos + 1}
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>

        <Button
          fullWidth
          disabled={order.length !== options.length || submitting}
          onClick={() => onSubmit({ kind: 'fastest_finger', answer: order })}
          variant="contained"
          disableElevation
          startIcon={<LockRoundedIcon />}
          sx={{
            mt: 3,
            minHeight: 50,
            borderRadius: `${radius.md}px`,
            textTransform: 'none',
            fontWeight: 800,
            bgcolor: color.amber,
            color: '#0B0C10',
            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.06)', color: color.textFaint },
          }}
        >
          {submitting ? 'Locking…' : 'Lock my answer'}
        </Button>
      </Box>
    </>
  );
}

/**
 * Times are shown; correctness is not, until the host reveals — otherwise the
 * room could deduce the answer from who is marked right.
 */
function FastestFingerResult({ quiz }) {
  const ff = quiz.fastestFinger ?? {};
  const ranking = ff.ranking ?? [];

  return (
    <>
      <ShowBar label="FASTEST RESPONSES" tone={color.amber} />
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {ff.revealed && ff.question?.correctOrder && (
          <Box sx={{ mb: 2.5, p: 2, borderRadius: `${radius.md}px`, bgcolor: tint(color.green, 0.07), border: `1px solid ${tint(color.green, 0.25)}` }}>
            <Typography sx={{ color: color.textFaint, fontSize: '0.65rem', fontWeight: 800 }}>CORRECT ORDER</Typography>
            <Typography sx={{ color: color.green, fontWeight: 700, fontSize: '1rem', mt: 0.5 }}>
              {ff.question.correctOrder.join('  →  ')}
            </Typography>
          </Box>
        )}

        <Stack spacing={0.75}>
          {ranking.map((r) => (
            <Stack
              key={`${r.rank}-${r.name}`}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                px: 1.75,
                py: 1.25,
                borderRadius: `${radius.md}px`,
                bgcolor: r.isYou ? tint(color.brand, 0.08) : 'rgba(255,255,255,0.02)',
                border: `1px solid ${r.isYou ? tint(color.brand, 0.35) : color.border}`,
              }}
            >
              <Typography sx={{ color: color.textFaint, fontWeight: 800, fontSize: '0.8rem', width: 18 }}>
                {r.rank}
              </Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography className="pxe-clamp-1" sx={{ color: color.text, fontSize: '0.85rem', fontWeight: 600 }}>
                  {r.name} {r.isYou && <Box component="span" sx={{ color: color.brand }}>(you)</Box>}
                </Typography>
                {r.teamName && (
                  <Typography sx={{ color: color.textFaint, fontSize: '0.68rem' }}>{r.teamName}</Typography>
                )}
              </Box>
              <Typography sx={{ color: color.text, fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem', fontWeight: 700 }}>
                {(r.elapsedMs / 1000).toFixed(2)}s
              </Typography>
              {r.correct === true && <CheckCircleRoundedIcon sx={{ fontSize: 17, color: color.green }} />}
              {r.correct === false && <CancelRoundedIcon sx={{ fontSize: 17, color: color.red }} />}
              {r.correct === null && <LockRoundedIcon sx={{ fontSize: 15, color: color.textFaint }} />}
            </Stack>
          ))}
        </Stack>

        <Typography sx={{ color: color.textFaint, fontSize: '0.78rem', textAlign: 'center', mt: 2.5 }}>
          {ff.revealed ? 'The host is choosing the contestant…' : 'Waiting for the host to reveal…'}
        </Typography>
      </Box>
    </>
  );
}

function ContestantIntro({ quiz, isYou }) {
  return (
    <>
      <ShowBar label={isYou ? 'YOUR TURN' : 'NEXT CONTESTANT'} tone={color.amber} />
      <HotSeatBanner contestant={quiz.activeContestant} youAreOn={isYou} />
      <Typography sx={{ color: color.textMuted, fontSize: '0.86rem', textAlign: 'center', pb: 4 }}>
        {isYou ? 'Get ready — the host starts your round in a moment.' : 'Taking the hot seat…'}
      </Typography>
    </>
  );
}

/** Selecting is not locking. The lock is a separate, deliberate act. */
function ContestantHotSeat({ quiz }) {
  const seconds = useServerCountdown(quiz.timer);
  const [selected, setSelected] = useState(null);
  const locked = quiz.answerState?.locked;
  const lockedOption = quiz.answerState?.lockedOption;

  return (
    <>
      <ShowBar
        label={`QUESTION ${(quiz.questionIndex ?? 0) + 1} / ${quiz.totalQuestions}`}
        right={<Timer seconds={seconds} />}
        tone={color.amber}
      />
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography sx={{ color: color.amber, fontSize: '0.68rem', fontWeight: 800, letterSpacing: 1.2, textAlign: 'center' }}>
          FOR {quiz.question?.points ?? 0} POINTS
        </Typography>

        <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.5, mt: 1.5, textAlign: 'center' }}>
          {quiz.question?.text}
        </Typography>

        <OptionGrid
          options={quiz.question?.options ?? []}
          selected={selected}
          lockedOption={lockedOption}
          onPick={setSelected}
          disabled={locked}
        />

        {locked ? (
          <Box sx={{ mt: 3, p: 2, textAlign: 'center', borderRadius: `${radius.md}px`, bgcolor: tint(color.amber, 0.08), border: `1px solid ${tint(color.amber, 0.3)}` }}>
            <Typography sx={{ color: color.amber, fontWeight: 700, fontSize: '0.9rem' }}>
              Answer locked — waiting for the host to reveal
            </Typography>
          </Box>
        ) : (
          <Typography sx={{ color: color.textFaint, fontSize: '0.78rem', textAlign: 'center', mt: 2.5, lineHeight: 1.6 }}>
            {selected
              ? `You have chosen ${selected}. Tell the host to lock it in.`
              : 'Select an answer. Nothing is final until the host locks it.'}
          </Typography>
        )}

        <Lifelines lifelines={quiz.lifelines} />
      </Box>
    </>
  );
}

/**
 * Availability is public — the room watches lifelines burn — but only the host
 * can spend one, so these are indicators rather than buttons.
 */
function Lifelines({ lifelines }) {
  if (!lifelines) return null;
  const items = [
    ['50:50', lifelines.fiftyFifty],
    ['Audience', lifelines.audiencePoll],
    ['Skip', lifelines.skip],
  ];

  return (
    <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${color.border}` }}>
      <Typography sx={{ color: color.textFaint, fontSize: '0.62rem', fontWeight: 800, mb: 1.25 }}>
        LIFELINES
      </Typography>
      <Stack direction="row" spacing={1}>
        {items.map(([label, available]) => (
          <Box
            key={label}
            sx={{
              flex: 1,
              textAlign: 'center',
              py: 1.25,
              borderRadius: `${radius.md}px`,
              border: `1px solid ${available ? tint(color.brand, 0.35) : color.border}`,
              bgcolor: available ? tint(color.brand, 0.07) : 'transparent',
              color: available ? color.brand : color.textFaint,
              fontSize: '0.76rem',
              fontWeight: 700,
              textDecoration: available ? 'none' : 'line-through',
            }}
          >
            {label}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function AudienceHotSeat({ quiz }) {
  const seconds = useServerCountdown(quiz.timer);

  return (
    <>
      <ShowBar
        label={`QUESTION ${(quiz.questionIndex ?? 0) + 1} / ${quiz.totalQuestions}`}
        right={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {quiz.audienceCount > 0 && (
              <Typography sx={{ color: color.textFaint, fontSize: '0.72rem' }}>
                {quiz.audienceCount} watching
              </Typography>
            )}
            <Timer seconds={seconds} />
          </Stack>
        }
      />

      <HotSeatBanner contestant={quiz.activeContestant} />

      <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
        <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.5, textAlign: 'center' }}>
          {quiz.question?.text}
        </Typography>

        <OptionGrid
          options={quiz.question?.options ?? []}
          lockedOption={quiz.answerState?.lockedOption}
          disabled
        />

        <Typography sx={{ color: color.textFaint, fontSize: '0.8rem', textAlign: 'center', mt: 2.5 }}>
          {quiz.answerState?.locked ? 'Answer locked — awaiting reveal' : 'The contestant is answering…'}
        </Typography>

        <Lifelines lifelines={quiz.lifelines} />
      </Box>
    </>
  );
}

function AudiencePollVoting({ quiz, onSubmit, submitting }) {
  const poll = quiz.audiencePoll ?? {};
  const [picked, setPicked] = useState(null);
  const voted = quiz.viewer?.hasVotedInPoll;

  if (voted) {
    return (
      <>
        <ShowBar label="HELP THE CONTESTANT" tone={color.violet} />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 34, color: color.green }} />
          <Typography sx={{ color: color.text, fontWeight: 700, mt: 1.5 }}>Your vote is locked</Typography>
          <Typography sx={{ color: color.textMuted, fontSize: '0.86rem', mt: 1 }}>
            You chose {quiz.viewer.myPollVote}. Waiting for the rest of the audience…
          </Typography>
          <Typography sx={{ color: color.textFaint, fontSize: '0.78rem', mt: 2 }}>
            {poll.totalVotes} responses
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <ShowBar label="HELP THE CONTESTANT" tone={color.violet} />
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.02rem', lineHeight: 1.5 }}>
          {quiz.question?.text}
        </Typography>

        <OptionGrid
          options={quiz.question?.options ?? []}
          selected={picked}
          onPick={setPicked}
          disabled={submitting}
        />

        <Button
          fullWidth
          disabled={!picked || submitting}
          onClick={() => onSubmit({ kind: 'audience_poll', option: picked })}
          variant="contained"
          disableElevation
          startIcon={<HowToVoteRoundedIcon />}
          sx={{
            mt: 3,
            minHeight: 48,
            borderRadius: `${radius.md}px`,
            textTransform: 'none',
            fontWeight: 800,
            bgcolor: color.violet,
            color: '#0B0C10',
            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.06)', color: color.textFaint },
          }}
        >
          {submitting ? 'Sending…' : 'Submit vote'}
        </Button>
      </Box>
    </>
  );
}

function ContestantPollWaiting({ quiz }) {
  const poll = quiz.audiencePoll ?? {};
  const results = poll.results;

  return (
    <>
      <ShowBar label="AUDIENCE POLL" tone={color.violet} />
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {results ? (
          <>
            <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1rem', mb: 2 }}>
              The audience says
            </Typography>
            <Stack spacing={1}>
              {Object.entries(results).map(([option, count]) => {
                const share = poll.totalVotes ? Math.round((count / poll.totalVotes) * 100) : 0;
                return (
                  <Box key={option} sx={{ position: 'relative', overflow: 'hidden', px: 2, py: 1.4, borderRadius: `${radius.md}px`, border: `1px solid ${color.border}` }}>
                    <Box aria-hidden sx={{ position: 'absolute', inset: 0, width: `${share}%`, bgcolor: tint(color.violet, 0.16), transition: 'width 500ms ease' }} />
                    <Stack direction="row" justifyContent="space-between" sx={{ position: 'relative' }}>
                      <Typography sx={{ color: color.text, fontSize: '0.88rem' }}>{option}</Typography>
                      <Typography sx={{ color: color.violet, fontWeight: 800, fontSize: '0.88rem' }}>{share}%</Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
            <Typography sx={{ color: color.textFaint, fontSize: '0.76rem', textAlign: 'center', mt: 2 }}>
              {poll.totalVotes} votes
            </Typography>
          </>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Loading label="Waiting for the audience" />
            <Typography sx={{ color: color.text, fontWeight: 700, mt: 1 }}>
              {poll.totalVotes} {poll.totalVotes === 1 ? 'response' : 'responses'} so far
            </Typography>
            <Typography sx={{ color: color.textMuted, fontSize: '0.84rem', mt: 0.75 }}>
              The split appears once the host closes the poll.
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
}

function AnswerReveal({ quiz, isYou }) {
  const correct = quiz.answerState?.correct;

  return (
    <>
      <ShowBar label="ANSWER" tone={correct ? color.green : color.red} />
      <Box sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
        {correct === true && <CheckCircleRoundedIcon sx={{ fontSize: 46, color: color.green }} />}
        {correct === false && <CancelRoundedIcon sx={{ fontSize: 46, color: color.red }} />}

        <Typography sx={{ color: correct ? color.green : color.red, fontWeight: 800, fontSize: '1.1rem', mt: 1 }}>
          {correct ? 'Correct' : 'Not this time'}
        </Typography>

        {isYou && (
          <Typography sx={{ color: color.textMuted, fontSize: '0.86rem', mt: 0.5 }}>
            {correct ? `+${quiz.question?.points ?? 0} points` : 'Better luck next round'}
          </Typography>
        )}

        <Typography sx={{ color: color.text, fontWeight: 600, fontSize: '1rem', mt: 2.5, lineHeight: 1.5 }}>
          {quiz.question?.text}
        </Typography>

        <OptionGrid
          options={quiz.question?.options ?? []}
          lockedOption={quiz.answerState?.lockedOption}
          correctAnswer={quiz.question?.correctAnswer}
          disabled
        />

        <Typography sx={{ color: color.textFaint, fontSize: '0.78rem', mt: 2.5 }}>
          The host decides what happens next.
        </Typography>
      </Box>
    </>
  );
}

function Leaderboard({ quiz }) {
  const rows = quiz.leaderboard ?? [];

  return (
    <>
      <ShowBar label="LEADERBOARD" tone={color.amber} />
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {rows.length === 0 ? (
          <Typography sx={{ color: color.textMuted, textAlign: 'center', py: 4 }}>
            No scores yet.
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {rows.map((r, i) => (
              <Stack
                key={r.participantId || r.name}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  px: 1.75,
                  py: 1.4,
                  borderRadius: `${radius.md}px`,
                  bgcolor: i === 0 ? tint(color.amber, 0.08) : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i === 0 ? tint(color.amber, 0.3) : color.border}`,
                }}
              >
                {i === 0 ? (
                  <EmojiEventsRoundedIcon sx={{ fontSize: 19, color: color.amber }} />
                ) : (
                  <Typography sx={{ color: color.textFaint, fontWeight: 800, fontSize: '0.8rem', width: 19, textAlign: 'center' }}>
                    {i + 1}
                  </Typography>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography className="pxe-clamp-1" sx={{ color: color.text, fontSize: '0.88rem', fontWeight: 600 }}>
                    {r.name}
                  </Typography>
                  {r.teamName && (
                    <Typography sx={{ color: color.textFaint, fontSize: '0.7rem' }}>{r.teamName}</Typography>
                  )}
                </Box>
                <Typography sx={{ color: color.text, fontWeight: 800 }}>{r.score}</Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </>
  );
}

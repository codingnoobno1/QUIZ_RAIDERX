'use client';

/**
 * Generated paper — Round 2 on a laptop.
 *
 * The paper is the server's: which questions this team was dealt, in what
 * order, with options in what order, and when the thirty minutes end. This
 * screen renders it, saves every choice as it is made, and hands it in. It
 * never sees a correct answer and never computes a score.
 *
 * Saving on every choice is the point. If the laptop dies at minute 28, the
 * answers already made are on the server, and the paper finalises from them at
 * the deadline whether or not anybody presses submit.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import CloudSyncRoundedIcon from '@mui/icons-material/CloudSyncRounded';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { color, radius, tint } from '@/theme/tokens';
import { usePaper, useSavePaperAnswers, useSubmitPaper } from '@/hooks/queries/useEventQueries';
import Loading from '@/components/async/Loading';
import { formatClock, useRemaining, useServerOffset } from './serverClock';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export default function PaperActivity({ activity, onExit }) {
    const paperQuery = usePaper(activity.id);
    const paper = paperQuery.data?.data ?? null;

    if (paperQuery.isPending) return <Loading label="Dealing your paper" />;

    if (paperQuery.isError) {
        return <Refusal error={paperQuery.error} onRetry={() => paperQuery.refetch()} onExit={onExit} />;
    }

    if (!paper) return <Loading label="Dealing your paper" />;

    if (paper.state === 'submitted') {
        return <PaperResult paper={paper} title={activity.title} onExit={onExit} />;
    }

    // Keyed by stage, so moving from the regular paper to the power questions
    // starts a fresh answer sheet rather than carrying the old page index over.
    return (
        <PaperSheet
            key={`${paper.paperId}:${paper.state}`}
            activity={activity}
            paper={paper}
            refetch={() => paperQuery.refetch()}
        />
    );
}

/* ── the sheet ──────────────────────────────────────────────────────────── */

function PaperSheet({ activity, paper, refetch }) {
    const isPower = paper.state === 'power';
    const questions = isPower ? paper.power.questions : paper.questions;

    const offset = useServerOffset(paper.serverTime);
    const remaining = useRemaining(paper.endsAt, offset, true);
    const unlockIn = useRemaining(paper.power?.unlockBy, offset, Boolean(paper.power?.stillEligible));

    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState(() => ({ ...(paper.savedAnswers ?? {}) }));
    const [confirming, setConfirming] = useState(false);

    const save = useSavePaperAnswers(activity.id);
    const submit = useSubmitPaper(activity.id);

    // Stable references for the save path. The clock re-renders this component
    // four times a second; without these, every tick would rebuild the save
    // and keyboard handlers.
    const saveAsync = save.mutateAsync;
    const refetchRef = useRef(refetch);
    refetchRef.current = refetch;
    const expired = remaining <= 0;

    // Choices not yet confirmed by the server. A ref, not state: the retry
    // timer and the submit path both need the current queue, not the one from
    // the render that scheduled them.
    const pending = useRef({});
    const [saveState, setSaveState] = useState('saved'); // saved | saving | failed
    const retryTimer = useRef(null);

    const flush = useCallback(async () => {
        const batch = { ...pending.current };
        if (!Object.keys(batch).length) {
            setSaveState('saved');
            return true;
        }
        setSaveState('saving');
        try {
            await saveAsync(batch);
            // Drop only what this batch confirmed; a choice made while it was in
            // flight stays queued for the next one.
            for (const [qid, option] of Object.entries(batch)) {
                if (pending.current[qid] === option) delete pending.current[qid];
            }
            const clear = Object.keys(pending.current).length === 0;
            setSaveState(clear ? 'saved' : 'saving');
            if (!clear) return flush();
            return true;
        } catch (error) {
            if (error?.code === 'TOO_LATE' || error?.code === 'ALREADY_SUBMITTED') {
                refetchRef.current();
                return false;
            }
            setSaveState('failed');
            clearTimeout(retryTimer.current);
            retryTimer.current = setTimeout(flush, 3000);
            return false;
        }
    }, [saveAsync]);

    useEffect(() => () => clearTimeout(retryTimer.current), []);

    const choose = useCallback(
        (questionId, option) => {
            if (expired) return;
            setAnswers((a) => ({ ...a, [questionId]: option }));
            pending.current[questionId] = option;
            flush();
        },
        [flush, expired],
    );

    // The deadline passed on this laptop's corrected clock: ask the server,
    // which finalises the paper from what was saved and returns the result.
    useEffect(() => {
        if (!expired) return undefined;
        const t = setTimeout(() => refetchRef.current(), 1500);
        return () => clearTimeout(t);
    }, [expired]);

    const question = questions[index];
    const answeredCount = questions.filter((q) => answers[q.questionId]).length;
    const unanswered = questions.length - answeredCount;
    const last = index >= questions.length - 1;

    // Keyboard: arrows move, 1-4 or A-D answer. A team working through 23
    // questions on a laptop should not need the trackpad for any of it.
    useEffect(() => {
        const onKey = (e) => {
            if (confirming || !question) return;
            if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, questions.length - 1));
            else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
            else {
                const k = e.key.toUpperCase();
                const pos = /^[1-6]$/.test(k) ? Number(k) - 1 : LETTERS.indexOf(k);
                if (pos >= 0 && pos < question.options.length) choose(question.questionId, question.options[pos]);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [choose, confirming, question, questions.length]);

    const handIn = async () => {
        // Submitting marks what the server has, so every queued choice must be
        // there first. A failed save blocks the hand-in rather than silently
        // submitting without it.
        const saved = await flush();
        if (!saved && Object.keys(pending.current).length) return;
        submit.mutate(undefined, {
            onSuccess: () => {
                setConfirming(false);
                refetchRef.current();
            },
            onError: (error) => {
                if (error?.code === 'TOO_LATE') refetchRef.current();
            },
        });
    };

    if (!question) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography sx={{ color: color.textMuted }}>This paper has no questions.</Typography>
            </Box>
        );
    }

    const urgent = remaining < 2 * 60 * 1000;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 980, mx: 'auto' }}>
            {/* ── header: stage, clock, save state ─────────────────────────── */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: isPower ? color.amber : color.brand, fontSize: '0.72rem', fontWeight: 800, letterSpacing: 1.5 }}>
                        {isPower ? 'POWER QUESTIONS' : 'ROUND PAPER'}
                        {paper.teamName ? ` · ${paper.teamName.toUpperCase()}` : ''}
                    </Typography>
                    <Typography sx={{ color: color.textMuted, fontSize: '0.82rem', mt: 0.25 }}>
                        {answeredCount} of {questions.length} answered
                    </Typography>
                </Box>

                <Stack direction="row" alignItems="center" spacing={2}>
                    <SaveIndicator state={saveState} />
                    <Box
                        aria-live="polite"
                        sx={{
                            px: 1.75,
                            py: 0.75,
                            borderRadius: `${radius.md}px`,
                            border: `1px solid ${urgent ? tint(color.red, 0.5) : color.border}`,
                            bgcolor: urgent ? tint(color.red, 0.1) : 'transparent',
                        }}
                    >
                        <Typography
                            sx={{
                                color: urgent ? color.red : color.text,
                                fontWeight: 800,
                                fontSize: '1.35rem',
                                fontVariantNumeric: 'tabular-nums',
                                lineHeight: 1.1,
                            }}
                        >
                            {formatClock(remaining)}
                        </Typography>
                    </Box>
                </Stack>
            </Stack>

            {!isPower && <PowerBanner power={paper.power} unlockIn={unlockIn} />}
            {isPower && (
                <Banner tone={color.amber} icon={BoltRoundedIcon}>
                    Power questions unlocked — {paper.power.pointsEach} points each. Your regular answers are locked in.
                </Banner>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 220px' }, gap: 3, mt: 2 }}>
                {/* ── the question ─────────────────────────────────────────── */}
                <Box>
                    <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mb: 1.5 }}>
                        <Typography sx={{ color: color.textMuted, fontSize: '0.78rem', fontWeight: 700, letterSpacing: 1 }}>
                            QUESTION {index + 1} OF {questions.length}
                        </Typography>
                        <Typography sx={{ color: color.textFaint, fontSize: '0.78rem' }}>
                            {isPower ? 'Power' : DIFFICULTY_LABEL[question.difficulty] ?? ''} · {question.points} pts
                        </Typography>
                    </Stack>

                    <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.5, mb: 2.5 }}>
                        {question.text}
                    </Typography>

                    {question.imageUrl && (
                        <Box
                            component="img"
                            src={question.imageUrl}
                            alt=""
                            sx={{ maxWidth: '100%', maxHeight: 280, borderRadius: `${radius.md}px`, mb: 2.5 }}
                        />
                    )}

                    <Stack spacing={1.25} role="radiogroup" aria-label={`Answers for question ${index + 1}`}>
                        {question.options.map((option, i) => {
                            const picked = answers[question.questionId] === option;
                            return (
                                <Box
                                    key={`${question.questionId}:${i}`}
                                    component="button"
                                    type="button"
                                    role="radio"
                                    aria-checked={picked}
                                    onClick={() => choose(question.questionId, option)}
                                    disabled={remaining <= 0}
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
                                        bgcolor: picked ? tint(color.brand, 0.12) : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${picked ? tint(color.brand, 0.7) : color.border}`,
                                        transition: 'background-color 120ms ease, border-color 120ms ease',
                                        '&:hover': { borderColor: picked ? undefined : color.borderStrong },
                                        '&:focus-visible': { outline: `2px solid ${color.brand}`, outlineOffset: 2 },
                                    }}
                                >
                                    <Box
                                        component="span"
                                        sx={{
                                            flexShrink: 0,
                                            width: 28,
                                            height: 28,
                                            display: 'grid',
                                            placeItems: 'center',
                                            borderRadius: '50%',
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                            bgcolor: picked ? color.brand : 'rgba(255,255,255,0.06)',
                                            color: picked ? color.bg : color.textMuted,
                                        }}
                                    >
                                        {LETTERS[i]}
                                    </Box>
                                    <span>{option}</span>
                                </Box>
                            );
                        })}
                    </Stack>

                    <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                        <NavButton onClick={() => setIndex((i) => Math.max(i - 1, 0))} disabled={index === 0}>
                            ← Previous
                        </NavButton>
                        {!last ? (
                            <NavButton primary onClick={() => setIndex((i) => i + 1)}>
                                Next →
                            </NavButton>
                        ) : (
                            <NavButton primary onClick={() => setConfirming(true)} disabled={remaining <= 0}>
                                {isPower ? 'Finish' : 'Review & submit'}
                            </NavButton>
                        )}
                    </Stack>
                    <Typography sx={{ mt: 1.25, color: color.textFaint, fontSize: '0.72rem' }}>
                        Keys: ← → to move · 1–4 or A–D to answer. Answers save as you choose them and can be changed until you submit.
                    </Typography>
                </Box>

                {/* ── palette ──────────────────────────────────────────────── */}
                <Box>
                    <Typography sx={{ color: color.textFaint, fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1, mb: 1 }}>
                        QUESTIONS
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.75 }}>
                        {questions.map((q, i) => {
                            const done = Boolean(answers[q.questionId]);
                            const here = i === index;
                            return (
                                <Box
                                    key={q.questionId}
                                    component="button"
                                    type="button"
                                    onClick={() => setIndex(i)}
                                    aria-label={`Question ${i + 1}${done ? ', answered' : ', not answered'}`}
                                    aria-current={here ? 'step' : undefined}
                                    sx={{
                                        aspectRatio: '1',
                                        font: 'inherit',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        fontVariantNumeric: 'tabular-nums',
                                        cursor: 'pointer',
                                        borderRadius: `${radius.sm}px`,
                                        color: done ? color.bg : color.textMuted,
                                        bgcolor: done ? tint(color.brand, 0.85) : 'rgba(255,255,255,0.03)',
                                        border: `2px solid ${here ? color.text : done ? 'transparent' : color.border}`,
                                        '&:focus-visible': { outline: `2px solid ${color.brand}`, outlineOffset: 2 },
                                    }}
                                >
                                    {i + 1}
                                </Box>
                            );
                        })}
                    </Box>
                    <Button
                        fullWidth
                        onClick={() => setConfirming(true)}
                        disabled={remaining <= 0}
                        variant="outlined"
                        sx={{
                            mt: 2,
                            minHeight: 42,
                            borderRadius: `${radius.md}px`,
                            textTransform: 'none',
                            fontWeight: 800,
                            color: color.brand,
                            borderColor: tint(color.brand, 0.4),
                        }}
                    >
                        {isPower ? 'Finish' : 'Submit paper'}
                    </Button>
                </Box>
            </Box>

            <Dialog open={confirming} onClose={() => !submit.isPending && setConfirming(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>{isPower ? 'Finish the round?' : 'Submit your paper?'}</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 1.5 }}>
                        {unanswered === 0
                            ? `All ${questions.length} questions answered.`
                            : `${unanswered} of ${questions.length} ${unanswered === 1 ? 'question is' : 'questions are'} unanswered and will score 0.`}
                    </Typography>
                    {!isPower && paper.power?.enabled && (
                        <Typography sx={{ color: paper.power.stillEligible ? color.amber : color.textMuted, fontSize: '0.9rem' }}>
                            {paper.power.stillEligible
                                ? `Submitting now unlocks ${paper.power.count} power questions worth ${paper.power.pointsEach} points each. Your answers above will be locked.`
                                : 'The power-question cutoff has passed, so submitting ends your round.'}
                        </Typography>
                    )}
                    {!isPower && !paper.power?.enabled && (
                        <Typography sx={{ color: color.textMuted, fontSize: '0.9rem' }}>You can&apos;t change answers after submitting.</Typography>
                    )}
                    {saveState === 'failed' && (
                        <Typography sx={{ color: color.red, mt: 1.5, fontSize: '0.9rem' }}>
                            Some answers haven&apos;t reached the server yet. Check the connection — submitting will wait for them.
                        </Typography>
                    )}
                    {submit.isError && submit.error?.code !== 'TOO_LATE' && (
                        <Typography sx={{ color: color.red, mt: 1.5, fontSize: '0.9rem' }}>{submit.error.message}</Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setConfirming(false)} disabled={submit.isPending} sx={{ textTransform: 'none' }}>
                        Keep working
                    </Button>
                    <Button
                        onClick={handIn}
                        disabled={submit.isPending || saveState === 'saving'}
                        variant="contained"
                        disableElevation
                        sx={{ textTransform: 'none', fontWeight: 800, bgcolor: color.brand, color: color.bg }}
                    >
                        {submit.isPending ? 'Submitting…' : isPower ? 'Finish' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

function PowerBanner({ power, unlockIn }) {
    if (!power?.enabled) return null;

    if (power.stillEligible) {
        return (
            <Banner tone={color.amber} icon={BoltRoundedIcon}>
                Submit within <strong>{formatClock(unlockIn)}</strong> to unlock {power.count} power questions worth{' '}
                {power.pointsEach} points each.
            </Banner>
        );
    }
    return (
        <Banner tone={color.textFaint} icon={BoltRoundedIcon}>
            The power-question cutoff has passed. Finish your paper for the regular marks.
        </Banner>
    );
}

function Banner({ tone, icon: Icon, children }) {
    return (
        <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
                px: 2,
                py: 1.25,
                borderRadius: `${radius.md}px`,
                bgcolor: tint(tone, 0.08),
                border: `1px solid ${tint(tone, 0.3)}`,
            }}
        >
            <Icon sx={{ color: tone, fontSize: 20, flexShrink: 0 }} />
            <Typography sx={{ color: color.text, fontSize: '0.88rem' }}>{children}</Typography>
        </Stack>
    );
}

function SaveIndicator({ state }) {
    const map = {
        saved: { icon: CloudDoneRoundedIcon, tone: color.green, text: 'Saved' },
        saving: { icon: CloudSyncRoundedIcon, tone: color.textMuted, text: 'Saving…' },
        failed: { icon: CloudOffRoundedIcon, tone: color.red, text: 'Not saved — retrying' },
    };
    const { icon: Icon, tone, text } = map[state] ?? map.saved;
    return (
        <Stack direction="row" spacing={0.75} alignItems="center" aria-live="polite">
            <Icon sx={{ fontSize: 18, color: tone }} />
            <Typography sx={{ color: tone, fontSize: '0.78rem', fontWeight: 600 }}>{text}</Typography>
        </Stack>
    );
}

function NavButton({ children, primary, ...props }) {
    return (
        <Button
            {...props}
            variant={primary ? 'contained' : 'outlined'}
            disableElevation
            sx={{
                flex: 1,
                minHeight: 46,
                borderRadius: `${radius.md}px`,
                textTransform: 'none',
                fontWeight: 800,
                ...(primary
                    ? { bgcolor: color.brand, color: color.bg }
                    : { color: color.text, borderColor: color.border }),
                '&.Mui-disabled': { bgcolor: primary ? 'rgba(255,255,255,0.06)' : undefined, color: color.textFaint },
            }}
        >
            {children}
        </Button>
    );
}

/* ── result ─────────────────────────────────────────────────────────────── */

function PaperResult({ paper, title, onExit }) {
    const powerEarned = paper.power?.unlocked;

    return (
        <Box sx={{ p: 4, textAlign: 'center', maxWidth: 520, mx: 'auto' }}>
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
                PAPER SUBMITTED{paper.teamName ? ` · ${paper.teamName.toUpperCase()}` : ''}
            </Typography>

            <Typography sx={{ color: color.text, fontWeight: 900, fontSize: '3rem', lineHeight: 1.1, my: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                {paper.score}
                <span style={{ color: color.textFaint, fontSize: '1.4rem' }}> / {paper.totalPossible}</span>
            </Typography>

            <Typography sx={{ color: color.textMuted, fontSize: '0.9rem' }}>
                {title} · {paper.correctCount} correct
            </Typography>

            {powerEarned && (
                <Typography sx={{ color: color.amber, fontSize: '0.9rem', mt: 1 }}>
                    Regular {paper.regularScore} + power {paper.powerScore}
                </Typography>
            )}

            <Typography sx={{ color: color.textFaint, fontSize: '0.8rem', mt: 2.5, lineHeight: 1.5 }}>
                Answers and question-by-question marks are released after the round, once every team has finished.
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

/* ── refusals ───────────────────────────────────────────────────────────── */

function Refusal({ error, onRetry, onExit }) {
    const copy = useMemo(() => {
        switch (error?.code) {
            case 'NOT_ACTIVE':
                return { title: 'This round isn’t running', body: 'Wait for the organiser to start it.' };
            case 'BANK_TOO_SMALL':
                return {
                    title: 'The paper can’t be generated yet',
                    body: 'The organiser needs to add questions to the bank. They have been told what is missing.',
                };
            case 'NO_TEAM':
                return { title: 'You’re not on a team', body: 'This round is sat by teams. Ask your team leader to invite you.' };
            default:
                return { title: 'Couldn’t open your paper', body: error?.message || 'Check your connection and try again.' };
        }
    }, [error]);

    return (
        <Box sx={{ p: 4, textAlign: 'center', maxWidth: 480, mx: 'auto' }}>
            <Typography sx={{ color: color.text, fontWeight: 800, fontSize: '1.1rem' }}>{copy.title}</Typography>
            <Typography sx={{ color: color.textMuted, mt: 1 }}>{copy.body}</Typography>
            <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
                <Button onClick={onRetry} variant="contained" disableElevation sx={{ textTransform: 'none', fontWeight: 800, bgcolor: color.brand, color: color.bg }}>
                    Try again
                </Button>
                <Button onClick={onExit} sx={{ textTransform: 'none', color: color.textMuted }}>
                    Back to lobby
                </Button>
            </Stack>
        </Box>
    );
}

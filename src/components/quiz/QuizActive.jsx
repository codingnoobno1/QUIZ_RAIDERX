"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Chip, CircularProgress, Container, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { AccessTimeRounded, ArrowForwardRounded, CheckCircleRounded, QuizRounded } from "@mui/icons-material";
import QuestionRenderer from "./QuestionRenderer";

export default function QuizActive({ questions, currentIndex, answers, onRecordAnswer, onNext, onSubmit, isSubmitting }) {
    const question = questions[currentIndex];
    const limit = question.time || 30;
    const [timeLeft, setTimeLeft] = useState(limit);
    const [draft, setDraft] = useState(answers[question._id]?.value ?? "");
    const submittedRef = useRef(false);
    const isLast = currentIndex === questions.length - 1;

    useEffect(() => {
        setTimeLeft(limit);
        setDraft(answers[question._id]?.value ?? "");
        submittedRef.current = false;
    }, [question._id, limit]);

    const finishQuestion = (value) => {
        const payload = { questionId: question._id, value, timeTaken: Math.max(0, limit - timeLeft) };
        onRecordAnswer(payload.questionId, payload.value, payload.timeTaken);
        if (isLast) onSubmit(payload);
        else onNext();
    };

    useEffect(() => {
        if (isSubmitting || submittedRef.current) return;
        if (timeLeft <= 0) {
            submittedRef.current = true;
            finishQuestion(draft);
            return;
        }
        const timer = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [timeLeft, isSubmitting]);

    const continueQuiz = () => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        finishQuestion(draft);
    };

    const answeredCount = Object.keys(answers).length;
    const timerTone = timeLeft <= 5 ? '#ef6b73' : timeLeft <= 10 ? '#eab84d' : '#55c7dd';

    return (
        <Box sx={{ minHeight: '100dvh', bgcolor: '#080a0f', color: '#f4f5f7', py: { xs: 2, md: 5 }, backgroundImage: 'radial-gradient(circle at 85% 5%, rgba(56,185,211,.12), transparent 32%)' }}>
            <Container maxWidth="lg">
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                    <Stack direction="row" spacing={1.25} alignItems="center"><Box sx={{ width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'rgba(56,185,211,.12)', color: '#55c7dd' }}><QuizRounded /></Box><Box><Typography sx={{ fontWeight: 850 }}>PIXEL Quiz Arena</Typography><Typography sx={{ color: '#737a88', fontSize: 12 }}>Attempt in progress · answers save per question</Typography></Box></Stack>
                    <Chip icon={<AccessTimeRounded />} label={`${timeLeft}s`} sx={{ minWidth: 82, color: timerTone, bgcolor: `${timerTone}14`, border: `1px solid ${timerTone}55`, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }} />
                </Stack>
                <Paper elevation={0} sx={{ overflow: 'hidden', borderRadius: { xs: 3, md: 4 }, bgcolor: '#111319', color: '#f4f5f7', border: '1px solid #262a34' }}>
                    <Box sx={{ px: { xs: 2, md: 4 }, py: 2, borderBottom: '1px solid #262a34' }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}><Typography sx={{ color: '#969ca8', fontSize: 12, fontWeight: 800 }}>QUESTION {currentIndex + 1} OF {questions.length}</Typography><Typography sx={{ color: '#737a88', fontSize: 12 }}>{answeredCount} answered</Typography></Stack>
                        <LinearProgress variant="determinate" value={100 * ((currentIndex + 1) / questions.length)} sx={{ height: 6, borderRadius: 99, bgcolor: '#222630', '& .MuiLinearProgress-bar': { bgcolor: '#38b9d3', borderRadius: 99 } }} />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) 220px' } }}>
                        <Box sx={{ p: { xs: 2.5, sm: 4, md: 5 } }}>
                            <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}><Chip size="small" label={(question.type || 'question').toUpperCase()} sx={{ color: '#55c7dd', bgcolor: 'rgba(56,185,211,.1)', fontWeight: 800 }} /><Chip size="small" label={`${question.points || 1} ${(question.points || 1) === 1 ? 'point' : 'points'}`} sx={{ color: '#aeb4bf', bgcolor: 'rgba(255,255,255,.05)' }} /></Stack>
                            <Typography component="h1" sx={{ fontSize: { xs: '1.4rem', md: '1.85rem' }, fontWeight: 750, lineHeight: 1.4, mb: 4, whiteSpace: 'pre-line' }}>{question.text || "Question text unavailable"}</Typography>
                            {question.blocks && <Box sx={{ mb: 3, p: 2.5, bgcolor: '#090b10', color: '#cbd5e1', border: '1px solid #292e39', borderRadius: 2, fontFamily: 'monospace', fontSize: '.88rem', overflowX: 'auto' }}>{question.blocks.map((block) => <div key={block.blockId}>{block.code}</div>)}</Box>}
                            <QuestionRenderer question={question} value={draft} onAnswer={setDraft} />
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mt: 4, pt: 3, borderTop: '1px solid #262a34' }}><Typography sx={{ color: '#737a88', fontSize: 13 }}>Select or enter an answer, then continue.</Typography><Button disabled={isSubmitting || draft === '' || draft == null} onClick={continueQuiz} variant="contained" endIcon={isLast ? <CheckCircleRounded /> : <ArrowForwardRounded />} sx={{ minHeight: 48, px: 3, bgcolor: '#38b9d3', color: '#061014', fontWeight: 850, textTransform: 'none', '&:hover': { bgcolor: '#55c7dd' } }}>{isSubmitting ? <><CircularProgress size={18} sx={{ mr: 1 }} />Submitting…</> : isLast ? 'Submit quiz' : 'Save & continue'}</Button></Stack>
                        </Box>
                        <Box sx={{ p: 2.5, bgcolor: '#0d0f14', borderLeft: { md: '1px solid #262a34' }, borderTop: { xs: '1px solid #262a34', md: 0 } }}><Typography sx={{ color: '#737a88', fontSize: 11, fontWeight: 850, letterSpacing: 1, mb: 2 }}>ATTEMPT MAP</Typography><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>{questions.map((item, index) => { const done = Boolean(answers[item._id]); const current = index === currentIndex; return <Box key={item._id} sx={{ aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: 1.5, fontSize: 12, fontWeight: 800, color: current ? '#071014' : done ? '#65bd91' : '#737a88', bgcolor: current ? '#38b9d3' : done ? 'rgba(101,189,145,.1)' : '#171a21', border: `1px solid ${current ? '#38b9d3' : done ? 'rgba(101,189,145,.35)' : '#292e39'}` }}>{index + 1}</Box>; })}</Box><Typography sx={{ mt: 3, color: '#646b77', fontSize: 12, lineHeight: 1.6 }}>The current question advances when saved. Unanswered timed-out questions are recorded automatically.</Typography></Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

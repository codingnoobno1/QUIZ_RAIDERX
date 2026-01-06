"use client";
import React, { useEffect, useState, use } from "react";
import { Box, Typography, CircularProgress, Container } from "@mui/material";

// Premium Components
import QuizHeader from "@/components/quiz/QuizHeader";
import QuestionCounter from "@/components/quiz/QuestionCounter";
import QuestionRenderer from "@/components/quiz/QuestionRenderer";
import QuizNavigation from "@/components/quiz/QuizNavigation";
import QuizResult from "@/components/quiz/QuizResult";

// Styles
import "../quiz-design.css";

export default function QuizPage({ params }) {
    const resolvedParams = use(params);
    const quizId = resolvedParams.id;

    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [attemptId, setAttemptId] = useState(null);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Performance metrics
    const [startTime, setStartTime] = useState(Date.now());

    useEffect(() => {
        const init = async () => {
            try {
                console.log("[QuizPage] Fetching quiz:", quizId);
                const res = await fetch(`/api/quiz/${quizId}`);
                if (!res.ok) throw new Error("Connection failed");
                const data = await res.json();

                if (!data.quiz) throw new Error("Payload missing");
                console.log("[QuizPage] Quiz Loaded:", data.quiz.title, "Questions:", data.quiz.questions?.length);

                setQuiz(data.quiz);
                const qs = data.quiz.questions || [];
                setQuestions(qs);

                // Start Persistent Session
                const startRes = await fetch('/api/quiz/attempt/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quizId })
                });
                const startData = await startRes.json();
                console.log("[QuizPage] Session Started:", startData.attemptId);
                setAttemptId(startData.attemptId);

                setIsLoading(false);
                setStartTime(Date.now());
            } catch (err) {
                console.error("[QuizPage] Initialization Error:", err);
                setIsLoading(false);
            }
        };

        if (quizId) init();
    }, [quizId]);

    // EFFECT TO LOG STATE CHANGES
    useEffect(() => {
        console.log("[QuizPage] Current State:", {
            current,
            questionsCount: questions.length,
            answersCount: Object.keys(answers).length
        });
    }, [current, questions, answers]);

    const recordAnswer = (qId, val) => {
        console.log(`[QuizPage] recordAnswer called for ID: ${qId} with VALUE:`, val);
        if (!qId) return;

        const timeTaken = Math.round((Date.now() - startTime) / 1000);

        setAnswers(prev => {
            const newState = {
                ...prev,
                [qId]: {
                    questionId: qId,
                    value: val,
                    timeTaken: timeTaken
                }
            };
            console.log("[QuizPage] Updated Answers State:", newState);
            return newState;
        });
    };

    const submitQuiz = async () => {
        console.log("[QuizPage] Starting Submission. Raw Answers:", answers);
        setIsSubmitting(true);

        const answersArray = Object.values(answers).map(a => ({
            questionId: a.questionId,
            answer: a.value,
            timeTaken: a.timeTaken
        }));

        try {
            const res = await fetch("/api/quiz/attempt/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attemptId,
                    quizId,
                    userAnswers: answersArray
                })
            });

            const data = await res.json();
            console.log("[QuizPage] Submission Successful. Score:", data.score);
            setResult(data);
        } catch (err) {
            console.error("[QuizPage] Submission Sequence Failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextQuestion = () => {
        setCurrent(c => c + 1);
        setStartTime(Date.now());
    };

    const prevQuestion = () => {
        setCurrent(c => c - 1);
        setStartTime(Date.now());
    };

    if (isLoading) return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            sx={{ bgcolor: '#0b0e14', color: 'white' }}
        >
            <CircularProgress size={60} sx={{ color: '#7c3aed', mb: 2 }} />
            <Typography variant="body1" sx={{ opacity: 0.6 }}>Initializing Secure Session...</Typography>
        </Box>
    );

    if (result) return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#0b0e14', pt: 4 }}>
            <QuizResult result={result} />
        </Box>
    );

    const question = questions[current];
    const qId = question?._id || question?.id;
    const userAnsObj = answers[qId];
    console.log(`[QuizPage] Rendering Question ${current} (ID: ${qId}). Current Answer:`, userAnsObj?.value);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#0b0e14', color: 'white', position: 'relative', overflow: 'hidden' }}>
            {/* Background Aesthetic Effects */}
            <Box sx={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

            <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 }, position: 'relative', zIndex: 1 }}>
                <QuizHeader quiz={quiz} />
                <QuestionCounter current={current} total={questions.length} />

                <Box sx={{ minHeight: '350px', py: { xs: 4, md: 6 }, px: { xs: 2, md: 4 }, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    {question && (
                        <QuestionRenderer
                            question={question}
                            onAnswer={(val) => recordAnswer(qId, val)}
                            value={userAnsObj?.value}
                        />
                    )}
                </Box>

                <QuizNavigation
                    current={current}
                    total={questions.length}
                    onNext={nextQuestion}
                    onPrev={prevQuestion}
                    onSubmit={submitQuiz}
                    isSubmitting={isSubmitting}
                />
            </Container>
        </Box>
    );
}

"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import QuizActive from "./QuizActive";
import QuizResult from "./QuizResult";

/**
 * @typedef {Object} Question
 * @property {string} _id
 * @property {string} text
 * @property {string} type
 * @property {string[]} options
 * @property {number} points
 * 
 * @typedef {Object} UserAnswer
 * @property {string} questionId
 * @property {string|number|boolean} value
 * @property {number} timeTaken
 * 
 * @typedef {Object} QuizState
 * @property {string} quizId
 * @property {number} startedAt
 * @property {number} currentIndex
 * @property {Record<string, UserAnswer>} answers
 * @property {"loading" | "active" | "submitting" | "result" | "error"} status
 */

export default function Quiz({ quizId }) {
    const [questions, setQuestions] = useState([]);
    const [state, setState] = useState({
        quizId,
        attemptId: null, // Track the DB session ID
        startedAt: 0,
        currentIndex: 0,
        answers: {},
        status: "loading"
    });
    const [error, setError] = useState(null);
    const [resultData, setResultData] = useState(null);

    // Initial Fetch & Start Session
    useEffect(() => {
        if (!quizId) return;

        const initQuiz = async () => {
            try {
                // 1. Fetch Quiz Data
                const res = await fetch(`/api/quiz/${quizId}`);
                if (!res.ok) throw new Error("Failed to load quiz data");
                const data = await res.json();

                if (!data.quiz || !data.quiz.questions?.length) {
                    throw new Error("No questions found in this quiz.");
                }

                // 2. Start Attempt Session
                const startRes = await fetch('/api/quiz/attempt/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quizId })
                });

                if (!startRes.ok) throw new Error("Failed to start quiz session");
                const startData = await startRes.json();


                setQuestions(data.quiz.questions);
                setState(prev => ({
                    ...prev,
                    attemptId: startData.attemptId,
                    startedAt: Date.now(),
                    status: "active"
                }));

            } catch (err) {
                console.error("Init error:", err);
                setError(err.message);
                setState(prev => ({ ...prev, status: "error" }));
            }
        };

        initQuiz();
    }, [quizId]);

    // Authoritative Answer Recorder
    const recordAnswer = useCallback((questionId, value, timeTaken) => {
        setState(prev => ({
            ...prev,
            answers: {
                ...prev.answers,
                [questionId]: {
                    questionId,
                    value,
                    timeTaken: timeTaken || (Date.now() - prev.startedAt) // Fallback if component doesn't track time
                }
            }
        }));
    }, []);

    const handleNext = useCallback(() => {
        setState(prev => {
            if (prev.currentIndex + 1 < questions.length) {
                return { ...prev, currentIndex: prev.currentIndex + 1 };
            }
            return prev; // Should rely on external submit trigger or handle last question logic
        });
    }, [questions.length]);

    const handleSubmit = async (finalAnswer = null) => {
        setState(prev => ({ ...prev, status: "submitting" }));

        // Use the current state answers, but merge finalAnswer if provided (to solve race condition)
        const currentAnswers = { ...state.answers };
        if (finalAnswer) {
            // Ensure format matches state storage
            currentAnswers[finalAnswer.questionId] = {
                questionId: finalAnswer.questionId,
                value: finalAnswer.value,
                timeTaken: finalAnswer.timeTaken
            };
        }

        // Convert answers record to array for API
        const answersArray = Object.values(currentAnswers).map(a => ({
            questionId: a.questionId,
            answer: a.value, // Map 'value' to 'answer' for API compatibility
            timeTaken: a.timeTaken
        }));

        console.log("🚀 [CLIENT SUBMIT] Preparing submission:", {
            attemptId: state.attemptId,
            count: answersArray.length,
            answers: answersArray
        });

        try {
            const res = await fetch('/api/quiz/attempt/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attemptId: state.attemptId, // Use the persistent ID
                    userAnswers: answersArray
                })
            });

            if (!res.ok) throw new Error("Submission failed");

            const data = await res.json();
            if (data.success) {
                setResultData(data);
                setState(prev => ({ ...prev, status: "result" }));
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Submission error:", err);
            setError("Failed to submit results. Please try again.");
            setState(prev => ({ ...prev, status: "error" }));
        }
    };

    if (state.status === "loading") {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
                <Typography ml={2}>Loading Quiz...</Typography>
            </Box>
        );
    }

    if (state.status === "error") {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (state.status === "result" && resultData) {
        return <QuizResult resultData={resultData} />;
    }

    if (state.status === "active" || state.status === "submitting") {
        // Current Question might be undefined if index OOB
        const currentQ = questions[state.currentIndex];
        if (!currentQ) return null;

        return (
            <QuizActive
                questions={questions}
                currentIndex={state.currentIndex}
                answers={state.answers}
                onRecordAnswer={recordAnswer} // Pass the authoritative recorder
                onNext={handleNext}
                onSubmit={handleSubmit}
                isSubmitting={state.status === "submitting"}
            />
        );
    }

    return null;
}

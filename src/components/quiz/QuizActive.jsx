import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, LinearProgress, Button } from "@mui/material";
import QuestionRenderer from "./QuestionRenderer";

export default function QuizActive({ questions, currentIndex, answers, onRecordAnswer, onNext, onSubmit, isSubmitting }) {
    const question = questions[currentIndex];
    const [timeLeft, setTimeLeft] = useState(question.time || 30);
    const isLastQuestion = currentIndex === questions.length - 1;

    // Reset timer when question changes
    useEffect(() => {
        setTimeLeft(question.time || 30);
    }, [question]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) {
            handleTimeUp();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleTimeUp = () => {
        // Auto-record empty if not answered
        if (!answers[question._id]) {
            handleAnswer("");
        }
    };

    const handleAnswer = (val) => {
        const timeAllowed = question.time || 30; // Use specific limit or default
        const timeTaken = Math.max(0, timeAllowed - timeLeft);

        // Record in state (for persistent/resume logic if we add it later)
        onRecordAnswer(question._id, val, timeTaken);

        const answerPayload = { questionId: question._id, value: val, timeTaken };

        if (isLastQuestion) {
            onSubmit(answerPayload);
        } else {
            onNext();
        }
    };

    // proceed function is no longer needed separated from handleAnswer for the main flow,
    // but handleTimeUp uses it. Let's update handleTimeUp to use handleAnswer("") directly.

    // We can remove proceed() or keep it for manual skip if needed.
    // For now, removing the distinct proceed and integrating logic.

    if (isSubmitting) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <Typography>Submitting your answers...</Typography>
                <LinearProgress sx={{ mt: 2, width: '100%' }} />
            </Box>
        );
    }

    return (
        <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ background: '#f7fafd', p: 2 }}>
            <Paper sx={{ p: 4, minWidth: 350, maxWidth: 650, width: '100%', borderRadius: 4, boxShadow: 3 }}>

                {/* Progress Bar */}
                <LinearProgress
                    variant="determinate"
                    value={100 * ((currentIndex + 1) / questions.length)}
                    sx={{ mb: 3, borderRadius: 2, height: 6 }}
                />

                {/* Header Info */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                        Question {currentIndex + 1} <span style={{ color: '#777', fontSize: '0.8em' }}>/ {questions.length}</span>
                    </Typography>
                    <Typography variant="h6" color={timeLeft < 10 ? "error" : "text.primary"} fontWeight="bold">
                        ⏱ {timeLeft}s
                    </Typography>
                </Box>

                {/* Question Info */}
                <Box mb={3}>
                    <Typography variant="caption" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', px: 1, py: 0.5, borderRadius: 1 }}>
                        {question.type?.toUpperCase()}
                    </Typography>
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        {question.points || 1} Points
                    </Typography>
                </Box>

                {/* Question Text */}
                <Typography variant="h5" mb={4} fontWeight="medium" sx={{ whiteSpace: 'pre-line' }}>
                    {question.text || "Question Text Missing"}
                </Typography>

                {/* Block Code Display if needed */}
                {question.blocks && (
                    <Box mb={3} p={2} bgcolor="#282c34" color="#abb2bf" borderRadius={2} fontFamily="monospace" fontSize="0.9rem">
                        {question.blocks.map(b => (
                            <div key={b.blockId}>{b.code}</div>
                        ))}
                    </Box>
                )}

                {/* Render Question Input */}
                <QuestionRenderer
                    question={question}
                    onAnswer={(val) => {
                        handleAnswer(val);
                    }}
                />

                {/* Optional Navigation Controls (Hidden for now to match previous flow, but ready to enable) */}
                {/* 
                <Box mt={3} display="flex" justifyContent="flex-end">
                    <Button variant="contained" onClick={proceed}>
                        {isLastQuestion ? "Submit Quiz" : "Next Question"}
                    </Button>
                </Box> 
                */}

            </Paper>
        </Box>
    );
}

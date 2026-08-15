'use client';
import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, LinearProgress } from "@mui/material";
import QuestionForm from "./QuestionForm";
import ResultPage from "./Result";

export default function QuizModePage() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch("/question.json")
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setTimeLeft(data.questions?.[0]?.time || 30);
      });
  }, []);

  useEffect(() => {
    if (!questions.length || showResult) return;
    if (timeLeft <= 0) handleSubmit("");
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, questions, showResult]);

  function getPoints(base, timeTaken, timeAllowed) {
    const saved = Math.max(0, timeAllowed - timeTaken);
    const bonus = Math.floor((saved / timeAllowed) * 10) * 0.5;
    return base + bonus;
  }

  function handleSubmit(answer) {
    const q = questions[current];
    const correct = ["mcq", "fillup", "findoutput"].includes(q.type)
      ? String(answer).trim().toLowerCase() === String(q.answer).trim().toLowerCase()
      : q.type === "truefalse"
      ? String(answer) === String(q.answer)
      : true;

    const timeTaken = q.time - timeLeft;
    const points = correct ? getPoints(q.score, timeTaken, q.time) : 0;

    setScore((s) => s + points);
    setUserAnswers((ua) => [...ua, { answer, correct, points, timeTaken }]);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setTimeLeft(questions[current + 1].time);
    } else {
      setShowResult(true);
    }
  }

  if (!questions.length) return <Box p={4}>Loading...</Box>;
  if (showResult)
    return <ResultPage userAnswers={userAnswers} score={score} />;

  const q = questions[current];

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ background: '#f7fafd' }}>
      <Paper sx={{ p: 4, minWidth: 350, maxWidth: 650, width: '100%' }}>
        <LinearProgress variant="determinate" value={100 * (current / questions.length)} sx={{ mb: 1 }} />
        <Typography variant="h6" color="primary" mb={1}>Question {current + 1} of {questions.length}</Typography>
        <Typography variant="subtitle2" color="text.secondary" mb={1}>
          Level: {q.level} | Time: {q.time}s | Score: {q.score}
        </Typography>
        <LinearProgress variant="determinate" value={100 * (timeLeft / q.time)} sx={{ mb: 2, height: 8 }} />
        <Typography variant="h5" mb={2}>{q.text || q.blocks?.map(b => `Block #${b.blockId}`).join(", ")}</Typography>
        <QuestionForm q={q} onSubmit={handleSubmit} />
      </Paper>
    </Box>
  );
}

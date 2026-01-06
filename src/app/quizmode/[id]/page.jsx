"use client";
import React, { useEffect, useState, use } from "react";
import { Box, Typography, CircularProgress, Container } from "@mui/material";

// Components
import QuizHeader from "@/components/quiz/QuizHeader";
import QuestionCounter from "@/components/quiz/QuestionCounter";
import QuestionRenderer from "@/components/quiz/QuestionRenderer";
import QuizNavigation from "@/components/quiz/QuizNavigation";
import QuizResult from "@/components/quiz/QuizResult";

export default function QuizPage({ params }) {
  // Unwrap params in Next.js 15
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

  // 1. Initialize Quiz & Session
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch Quiz Data
        const res = await fetch(`/api/quiz/${quizId}`);
        if (!res.ok) throw new Error("Failed to load quiz");
        const data = await res.json();

        if (!data.quiz) throw new Error("Quiz not found");
        setQuiz(data.quiz);
        setQuestions(data.quiz.questions || []);

        // Get student name from localStorage or prompt
        const studentName = localStorage.getItem('studentName') || prompt('Enter your name:');
        if (studentName) {
          localStorage.setItem('studentName', studentName);
        }

        // Start Persistent Session
        const startRes = await fetch('/api/quiz/attempt/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId, studentName })
        });

        const startData = await startRes.json();

        if (!startRes.ok) {
          if (startData.alreadySubmitted) {
            alert(`${startData.message}\nYour previous score: ${startData.score || 'N/A'}`);
            window.location.href = '/coding-club/quiz';
            return;
          }
          throw new Error(startData.error || 'Failed to start quiz');
        }

        setAttemptId(startData.attemptId);
        setIsLoading(false);
      } catch (err) {
        console.error("Quiz Init Error:", err);
        alert(err.message);
        setIsLoading(false);
      }
    };

    if (quizId) init();
  }, [quizId]);

  // 2. Logic: Record Answer
  const recordAnswer = (val) => {
    const question = questions[current];
    if (!question) return;

    setAnswers(prev => ({
      ...prev,
      [question._id]: {
        questionId: question._id,
        value: val,
        timeTaken: 0 // Timer logic moved out for simplicity or can be re-added
      }
    }));
  };

  // 3. Logic: Submit Quiz to Authoritative Backend
  const submitQuiz = async () => {
    setIsSubmitting(true);

    // Prepare payload (convert map to array)
    const answersArray = Object.values(answers).map(a => ({
      questionId: a.questionId,
      answer: a.value,
      timeTaken: a.timeTaken || 10 // Default fallback if no timer
    }));

    try {
      const res = await fetch("/api/quiz/attempt/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId, // Persistent ID
          quizId,    // Fallback/Redundant but safe
          userAnswers: answersArray
        })
      });

      const data = await res.json();
      setResult(data); // { score, review: [] }
    } catch (err) {
      console.error("Submit Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Render Loading
  if (isLoading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );

  // 5. Render Result
  if (result) return <QuizResult result={result} />;

  // 6. Render Quiz Active
  const question = questions[current];
  const userAns = answers[question?._id];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', py: 4 }}>
      <Container maxWidth="md">
        <QuizHeader quiz={quiz} />
        <QuestionCounter current={current} total={questions.length} />

        <Box sx={{ minHeight: '300px', py: 2 }}>
          <QuestionRenderer
            question={question}
            onAnswer={recordAnswer}
            value={userAns?.value}
          />
          {userAns && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Recorded: {String(userAns.value)}
            </Typography>
          )}
        </Box>

        <QuizNavigation
          current={current}
          total={questions.length}
          onNext={() => setCurrent(c => c + 1)}
          onPrev={() => setCurrent(c => c - 1)}
          onSubmit={submitQuiz}
          isSubmitting={isSubmitting}
        />
      </Container>
    </Box>
  );
}

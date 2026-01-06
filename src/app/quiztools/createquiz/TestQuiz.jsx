'use client';

import React, { useState } from 'react';
import { Box, Paper, Typography, Stack, Button, Snackbar, Alert } from '@mui/material';
import { QuizStore } from './quizdata';

export default function TestQuiz({ onClose }) {
  const questions = QuizStore.getAllQuestions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const currentQ = questions[currentIndex];

  const handleAnswerChange = (value) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: value }));
  };

  const nextQ = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const prevQ = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const finishQuiz = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined) {
        if (q.type === 'mcq' || q.type === 'fillup' || q.type === 'truefalse') {
          if (answers[idx].toString().toLowerCase() === q.answer.toString().toLowerCase()) score++;
        }
      }
    });
    setSnackbar({ open: true, message: `You scored ${score} / ${questions.length}`, severity: 'success' });
    onClose();
  };

  if (!currentQ) return null;

  return (
    <Box sx={{
      position: 'fixed',
      inset: 0,
      bgcolor: 'rgba(0,0,0,0.9)',
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      p: 2
    }}>
      <Paper sx={{ width: '100%', maxWidth: 800, p: 4, borderRadius: 3, bgcolor: '#fdfdfd' }}>
        <Typography variant="h4" fontWeight={900} color="#6C3483" mb={3} textAlign="center">
          Test Quiz
        </Typography>

        <Typography variant="h6" mb={2}>
          Question {currentIndex + 1} of {questions.length}
        </Typography>
        <Typography variant="h5" mb={3}>{currentQ.text}</Typography>

        {currentQ.type === 'mcq' && (
          <Stack spacing={2}>
            {currentQ.options.map((opt, idx) => (
              <Button
                key={idx}
                variant={answers[currentIndex] === opt ? 'contained' : 'outlined'}
                onClick={() => handleAnswerChange(opt)}
              >
                {opt}
              </Button>
            ))}
          </Stack>
        )}

        {currentQ.type === 'fillup' && (
          <input
            type="text"
            value={answers[currentIndex] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            style={{ width: '100%', padding: '8px', fontSize: '16px', marginBottom: '16px' }}
          />
        )}

        {currentQ.type === 'truefalse' && (
          <Stack direction="row" spacing={2}>
            {['true', 'false'].map(val => (
              <Button
                key={val}
                variant={answers[currentIndex]?.toString() === val ? 'contained' : 'outlined'}
                onClick={() => handleAnswerChange(val)}
              >
                {val}
              </Button>
            ))}
          </Stack>
        )}

        <Stack direction="row" spacing={2} mt={4} justifyContent="center">
          <Button variant="outlined" onClick={prevQ} disabled={currentIndex === 0}>Previous</Button>
          {currentIndex < questions.length - 1 ? (
            <Button variant="outlined" onClick={nextQ}>Next</Button>
          ) : (
            <Button variant="contained" color="success" onClick={finishQuiz}>Finish</Button>
          )}
          <Button variant="contained" color="error" onClick={onClose}>Close</Button>
        </Stack>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

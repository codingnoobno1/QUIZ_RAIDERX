'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import CreateQuizPage from './CreateQuizPage';
import { QuizStore } from './quizdata';
import TestQuiz from './TestQuiz';
import GeminiAPI from './geminiapi';

export default function QuizAdminPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [testing, setTesting] = useState(false);

  // Example user & processes (replace with actual data or fetch)
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProcesses, setCurrentProcesses] = useState([]);

  useEffect(() => {
    // Mock fetching user and processes
    setCurrentUser({ id: 'u1', role: 'Admin' });
    setCurrentProcesses([
      { id: 'p1', name: 'Process A' },
      { id: 'p2', name: 'Process B' }
    ]);
  }, []);

  // Add/remove/reset questions
  const addQuestion = (q) => setQuestions(prev => [...prev, ...q]);
  const removeQuestion = (idx) => setQuestions(prev => prev.filter((_, i) => i !== idx));
  const resetQuestions = () => setQuestions([]);

  // Submit all questions to backend
  const submitQuiz = async () => {
    if (questions.length === 0) {
      setSnackbar({ open: true, message: 'No questions to submit.', severity: 'warning' });
      return;
    }
    try {
      setLoading(true);
      questions.forEach(q => QuizStore.addQuestion(q));
      await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: QuizStore.getAllQuestions() })
      });
      setSnackbar({ open: true, message: '✅ Quiz submitted successfully!', severity: 'success' });
      resetQuestions();
      QuizStore.reset();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Failed to submit quiz', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Import questions from local JSON file
  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedQuestions = JSON.parse(e.target.result);
        if (!Array.isArray(importedQuestions)) {
          throw new Error('JSON must be an array of questions');
        }
        setQuestions(prev => [...prev, ...importedQuestions]);
        setSnackbar({ open: true, message: '✅ Questions imported successfully!', severity: 'success' });
      } catch (err) {
        console.error(err);
        setSnackbar({ open: true, message: 'Failed to import JSON', severity: 'error' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1400px', mx: 'auto' }}>
      <Typography variant="h3" fontWeight={900} mb={4} textAlign="center" color="#6C3483">
        Quiz Management Dashboard
      </Typography>

      {/* Two-column layout */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        
        {/* Left/Main Column */}
        <Box sx={{ flex: 3 }}>
          <Paper sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" mb={3} fontWeight={700}>Manual Question Entry</Typography>
            <CreateQuizPage
              questions={questions}
              addQuestion={addQuestion}
              removeQuestion={removeQuestion}
              resetQuestions={resetQuestions}
              saving={loading}
              snackbar={snackbar}
              setSnackbar={setSnackbar}
            />
          </Paper>

          {/* Actions */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={6}>
            <Button
              variant="contained"
              color="primary"
              onClick={submitQuiz}
              disabled={loading || questions.length === 0}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit Quiz'}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                if (questions.length === 0) {
                  setSnackbar({ open: true, message: 'No questions to test.', severity: 'warning' });
                  return;
                }
                QuizStore.reset();
                questions.forEach(q => QuizStore.addQuestion(q));
                setTesting(true);
              }}
            >
              Test Quiz
            </Button>

            <Button variant="outlined" color="error" onClick={resetQuestions} disabled={loading}>
              Clear All Questions
            </Button>

            <input
              type="file"
              accept=".json"
              id="import-json-input"
              style={{ display: 'none' }}
              onChange={handleImportJSON}
            />
            <Button
              variant="outlined"
              color="info"
              onClick={() => document.getElementById('import-json-input').click()}
              disabled={loading}
            >
              Import from JSON
            </Button>
          </Stack>
        </Box>

        {/* Right Sidebar / Gemini AI */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          {currentUser && currentProcesses.length > 0 && (
            <GeminiAPI
              user={currentUser}
              processes={currentProcesses}
              addQuestions={addQuestion}
              setSnackbar={setSnackbar}
            />
          )}
        </Box>
      </Box>

      {/* Test Quiz Modal */}
      {testing && <TestQuiz onClose={() => setTesting(false)} />}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

'use client';

import React, { useState } from 'react';
import { Box, Button, Paper, Stack, Typography, Snackbar, Alert, TextField } from '@mui/material';
import { QuizStore } from './quizdata'; // In-memory store
import CreateQuizPage from './CreateQuizPage';
import { generateGeminiQuiz } from './geminiapi'; // Gemini API function

export default function QuizSubmit({ onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ----- 1️⃣ Add question from CreateQuizPage -----
  const addQuestion = (q) => setQuestions(prev => [...prev, q]);

  const removeQuestion = (idx) => setQuestions(prev => prev.filter((_, i) => i !== idx));
  const resetQuestions = () => setQuestions([]);

  // ----- 2️⃣ Submit quiz (manual / memory) -----
  const submitQuiz = async () => {
    try {
      setLoading(true);
      // Save to QuizStore
      questions.forEach(q => QuizStore.addQuestion(q));
      // Send to backend API
      await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: QuizStore.getAllQuestions() })
      });
      setSnackbar({ open: true, message: '✅ Quiz submitted!', severity: 'success' });
      resetQuestions();
      QuizStore.reset();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to submit quiz', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ----- 3️⃣ Gemini Quiz Generator -----
  const generateGemini = async (topic) => {
    try {
      setLoading(true);
      const autoQuestions = await generateGeminiQuiz(topic); // Returns array of question objects
      setQuestions(prev => [...prev, ...autoQuestions]);
      setSnackbar({ open: true, message: '✅ Gemini questions added!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Gemini generation failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ----- 4️⃣ JSON Upload -----
  const handleJSONUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedQuestions = JSON.parse(event.target.result);
        setQuestions(prev => [...prev, ...importedQuestions]);
        setSnackbar({ open: true, message: '✅ Questions imported from JSON', severity: 'success' });
      } catch (err) {
        setSnackbar({ open: true, message: 'Invalid JSON file', severity: 'error' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" mb={3}>Quiz Submission Admin</Typography>

      {/* ----- Manual Entry ----- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>1️⃣ Manual Entry</Typography>
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

      {/* ----- Gemini Generator ----- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>2️⃣ Gemini Quiz Generator</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField label="Topic" id="gemini-topic" />
          <Button
            variant="contained"
            onClick={() => {
              const topic = document.getElementById('gemini-topic').value;
              if (topic) generateGemini(topic);
            }}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </Stack>
      </Paper>

      {/* ----- JSON Upload ----- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>3️⃣ Import from JSON</Typography>
        <Button
          variant="outlined"
          component="label"
        >
          Upload JSON
          <input type="file" hidden accept=".json" onChange={handleJSONUpload} />
        </Button>
      </Paper>

      {/* ----- Submit Quiz ----- */}
      <Stack direction="row" spacing={2}>
        <Button variant="contained" color="primary" onClick={submitQuiz} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Quiz'}
        </Button>
        <Button variant="outlined" onClick={onBack}>Back</Button>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

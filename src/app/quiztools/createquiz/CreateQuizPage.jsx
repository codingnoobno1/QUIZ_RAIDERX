'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, MenuItem, TextField,
  Stack, Button, Snackbar, CircularProgress,
  IconButton, Fab, Alert
} from '@mui/material';
import { ArrowUpward, Delete } from '@mui/icons-material';

// Question type options
export const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'fillup', label: 'Fill in the Blank' },
  { value: 'truefalse', label: 'True / False' },
];

// ---------------- Question Components ----------------
function MCQQuestion({ question, setQuestion }) {
  const handleTextChange = (e) => setQuestion({ ...question, text: e.target.value });
  const handleOptionChange = (idx, value) => {
    const newOptions = [...question.options];
    newOptions[idx] = value;
    setQuestion({ ...question, options: newOptions });
  };
  const handleAnswerChange = (e) => setQuestion({ ...question, answer: e.target.value });

  const addOption = () => setQuestion({ ...question, options: [...question.options, ''] });
  const removeOption = (idx) => {
    const newOptions = question.options.filter((_, i) => i !== idx);
    setQuestion({ ...question, options: newOptions });
  };

  return (
    <Stack spacing={2}>
      <TextField label="Question" value={question.text} onChange={handleTextChange} fullWidth />
      <Typography variant="subtitle1">Options:</Typography>
      {question.options.map((opt, idx) => (
        <Stack key={idx} direction="row" spacing={1} alignItems="center">
          <TextField
            label={`Option ${idx + 1}`}
            value={opt}
            onChange={(e) => handleOptionChange(idx, e.target.value)}
            fullWidth
          />
          {question.options.length > 2 && (
            <IconButton color="error" onClick={() => removeOption(idx)}><Delete /></IconButton>
          )}
        </Stack>
      ))}
      <Button onClick={addOption} size="small">Add Option</Button>
      <TextField
        label="Answer"
        value={question.answer}
        onChange={handleAnswerChange}
        fullWidth
      />
    </Stack>
  );
}

function FillupQuestion({ question, setQuestion }) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Question"
        value={question.text}
        onChange={(e) => setQuestion({ ...question, text: e.target.value })}
        fullWidth
      />
      <TextField
        label="Answer"
        value={question.answer}
        onChange={(e) => setQuestion({ ...question, answer: e.target.value })}
        fullWidth
      />
    </Stack>
  );
}

function TrueFalseQuestion({ question, setQuestion }) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Question"
        value={question.text}
        onChange={(e) => setQuestion({ ...question, text: e.target.value })}
        fullWidth
      />
      <TextField
        select
        label="Answer"
        value={question.answer ? 'true' : 'false'}
        onChange={(e) => setQuestion({ ...question, answer: e.target.value === 'true' })}
        fullWidth
      >
        <MenuItem value="true">True</MenuItem>
        <MenuItem value="false">False</MenuItem>
      </TextField>
    </Stack>
  );
}

// ---------------- Default Question Values ----------------
const COMPONENTS = {
  mcq: MCQQuestion,
  fillup: FillupQuestion,
  truefalse: TrueFalseQuestion,
};

const DEFAULT_QUESTION = {
  mcq: { text: '', options: ['', ''], answer: '' },
  fillup: { text: '', answer: '' },
  truefalse: { text: '', answer: true },
};

// ---------------- CreateQuizPage Component ----------------
export default function CreateQuizPage({
  addQuestion,
  removeQuestion,
  resetQuestions,
  questions = [],
  saving = false,
  snackbar = { open: false, message: '', severity: 'success' },
  setSnackbar = () => {},
  quizType
}) {
  const [questionType, setQuestionType] = useState(
    quizType ? quizType.toLowerCase().replace(/\s/g, '') : 'mcq'
  );
  const [question, setQuestion] = useState(DEFAULT_QUESTION[questionType]);

  useEffect(() => {
    setQuestion(DEFAULT_QUESTION[questionType]);
  }, [questionType]);

  const handleTypeChange = (e) => setQuestionType(e.target.value);

  const handleSaveQuestion = () => {
    if (!question.text && questionType !== 'truefalse') {
      setSnackbar({ open: true, message: 'Please fill in the question.', severity: 'warning' });
      return;
    }
    addQuestion({
      ...question,
      type: questionType,
      createdAt: new Date().toISOString(),
    });
    setSnackbar({ open: true, message: '✅ Question added!', severity: 'success' });
    setQuestion(DEFAULT_QUESTION[questionType]);
  };

  const QuestionComponent = COMPONENTS[questionType];
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <Box sx={{ width: '100%', overflowY: 'auto' }}>
      {/* Question Builder */}
      <Paper elevation={6} sx={{ p: 4, borderRadius: 4, mb: 6, bgcolor: 'rgba(255,255,255,0.97)' }}>
        <Typography variant="h4" fontWeight={900} color="#6C3483" mb={3} textAlign="center">
          Create a Quiz Question
        </Typography>

        <Stack spacing={3}>
          <TextField select label="Question Type" value={questionType} onChange={handleTypeChange} fullWidth>
            {QUESTION_TYPES.map(qt => (
              <MenuItem key={qt.value} value={qt.value}>{qt.label}</MenuItem>
            ))}
          </TextField>

          {QuestionComponent ? (
            <QuestionComponent question={question} setQuestion={setQuestion} />
          ) : (
            <Alert severity="error">Invalid question type.</Alert>
          )}

          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={handleSaveQuestion}
            disabled={saving}
            sx={{ fontWeight: 700 }}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Add Question'}
          </Button>
        </Stack>
      </Paper>

      {/* Questions List */}
      {questions.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 6, bgcolor: '#f9f9fb' }}>
          <Typography variant="h5" fontWeight={800} mb={2}>Questions in Quiz</Typography>
          <ol>
            {questions.map((q, idx) => (
              <li key={idx}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body1">{q.text || 'Untitled'} <span style={{ color: '#888' }}>({q.type})</span></Typography>
                  <IconButton color="error" onClick={() => removeQuestion(idx)}><Delete /></IconButton>
                </Stack>
              </li>
            ))}
          </ol>
          <Stack direction="row" spacing={2} mt={2}>
            <Button variant="outlined" color="error" onClick={resetQuestions}>Clear All</Button>
          </Stack>
        </Paper>
      )}

      {/* Scroll to Top */}
      <Fab onClick={scrollToTop} color="primary" size="medium" sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1500 }}>
        <ArrowUpward />
      </Fab>

      {/* Snackbar */}
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

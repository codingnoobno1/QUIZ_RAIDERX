'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, MenuItem, TextField,
  Stack, Button, Snackbar, Alert, CircularProgress, Grid, IconButton, Fab
} from '@mui/material';
import { ArrowUpward, Delete } from '@mui/icons-material';

import { QUESTION_TYPES } from './QuestionTypes';

import MCQQuestion from './MCQQuestion';
import FillupQuestion from './FillupQuestion';
import TrueFalseQuestion from './TrueFalseQuestion';
import MatchupQuestion from './MatchupQuestion';
import ShortAnswerQuestion from './ShortAnswerQuestion';
import LongAnswerQuestion from './LongAnswerQuestion';
import OrderingQuestion from './OrderingQuestion';
import DiagramQuestion from './DiagramQuestion';
import AssertionReasonQuestion from './AssertionReasonQuestion';
import ComprehensionQuestion from './ComprehensionQuestion';

const COMPONENTS = {
  mcq: MCQQuestion,
  fillup: FillupQuestion,
  truefalse: TrueFalseQuestion,
  matchup: MatchupQuestion,
  shortanswer: ShortAnswerQuestion,
  longanswer: LongAnswerQuestion,
  ordering: OrderingQuestion,
  diagram: DiagramQuestion,
  assertionreason: AssertionReasonQuestion,
  comprehension: ComprehensionQuestion,
};

const DEFAULT_QUESTION = {
  mcq: { text: '', options: ['', ''], answer: '' },
  fillup: { text: '', answer: '' },
  truefalse: { text: '', answer: true },
  matchup: { text: '', pairs: [{ left: '', right: '' }] },
  shortanswer: { text: '', answer: '' },
  longanswer: { text: '', answer: '' },
  ordering: { text: '', items: [''] },
  diagram: { text: '', answer: '' },
  assertionreason: { assertion: '', reason: '', answer: '' },
  comprehension: { text: '', subQuestions: [''] },
};

export default function CreateQuizPage(props) {
  const {
    batch, subject, batchIdx, quizType, semester,
    section, room, facultyId, onBack,
    addQuestion, saveQuiz, questions = [], saving = false,
    snackbar = { open: false, message: '', severity: 'success' },
    setSnackbar = () => {},
    removeQuestion,
    resetQuestions
  } = props;

  const [questionType, setQuestionType] = useState(
    quizType ? quizType.toLowerCase().replace(/\s/g, '') : 'mcq'
  );
  const [question, setQuestion] = useState(DEFAULT_QUESTION[questionType]);

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setQuestionType(type);
    setQuestion(DEFAULT_QUESTION[type]);
  };

  const handleSave = () => {
    if (!question.text && !question.assertion) {
      setSnackbar({ open: true, message: 'Please fill in the question.', severity: 'warning' });
      return;
    }
    const fullQuestion = {
      ...question,
      type: questionType,
      createdAt: new Date().toISOString(),
    };
    addQuestion(fullQuestion);
    setSnackbar({
      open: true,
      message: '✅ Question added to quiz!',
      severity: 'success',
    });
    setQuestion(DEFAULT_QUESTION[questionType]);
  };

  const QuestionComponent = COMPONENTS[questionType] || null;

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflowY: 'auto',
        bgcolor: 'background.default',
        backgroundImage:
          'url(https://png.pngtree.com/thumb_back/fh260/background/20211023/pngtree-aesthetic-plain-background-with-pastel-colors-image_913186.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: { xs: 2, md: 4 },
      }}
    >
      {/* Sticky Info Header */}
      <Paper
        elevation={4}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1200,
          px: 4,
          py: 2,
          mb: 3,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(5px)',
        }}
      >
        {(batch && subject) ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography fontWeight={700} color="primary.main">Batch:</Typography>
              <Typography>{batch.batch || batch.course || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography fontWeight={700} color="primary.main">Subject:</Typography>
              <Typography>{subject}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography fontWeight={700} color="primary.main">Quiz Type:</Typography>
              <Typography>{quizType || questionType}</Typography>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="warning">⚠️ Batch, Subject, or Quiz not selected properly.</Alert>
        )}
        <Button
          variant="outlined"
          color="primary"
          sx={{ mt: 2 }}
          onClick={onBack}
        >
          ← Back to Quiz Grid
        </Button>
      </Paper>

      {/* Question Builder */}
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 4,
          minWidth: 350,
          maxWidth: 800,
          mx: 'auto',
          mb: 6,
          bgcolor: 'rgba(255,255,255,0.97)',
        }}
      >
        <Typography variant="h4" fontWeight={900} color="#6C3483" mb={3} textAlign="center">
          Create a Quiz Question
        </Typography>

        <Stack spacing={3}>
          <TextField
            select
            label="Question Type"
            value={questionType}
            onChange={handleTypeChange}
            fullWidth
          >
            {QUESTION_TYPES.map((qt) => (
              <MenuItem key={qt.value} value={qt.value}>{qt.label}</MenuItem>
            ))}
          </TextField>

          {QuestionComponent ? (
            <QuestionComponent question={question} setQuestion={setQuestion} />
          ) : (
            <Alert severity="error">Invalid question type selected.</Alert>
          )}

          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={handleSave}
            disabled={saving}
            sx={{ fontWeight: 700 }}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Add Question to Quiz'}
          </Button>
        </Stack>
      </Paper>

      {/* Current Questions */}
      {questions.length > 0 && (
        <Paper elevation={3} sx={{ maxWidth: 800, mx: 'auto', p: 3, mb: 8, bgcolor: '#f9f9fb' }}>
          <Typography variant="h5" fontWeight={800} mb={2}>Questions in this Quiz</Typography>
          <ol>
            {questions.map((q, idx) => (
              <li key={idx}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body1">
                    {q.text || q.assertion || 'Untitled'} <span style={{ color: '#888' }}>({q.type})</span>
                  </Typography>
                  <IconButton color="error" onClick={() => removeQuestion(idx)}>
                    <Delete />
                  </IconButton>
                </Box>
              </li>
            ))}
          </ol>

          <Stack direction="row" spacing={2} mt={2}>
            <Button variant="contained" color="primary" onClick={saveQuiz} disabled={saving}>
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Quiz'}
            </Button>
            <Button variant="outlined" color="error" onClick={resetQuestions}>
              Clear All
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Scroll to top FAB */}
      <Fab
        onClick={scrollToTop}
        color="primary"
        size="medium"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1500,
        }}
      >
        <ArrowUpward />
      </Fab>

      {/* Snackbar Notification */}
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

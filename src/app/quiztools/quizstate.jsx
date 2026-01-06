// quizstate.jsx
'use client';

import React, { useState } from 'react';
import CreateQuizPage from './createquiz/page';
import axios from 'axios';
import { Box } from '@mui/material';

export default function QuizState(props) {
  const {
    batch, subject, batchIdx, quizType, semester,
    section, room, facultyId, onBack
  } = props;

  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const addQuestion = (question) => {
    setQuestions((prev) => [...prev, question]);
  };

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetQuestions = () => setQuestions([]);

  const saveQuiz = async () => {
    setSaving(true);
    try {
      await axios.post('/api/createquiz', {
        batch,
        subject,
        batchIdx,
        quizType,
        semester,
        section,
        room,
        facultyId,
        questions,
      });
      setSnackbar({ open: true, message: 'Quiz saved successfully!', severity: 'success' });
      setQuestions([]);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save quiz', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflowY: 'auto',
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.default',
      }}
    >
      <CreateQuizPage
        batch={batch}
        subject={subject}
        batchIdx={batchIdx}
        quizType={quizType}
        semester={semester}
        section={section}
        room={room}
        facultyId={facultyId}
        onBack={onBack}
        addQuestion={addQuestion}
        saveQuiz={saveQuiz}
        questions={questions}
        saving={saving}
        snackbar={snackbar}
        setSnackbar={setSnackbar}
        removeQuestion={removeQuestion}
        resetQuestions={resetQuestions}
      />
    </Box>
  );
}

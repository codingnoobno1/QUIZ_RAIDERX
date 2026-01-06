"use client";
import React from 'react';
import { Box, TextField } from '@mui/material';

export default function LongAnswerQuestion({ question, setQuestion }) {
  return (
    <Box>
      <TextField
        label="Question"
        fullWidth
        value={question.text}
        onChange={e => setQuestion({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Sample Answer (optional)"
        fullWidth
        multiline
        minRows={3}
        value={question.answer}
        onChange={e => setQuestion({ ...question, answer: e.target.value })}
      />
    </Box>
  );
}

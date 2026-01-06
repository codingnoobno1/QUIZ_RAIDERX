"use client";
import React from 'react';
import { Box, TextField } from '@mui/material';

export default function AssertionReasonQuestion({ question, setQuestion }) {
  return (
    <Box>
      <TextField
        label="Assertion Statement"
        fullWidth
        value={question.assertion}
        onChange={e => setQuestion({ ...question, assertion: e.target.value })}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Reason Statement"
        fullWidth
        value={question.reason}
        onChange={e => setQuestion({ ...question, reason: e.target.value })}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Correct Answer (Assertion/Reason/Both/Neither)"
        fullWidth
        value={question.answer}
        onChange={e => setQuestion({ ...question, answer: e.target.value })}
      />
    </Box>
  );
}

"use client";
import React from 'react';
import { Box, TextField, Typography, Stack, IconButton, Button } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

export default function ComprehensionQuestion({ question, setQuestion }) {
  const handleQChange = (idx, value) => {
    const newQs = [...question.subQuestions];
    newQs[idx] = value;
    setQuestion({ ...question, subQuestions: newQs });
  };
  const addQ = () => setQuestion({ ...question, subQuestions: [...question.subQuestions, ''] });
  const removeQ = (idx) => setQuestion({ ...question, subQuestions: question.subQuestions.filter((_, i) => i !== idx) });

  return (
    <Box>
      <TextField
        label="Passage/Comprehension Text"
        fullWidth
        multiline
        minRows={3}
        value={question.text}
        onChange={e => setQuestion({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />
      <Typography fontWeight={600} mb={1}>Sub-Questions</Typography>
      <Stack spacing={1}>
        {question.subQuestions.map((q, idx) => (
          <Box key={idx} display="flex" gap={1} alignItems="center">
            <TextField
              fullWidth
              label={`Sub-Question ${idx + 1}`}
              value={q}
              onChange={e => handleQChange(idx, e.target.value)}
            />
            <IconButton color="error" onClick={() => removeQ(idx)}><Delete /></IconButton>
          </Box>
        ))}
      </Stack>
      <Button onClick={addQ} startIcon={<Add />} sx={{ mt: 1 }}>Add Sub-Question</Button>
    </Box>
  );
}

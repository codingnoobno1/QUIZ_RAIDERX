"use client";
import React from 'react';
import { Box, TextField, Typography, IconButton, Button, Stack } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

export default function MCQQuestion({ question, setQuestion }) {
  const handleOptionChange = (idx, value) => {
    const newOptions = [...question.options];
    newOptions[idx] = value;
    setQuestion({ ...question, options: newOptions });
  };
  const addOption = () => setQuestion({ ...question, options: [...question.options, ''] });
  const removeOption = (idx) => setQuestion({ ...question, options: question.options.filter((_, i) => i !== idx) });

  return (
    <Box>
      <TextField
        label="Question"
        fullWidth
        value={question.text}
        onChange={e => setQuestion({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />
      <Typography fontWeight={600} mb={1}>Options</Typography>
      <Stack spacing={1}>
        {question.options.map((opt, idx) => (
          <Box key={idx} display="flex" gap={1} alignItems="center">
            <TextField
              fullWidth
              label={`Option ${idx + 1}`}
              value={opt}
              onChange={e => handleOptionChange(idx, e.target.value)}
            />
            <IconButton color="error" onClick={() => removeOption(idx)}><Delete /></IconButton>
          </Box>
        ))}
      </Stack>
      <Button onClick={addOption} startIcon={<Add />} sx={{ mt: 1 }}>Add Option</Button>
      <TextField
        label="Correct Option (number)"
        type="number"
        value={question.answer}
        onChange={e => setQuestion({ ...question, answer: e.target.value })}
        sx={{ mt: 2 }}
        fullWidth
      />
    </Box>
  );
}

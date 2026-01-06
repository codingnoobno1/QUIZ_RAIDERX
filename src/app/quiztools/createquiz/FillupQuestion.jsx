import React from 'react';
import { Box, TextField } from '@mui/material';

export default function FillupQuestion({ question, setQuestion }) {
  return (
    <Box>
      <TextField
        label="Question (use ___ for blank)"
        fullWidth
        value={question.text}
        onChange={e => setQuestion({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Correct Answer"
        fullWidth
        value={question.answer}
        onChange={e => setQuestion({ ...question, answer: e.target.value })}
      />
    </Box>
  );
}

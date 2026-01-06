import React from 'react';
import { Box, TextField } from '@mui/material';

export default function DiagramQuestion({ question, setQuestion }) {
  return (
    <Box>
      <TextField
        label="Question (Describe the diagram or labeling task)"
        fullWidth
        value={question.text}
        onChange={e => setQuestion({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Expected Labels/Description"
        fullWidth
        value={question.answer}
        onChange={e => setQuestion({ ...question, answer: e.target.value })}
      />
    </Box>
  );
}

import React from 'react';
import { Box, TextField, Typography, Stack, IconButton, Button } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

export default function MatchupQuestion({ question, setQuestion }) {
  const handlePairChange = (idx, field, value) => {
    const newPairs = [...question.pairs];
    newPairs[idx][field] = value;
    setQuestion({ ...question, pairs: newPairs });
  };
  const addPair = () => setQuestion({ ...question, pairs: [...question.pairs, { left: '', right: '' }] });
  const removePair = (idx) => setQuestion({ ...question, pairs: question.pairs.filter((_, i) => i !== idx) });

  return (
    <Box>
      <TextField
        label="Question"
        fullWidth
        value={question.text}
        onChange={e => setQuestion({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />
      <Typography fontWeight={600} mb={1}>Pairs</Typography>
      <Stack spacing={1}>
        {question.pairs.map((pair, idx) => (
          <Box key={idx} display="flex" gap={1} alignItems="center">
            <TextField
              label="Left"
              value={pair.left}
              onChange={e => handlePairChange(idx, 'left', e.target.value)}
            />
            <TextField
              label="Right"
              value={pair.right}
              onChange={e => handlePairChange(idx, 'right', e.target.value)}
            />
            <IconButton color="error" onClick={() => removePair(idx)}><Delete /></IconButton>
          </Box>
        ))}
      </Stack>
      <Button onClick={addPair} startIcon={<Add />} sx={{ mt: 1 }}>Add Pair</Button>
    </Box>
  );
}

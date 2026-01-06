import React from 'react';
import { Box, TextField, Typography, Stack, IconButton, Button } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

export default function OrderingQuestion({ question, setQuestion }) {
  const handleItemChange = (idx, value) => {
    const newItems = [...question.items];
    newItems[idx] = value;
    setQuestion({ ...question, items: newItems });
  };
  const addItem = () => setQuestion({ ...question, items: [...question.items, ''] });
  const removeItem = (idx) => setQuestion({ ...question, items: question.items.filter((_, i) => i !== idx) });

  return (
    <Box>
      <TextField
        label="Question (Ordering/Sequence)"
        fullWidth
        value={question.text}
        onChange={e => setQuestion({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />
      <Typography fontWeight={600} mb={1}>Items (in correct order)</Typography>
      <Stack spacing={1}>
        {question.items.map((item, idx) => (
          <Box key={idx} display="flex" gap={1} alignItems="center">
            <TextField
              fullWidth
              label={`Item ${idx + 1}`}
              value={item}
              onChange={e => handleItemChange(idx, e.target.value)}
            />
            <IconButton color="error" onClick={() => removeItem(idx)}><Delete /></IconButton>
          </Box>
        ))}
      </Stack>
      <Button onClick={addItem} startIcon={<Add />} sx={{ mt: 1 }}>Add Item</Button>
    </Box>
  );
}

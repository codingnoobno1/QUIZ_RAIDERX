import React from 'react';
import { Box, TextField, Typography, FormControl, RadioGroup, FormControlLabel, Radio, Stack } from '@mui/material';

export default function MCQQuestion({ question, setQuestion }) {
  // Update question text
  const handleQuestionText = (text) => setQuestion({ ...question, text });

  // Update option text
  const handleOptionChange = (idx, value) => {
    const newOptions = [...question.options];
    newOptions[idx] = value;
    setQuestion({ ...question, options: newOptions });
  };

  // Set correct option index
  const handleCorrectOption = (value) => setQuestion({ ...question, answer: value });

  // Set time limit
  const handleTimeChange = (value) => setQuestion({ ...question, time: value });

  // Set reward points
  const handleRewardChange = (value) => setQuestion({ ...question, reward: value });

  return (
    <Box>
      {/* Question Text */}
      <TextField
        label="Question"
        fullWidth
        value={question.text}
        onChange={e => handleQuestionText(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Options */}
      <Typography fontWeight={600} mb={1}>Options</Typography>
      <Stack spacing={1}>
        {[0, 1, 2, 3].map(idx => (
          <TextField
            key={idx}
            fullWidth
            label={`Option ${idx + 1}`}
            value={question.options[idx] || ''}
            onChange={e => handleOptionChange(idx, e.target.value)}
          />
        ))}
      </Stack>

      {/* Correct Option */}
      <FormControl sx={{ mt: 2 }}>
        <Typography fontWeight={600} mb={1}>Correct Option</Typography>
        <RadioGroup
          value={question.answer}
          onChange={e => handleCorrectOption(Number(e.target.value))}
          row
        >
          {[0, 1, 2, 3].map(idx => (
            <FormControlLabel
              key={idx}
              value={idx}
              control={<Radio />}
              label={`Option ${idx + 1}`}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {/* Time Limit */}
      <TextField
        label="Time (seconds)"
        type="number"
        value={question.time || ''}
        onChange={e => handleTimeChange(Number(e.target.value))}
        fullWidth
        sx={{ mt: 2 }}
      />

      {/* Reward Points */}
      <TextField
        label="Reward Points"
        type="number"
        value={question.reward || ''}
        onChange={e => handleRewardChange(Number(e.target.value))}
        fullWidth
        sx={{ mt: 2 }}
      />
    </Box>
  );
}

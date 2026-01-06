'use client';

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
} from '@mui/material';

export default function QuestionCard({
  question = '🔍 Problem: Reverse a String',
  description,
  remainingTime,
}) {
  const fallbackDescription = `Write a function that takes a string and returns the string reversed.

Example:
Input: "hello"
Output: "olleh"`;

  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={600}>
          {question}
        </Typography>

        {remainingTime !== undefined && (
          <Chip
            label={`⏳ ${formatTime(remainingTime)}`}
            size="small"
            sx={{ fontWeight: 500, fontSize: '0.75rem', bgcolor: '#f0f0f0' }}
          />
        )}
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ whiteSpace: 'pre-line', mt: 2, fontFamily: 'monospace' }}
      >
        {description ?? fallbackDescription}
      </Typography>
    </Paper>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

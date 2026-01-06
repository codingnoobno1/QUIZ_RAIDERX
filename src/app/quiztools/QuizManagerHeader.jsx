import React from 'react';
import { Typography } from '@mui/material';

export default function QuizManagerHeader() {
  return (
    <Typography
      variant="h3"
      textAlign="center"
      mb={4}
      fontWeight={900}
      sx={{
        color: '#6C3483',
        textShadow: '2px 2px 8px #fff, 0 0 10px #F9E79F',
        letterSpacing: 2,
      }}
    >
      Quiz Manager
    </Typography>
  );
}

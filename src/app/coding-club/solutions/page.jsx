'use client';

import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function SolutionsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Coding Solutions
      </Typography>
      <Typography variant="body1">
        This page will display coding solutions.
      </Typography>
    </Box>
  );
}

import React from 'react';
import { Typography, Box } from '@mui/material';

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

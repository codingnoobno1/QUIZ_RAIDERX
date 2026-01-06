import React from 'react';
import { Typography, Box } from '@mui/material';

export default function FacultyPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Faculty
      </Typography>
      <Typography variant="body1">
        This page will display faculty information.
      </Typography>
    </Box>
  );
}

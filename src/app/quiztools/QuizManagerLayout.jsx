import React from 'react';
import { Box } from '@mui/material';

export default function QuizManagerLayout({ children }) {
  return (
    <Box
      maxWidth="md"
      mx="auto"
      py={4}
      minHeight="100vh"
      sx={{
        backgroundImage:
          'url(https://png.pngtree.com/thumb_back/fh260/background/20211023/pngtree-aesthetic-plain-background-with-pastel-colors-image_913186.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 6,
        boxShadow: 6,
        p: { xs: 2, md: 6 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {children}
    </Box>
  );
}

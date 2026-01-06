'use client';

import { Box, Typography, Container } from '@mui/material';
import EventCard from './EventCard';

export default function EventQuizSection() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        py: 6,
        px: 2,
        minHeight: '100vh',
        background: `radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          boxShadow: 'inset 0 0 150px rgba(255, 0, 0, 0.15)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          zIndex: 1,
        }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{
            color: '#f5f5f5',
            fontWeight: 'bold',
            fontFamily: `'Cinzel', serif`,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            borderBottom: '2px solid rgba(255, 0, 0, 0.4)',
            pb: 1,
          }}
        >
          Event Quizzes
        </Typography>

        <EventCard eventName="Cyber Security Challenge" />
      </Container>
    </Box>
  );
}

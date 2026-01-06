'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [timeLeft, setTimeLeft] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (status !== 'authenticated' || !session?.expires) return;

    const expiryTime = new Date(session.expires).getTime();

    const updateTimeLeft = () => {
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeLeft(diffSeconds);
      if (diffSeconds <= 0) {
        signOut({ callbackUrl: '/login' });
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [status, session?.expires]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#000',
        }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  const userInfo = session?.user;

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3, md: 6 },
        py: { xs: 2, sm: 3, md: 4 },
        width: '100%',
        maxWidth: '100%',
        minHeight: '100vh',
        bgcolor: '#000',
        color: '#fff',
      }}
    >
      <Typography
        variant={isMobile ? 'h4' : 'h3'}
        fontWeight="bold"
        textAlign="center"
        sx={{
          color: '#00FFCC',
          textShadow: '0 0 10px #00FFCC, 0 0 20px #00FFCC',
          mb: { xs: 1.5, sm: 2.5 },
        }}
      >
        Welcome, {userInfo?.name ?? 'Guest'}!
      </Typography>

      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        textAlign="center"
        sx={{
          color: '#66CCFF',
          mb: { xs: 2, sm: 3 },
        }}
      >
        You’ve entered the PIXEL Club’s QUIZ RAIDER X dashboard.
      </Typography>

      {userInfo && (
        <Paper
          elevation={4}
          sx={{
            backgroundColor: '#111',
            color: '#fff',
            border: '1px solid #444',
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            width: '100%',
            maxWidth: 600,
            mx: 'auto',
            boxShadow: '0 0 15px rgba(0,255,200,0.3)',
          }}
        >
          <Typography fontSize={isMobile ? '0.95rem' : '1rem'}>
            <strong>Name:</strong> {userInfo.name}
          </Typography>
          <Typography fontSize={isMobile ? '0.95rem' : '1rem'}>
            <strong>Enrollment Number:</strong> {userInfo.enrollmentNumber}
          </Typography>
          <Typography fontSize={isMobile ? '0.95rem' : '1rem'}>
            <strong>Course:</strong> {userInfo.course}
          </Typography>
          <Typography fontSize={isMobile ? '0.95rem' : '1rem'}>
            <strong>Semester:</strong> {userInfo.semester}
          </Typography>
        </Paper>
      )}

      <Typography
        variant="body1"
        sx={{
          mt: { xs: 2.5, sm: 3 },
          textAlign: 'center',
          color: '#FF6666',
          fontSize: isMobile ? '0.9rem' : '1rem',
        }}
      >
        Session expires in: <strong>{formatTime(timeLeft)}</strong>
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          color="error"
          onClick={() => signOut({ callbackUrl: '/login' })}
          startIcon={<LogoutIcon />}
          sx={{
            boxShadow: '0 0 10px #FF4444',
            px: { xs: 2.5, sm: 3 },
            py: { xs: 1, sm: 1.25 },
            fontSize: isMobile ? '0.85rem' : '1rem',
            textTransform: 'none',
          }}
          aria-label="Logout"
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}

function formatTime(seconds) {
  if (!seconds || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { Book, Code, Calendar, Award } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (session?.user?.uuid) {
        try {
          // Replace with your actual API endpoint to fetch user stats
          // const res = await fetch(`/api/user/${session.user.uuid}/stats`);
          // const data = await res.json();
          // setStats(data);

          // Using mock stats for now
          setStats({
            quizzes: 12,
            projects: 5,
            events: 3,
            rank: 'Gold',
          });
        } catch (err) {
          setError('Failed to load dashboard stats.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (status === 'authenticated') {
      fetchStats();
    } else if (status === 'unauthenticated') {
      // Handle unauthenticated state, e.g., redirect to login
      window.location.href = '/Login';
    }
  }, [session, status]);

  if (status === 'loading' || isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!session?.user || !stats) {
    return <Typography>No user data or stats found.</Typography>;
  }

  const { user } = session;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #1e3a5a 0%, #2a4a7a 100%)',
          color: 'white',
        }}
      >
        <Grid container alignItems="center" spacing={3}>
          <Grid item>
            <Avatar src={user.image} sx={{ width: 80, height: 80, border: '2px solid #fff' }} />
          </Grid>
          <Grid item>
            <Typography variant="h4" fontWeight="bold">{user.name}</Typography>
            <Typography variant="subtitle1">{user.enrollmentNumber}</Typography>
            <Typography variant="subtitle2">{user.course}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Book size={32} />}
            label="Quizzes Taken"
            value={stats.quizzes}
            color="#3f51b5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Code size={32} />}
            label="Projects Submitted"
            value={stats.projects}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Calendar size={32} />}
            label="Events Attended"
            value={stats.events}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Award size={32} />}
            label="Rank"
            value={stats.rank}
            color="#d32f2f"
          />
        </Grid>
      </Grid>

      {/* Placeholder for recent activity or other sections */}
      <Box mt={5}>
        <Typography variant="h5" fontWeight="bold" mb={2}>Recent Activity</Typography>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Typography>No recent activity to display.</Typography>
        </Paper>
      </Box>
    </Box>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: '100%',
        background: '#2a2a2a',
        color: 'white',
        borderLeft: `5px solid ${color}`,
      }}
    >
      <Box sx={{ color }}>{icon}</Box>
      <Box>
        <Typography variant="h6" fontWeight="bold">{value}</Typography>
        <Typography variant="body2" color="#aaa">{label}</Typography>
      </Box>
    </Paper>
  );
}

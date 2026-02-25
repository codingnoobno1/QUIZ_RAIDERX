'use client';

import { Box, Typography, CircularProgress, Alert, Grid, Container, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EventCard from '@/components/ui/EventCard';
import LoginIcon from '@mui/icons-material/Login';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    // TODO: Implement logic to show event details, navigate to event page, etc.
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading events...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">No events found.</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Upcoming Events
        </Typography>
        <Button
          variant="contained"
          startIcon={<LoginIcon />}
          onClick={() => router.push('/event')}
          sx={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            borderRadius: '10px',
            fontWeight: 600,
            px: 2.5,
            boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6d28d9, #9333ea)',
              boxShadow: '0 6px 20px rgba(124,58,237,0.5)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Event Login
        </Button>
      </Box>
      <Grid container spacing={4}>
        {events.map((event) => (
          <Grid item key={event._id} xs={12} sm={6} md={4}>
            <EventCard event={event} onClick={handleEventClick} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

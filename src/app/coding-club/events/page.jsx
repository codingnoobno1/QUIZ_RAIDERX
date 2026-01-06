'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  CardMedia,
} from '@mui/material';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>Upcoming Events</Typography>

      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid item xs={12} md={6} lg={4} key={event._id}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                background: '#2a2a2a',
                color: 'white',
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image={event.imageUrl || 'https://via.placeholder.com/300x140'}
                alt={event.title}
              />
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={1}>{event.title}</Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#aaa' }}>
                  <Calendar size={16} />
                  <Typography variant="body2">{new Date(event.date).toLocaleDateString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#aaa' }}>
                  <Clock size={16} />
                  <Typography variant="body2">{event.time}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#aaa' }}>
                  <MapPin size={16} />
                  <Typography variant="body2">{event.location}</Typography>
                </Box>

                <Typography variant="body2" mb={2}>{event.description}</Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {event.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" sx={{ background: '#444', color: 'white' }} />
                  ))}
                </Box>
              </CardContent>

              <CardActions sx={{ mt: 'auto', p: 2 }}>
                <Button variant="contained" color="primary" fullWidth>Register</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
// app/coding-club/notes/PixelAdminNotes.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Box, Card, CardContent, Grid, CircularProgress, Alert } from '@mui/material';

export default function PixelAdminNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminNotes = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin-notes');
        if (!response.ok) {
          throw new Error('Failed to fetch admin notes');
        }
        const data = await response.json();
        setNotes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminNotes();
  }, []);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        🛡️ Pixel Admin Notes
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {!loading && !error && notes.length === 0 && (
        <Typography variant="body1" sx={{ textAlign: 'center', my: 4, color: 'text.secondary' }}>
          No admin notes are available at the moment.
        </Typography>
      )}

      {!loading && !error && notes.length > 0 && (
        <Grid container spacing={3}>
          {notes.map((note) => (
            <Grid item xs={12} sm={6} md={4} key={note.id}>
              <Card sx={{ height: '100%', boxShadow: 2, backgroundColor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="h6" component="div" gutterBottom>
                    {note.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {note.content}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block' }}>
                    {new Date(note.created_at).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

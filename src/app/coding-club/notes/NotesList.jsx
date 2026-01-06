// src/app/coding-club/notes/NotesList.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Alert } from '@mui/material';

export default function NotesList() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(`Failed to fetch notes: ${fetchError.message}`);
        setNotes([]);
      } else {
        setNotes(data);
      }
      setLoading(false);
    };

    fetchNotes();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
  }

  if (notes.length === 0) {
    return (
      <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
        No notes have been uploaded yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Uploaded Notes
      </Typography>
      <Grid container spacing={3}>
        {notes.map((note) => (
          <Grid item xs={12} sm={6} md={4} key={note.id}>
            <Card sx={{ height: '100%', boxShadow: 2 }}>
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
    </Box>
  );
}

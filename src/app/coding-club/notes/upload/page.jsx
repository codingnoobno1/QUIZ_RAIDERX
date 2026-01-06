// src/app/coding-club/notes/upload/page.jsx
'use client';

import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function UploadNotePage() {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!session?.user?.role) {
      setError('You must be logged in to upload a note.');
      setLoading(false);
      return;
    }

    if (!title || !content) {
      setError('Title and content cannot be empty.');
      setLoading(false);
      return;
    }

    const { error: uploadError } = await supabase
      .from('notes')
      .insert([{ title, content, author_role: session.user.role }]);

    setLoading(false);

    if (uploadError) {
      setError(`Failed to upload note: ${uploadError.message}`);
    } else {
      setSuccess('Note uploaded successfully!');
      setTitle('');
      setContent('');
      // Optional: redirect user after successful upload
      setTimeout(() => router.push('/coding-club/notes'), 1500);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 4, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Upload a New Note
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Note Title"
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Note Content"
              variant="outlined"
              multiline
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              required
            />
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !session}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Uploading...' : 'Upload Note'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

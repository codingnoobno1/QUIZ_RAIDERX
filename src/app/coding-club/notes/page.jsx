// app/coding-club/notes/page.jsx
'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from 'next/link';
import NotesList from './NotesList';
import PixelAdminNotes from './PixelAdminNotes';

export default function NotesPage() {
  return (
    <Box sx={{ px: 3, py: 4 }}>
      <Paper
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          background: 'linear-gradient(to right, #fdfbfb, #ebedee)',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          mb: 4,
        }}
      >
        <img
          src="https://cdn-icons-png.flaticon.com/512/471/471664.png"
          alt="Notes Banner"
          style={{ maxWidth: 160, borderRadius: '50%' }}
        />

        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
          Welcome to Pixel Notes Hub
        </Typography>

        <Typography variant="body1" sx={{ textAlign: 'center', color: '#555', maxWidth: 600 }}>
          Explore curated notes from Pixel Admins, shared member notes, or upload your own.
          This is your collaborative space for learning and sharing.
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Link href="/coding-club/notes/upload" passHref>
            <Button variant="contained" color="primary" size="large">
              Upload a New Note
            </Button>
          </Link>
        </Box>
      </Paper>

      <PixelAdminNotes />

      <Divider sx={{ my: 4 }}>
        <Typography variant="overline">All Notes</Typography>
      </Divider>

      <NotesList />
    </Box>
  );
}

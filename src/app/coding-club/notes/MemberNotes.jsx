// app/coding-club/notes/MemberNotes.jsx
'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Grid } from '@mui/material';
import { FileText, BookOpenCheck, ScrollText } from 'lucide-react';

const sampleNotes = [
  {
    title: 'Operating Systems - Threads vs Processes',
    description: 'A short summary of process scheduling and thread management.',
    tags: ['OS', 'Concepts', 'Semester 3'],
    icon: <FileText size={20} />,
  },
  {
    title: 'DBMS Normalization Cheatsheet',
    description: 'Explains 1NF to 5NF with practical examples.',
    tags: ['DBMS', 'Normalization', 'Semester 4'],
    icon: <ScrollText size={20} />,
  },
  {
    title: 'DSA PYQs - Sorting Algorithms',
    description: 'Previous year questions from sorting: Bubble, Merge, Quick.',
    tags: ['DSA', 'PYQ', 'Semester 2'],
    icon: <BookOpenCheck size={20} />,
  },
];

export default function MemberNotes() {
  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
        👥 Member Notes
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
        Browse curated notes and contributions shared by club members.
      </Typography>

      <Grid container spacing={3}>
        {sampleNotes.map((note, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                backgroundColor: '#fefefe',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {note.icon}
                  <Typography variant="h6" fontWeight={600} sx={{ color: '#333' }}>
                    {note.title}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                  {note.description}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {note.tags.map((tag, i) => (
                    <Chip key={i} label={tag} size="small" sx={{ bgcolor: '#e0f7fa', color: '#00796b' }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

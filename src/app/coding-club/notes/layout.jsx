// app/coding-club/notes/layout.jsx
'use client';

import React from 'react';
import {
  Box,
  CssBaseline,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Typography,
  Container,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  UploadFile as UploadIcon,
} from '@mui/icons-material';

import PixelAdminNotes from './PixelAdminNotes';
import MemberNotes from './MemberNotes';
import UploadNotes from './UploadNotes';

export default function NotesLayout({ children }) {
  const [value, setValue] = React.useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <CssBaseline />

      {/* Optional banner or hero image */}
      <Box
        component="img"
        src="https://source.unsplash.com/1600x400/?notes,coding"
        alt="Notes Banner"
        sx={{
          width: '100%',
          maxHeight: 250,
          objectFit: 'cover',
          borderBottom: '4px solid #e0e0e0',
        }}
      />

      {/* Main Content */}
      <Container sx={{ flexGrow: 1, py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
          PIXEL CLUB NOTES
        </Typography>

        {value === 0 && <PixelAdminNotes />}
        {value === 1 && <MemberNotes />}
        {value === 2 && <UploadNotes />}
        {children}
      </Container>

      {/* Bottom Navigation */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: '1px solid #ddd',
          bgcolor: '#fff',
        }}
      >
        <BottomNavigation
          value={value}
          onChange={(e, newValue) => setValue(newValue)}
          showLabels
          sx={{ bgcolor: '#fff' }}
        >
          <BottomNavigationAction label="Admin Notes" icon={<AdminIcon />} />
          <BottomNavigationAction label="Member Notes" icon={<PeopleIcon />} />
          <BottomNavigationAction label="Upload" icon={<UploadIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

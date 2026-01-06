import React from 'react';
import { Typography, Paper } from '@mui/material';

export default function ProfilePage() {
  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        My Profile
      </Typography>
      <Paper sx={{ p: 3, backgroundColor: '#1e1e1e', color: 'white', borderRadius: 2 }}>
        <Typography variant="h6">
          User Information
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          This is where user profile details will be displayed. You can add forms here to edit user information.
        </Typography>
      </Paper>
    </>
  );
}

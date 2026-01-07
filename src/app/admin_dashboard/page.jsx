'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';

import EventIcon from '@mui/icons-material/Event';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import QuizIcon from '@mui/icons-material/Quiz';
import NoteAddIcon from '@mui/icons-material/NoteAdd';

export default function AdminDashboard() {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Create Event */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <EventIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 1 }}>
                Create Event
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                fullWidth
              >
                Go
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Manage Attendance */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentTurnedInIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 1 }}>
                Manage OD Attendance
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                fullWidth
              >
                Go
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Quiz Creation */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <QuizIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 1 }}>
                Quiz Creation
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                fullWidth
              >
                Go
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Notes Upload */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <NoteAddIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 1 }}>
                Notes Upload
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                fullWidth
              >
                Go
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Event, AssignmentTurnedIn, Quiz, NoteAdd } from '@mui/icons-material';

const AdminDashboard = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Event fontSize="large" color="primary" />
              <Typography variant="h6" component="div" sx={{ mt: 1 }}>
                Create Event
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }}>Go</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <AssignmentTurnedIn fontSize="large" color="primary" />
              <Typography variant="h6" component="div" sx={{ mt: 1 }}>
                Manage OD Attendance
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }}>Go</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Quiz fontSize="large" color="primary" />
              <Typography variant="h6" component="div" sx={{ mt: 1 }}>
                Quiz Creation
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }}>Go</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <NoteAdd fontSize="large" color="primary" />
              <Typography variant="h6" component="div" sx={{ mt: 1 }}>
                Notes Upload
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }}>Go</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;

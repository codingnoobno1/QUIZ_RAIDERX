'use client';

import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, List, ListItem, ListItemText, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid } from '@mui/material';
import { styled } from '@mui/system';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
}));

const eventsData = [
  { id: 1, name: 'Annual Tech Fest', date: '2025-12-01', description: 'A grand tech event.' },
  { id: 2, name: 'Coding Competition', date: '2025-11-15', description: 'Showcase your coding skills.' },
  { id: 3, name: 'Guest Lecture Series', date: '2026-01-20', description: 'Insights from industry experts.' },
];

const usersRegisteredForEvent = {
  1: [
    { user_uuid: 'user1', name: 'Alice Smith', attendance_status: 'Pending', od_requested: true, remarks: 'Fever', proof_url: 'https://example.com/proof1.pdf' },
    { user_uuid: 'user2', name: 'Bob Johnson', attendance_status: 'Present', od_requested: false },
    { user_uuid: 'user3', name: 'Charlie Brown', attendance_status: 'OnDuty', od_requested: true, remarks: 'Representing college', proof_url: 'https://example.com/proof2.pdf' },
  ],
  2: [
    { user_uuid: 'user4', name: 'Diana Prince', attendance_status: 'Pending', od_requested: false },
  ],
};

const MasterControllerDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openOdDialog, setOpenOdDialog] = useState(false);
  const [selectedOdRequest, setSelectedOdRequest] = useState(null);
  const [odStatus, setOdStatus] = useState('');
  const [odRemarks, setOdRemarks] = useState('');

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setSelectedEvent(null); // Reset selected event when changing tabs
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
  };

  const handleOpenOdDialog = (odRequest) => {
    setSelectedOdRequest(odRequest);
    setOdStatus(odRequest.od_approved ? 'Approved' : (odRequest.od_requested ? 'Requested' : ''));
    setOdRemarks(odRequest.remarks || '');
    setOpenOdDialog(true);
  };

  const handleCloseOdDialog = () => {
    setOpenOdDialog(false);
    setSelectedOdRequest(null);
    setOdStatus('');
    setOdRemarks('');
  };

  const handleOdApproval = () => {
    // In a real application, this would send an API request to update the OD status
    console.log(`Approving OD for ${selectedOdRequest.name}: Status - ${odStatus}, Remarks - ${odRemarks}`);
    handleCloseOdDialog();
  };

  const renderEventList = () => (
    <Box>
      <Typography variant="h5" gutterBottom>All Events</Typography>
      <List>
        {eventsData.map((event) => (
          <StyledPaper key={event.id} elevation={1} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handleEventSelect(event)}>
            <ListItem>
              <ListItemText
                primary={<Typography variant="h6">{event.name}</Typography>}
                secondary={`Date: ${event.date}`}
              />
            </ListItem>
          </StyledPaper>
        ))}
      </List>
    </Box>
  );

  const renderEventDetails = () => {
    if (!selectedEvent) return null;

    const registeredUsers = usersRegisteredForEvent[selectedEvent.id] || [];

    return (
      <Box>
        <Button variant="outlined" onClick={() => setSelectedEvent(null)} sx={{ mb: 2 }}>
          Back to Events
        </Button>
        <Typography variant="h5" gutterBottom>{selectedEvent.name} Details</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {selectedEvent.description}
        </Typography>

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Registered Users</Typography>
        <List>
          {registeredUsers.length > 0 ? (
            registeredUsers.map((user) => (
              <StyledPaper key={user.user_uuid} elevation={1} sx={{ mb: 1 }}>
                <ListItem secondaryAction={
                  user.od_requested && (
                    <Button variant="outlined" size="small" onClick={() => handleOpenOdDialog(user)}>
                      Review OD
                    </Button>
                  )
                }>
                  <ListItemText
                    primary={user.name}
                    secondary={`Status: ${user.attendance_status} ${user.od_requested ? '(OD Requested)' : ''}`}
                  />
                </ListItem>
              </StyledPaper>
            ))
          ) : (
            <Typography>No users registered for this event.</Typography>
          )}
        </List>
      </Box>
    );
  };

  const renderOdApproval = () => {
    const odRequests = Object.values(usersRegisteredForEvent).flat().filter(user => user.od_requested);

    return (
      <Box>
        <Typography variant="h5" gutterBottom>OD Approval System</Typography>
        <List>
          {odRequests.length > 0 ? (
            odRequests.map((request) => (
              <StyledPaper key={request.user_uuid + request.event_id} elevation={1} sx={{ mb: 1 }}>
                <ListItem secondaryAction={
                  <Button variant="outlined" size="small" onClick={() => handleOpenOdDialog(request)}>
                    Review
                  </Button>
                }>
                  <ListItemText
                    primary={`${request.name} - Event ID: ${request.event_id}`}
                    secondary={`Remarks: ${request.remarks || 'N/A'} | Proof: ${request.proof_url ? 'Available' : 'N/A'}`}
                  />
                </ListItem>
              </StyledPaper>
            ))
          ) : (
            <Typography>No OD requests to review.</Typography>
          )}
        </List>

        <Dialog open={openOdDialog} onClose={handleCloseOdDialog}>
          <DialogTitle>Review OD Request</DialogTitle>
          <DialogContent>
            {selectedOdRequest && (
              <Box component="form" sx={{ mt: 2 }}>
                <Typography variant="subtitle1">User: {selectedOdRequest.name}</Typography>
                <Typography variant="subtitle1">Event ID: {selectedOdRequest.event_id}</Typography>
                <Typography variant="body2">Requested Remarks: {selectedOdRequest.remarks || 'N/A'}</Typography>
                {selectedOdRequest.proof_url && (
                  <Typography variant="body2">Proof: <a href={selectedOdRequest.proof_url} target="_blank" rel="noopener noreferrer">View Proof</a></Typography>
                )}
                <TextField
                  select
                  label="OD Status"
                  value={odStatus}
                  onChange={(e) => setOdStatus(e.target.value)}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </TextField>
                <TextField
                  label="Admin Remarks"
                  value={odRemarks}
                  onChange={(e) => setOdRemarks(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseOdDialog}>Cancel</Button>
            <Button onClick={handleOdApproval} variant="contained">Submit Approval</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Master Controller Dashboard
      </Typography>

      <StyledPaper elevation={2}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="master dashboard tabs">
          <Tab label="Event Handling" />
          <Tab label="OD Approval" />
          {/* Add more tabs for other sections as needed */}
        </Tabs>
      </StyledPaper>

      <Box sx={{ mt: 3 }}>
        {currentTab === 0 && (selectedEvent ? renderEventDetails() : renderEventList())}
        {currentTab === 1 && renderOdApproval()}
      </Box>
    </Box>
  );
};

export default MasterControllerDashboard;
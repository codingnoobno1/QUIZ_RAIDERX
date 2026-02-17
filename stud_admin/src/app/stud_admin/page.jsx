'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Grid } from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon, Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

// ... imports remain the same ...

export default function StudentAdminDashboard() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);

    // Data States
    const [events, setEvents] = useState([]);
    const [researchRequests, setResearchRequests] = useState([]);
    const [projectRequests, setProjectRequests] = useState([]);
    const [adminNotes, setAdminNotes] = useState([]);

    // Modals
    const [openEventModal, setOpenEventModal] = useState(false);
    const [openNoteModal, setOpenNoteModal] = useState(false);

    // Form States
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', time: '', location: '', imageUrl: '' });
    const [newNote, setNewNote] = useState({ title: '', content: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 0) { // Events
                const res = await fetch('/api/events');
                const data = await res.json();
                if (res.ok) setEvents(data.data || []);
            } else if (activeTab === 1) { // Research
                const res = await fetch('/api/research/approval');
                const data = await res.json();
                if (res.ok) setResearchRequests(data.data || []);
            } else if (activeTab === 2) { // Projects
                const res = await fetch('/api/portfolio-projects/approval');
                const data = await res.json();
                if (res.ok) setProjectRequests(data.data || []);
            } else if (activeTab === 3) { // Notes
                const res = await fetch('/api/admin-notes');
                const data = await res.json();
                if (res.ok) setAdminNotes(data || []);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---

    const handleApproval = async (id, status, type) => {
        // type: 'research' | 'project'
        const endpoint = type === 'research' ? '/api/research/approval' : '/api/portfolio-projects/approval';
        try {
            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                toast.success(`${type} ${status}`);
                fetchData();
            } else {
                toast.error("Action failed");
            }
        } catch (error) {
            toast.error("Error processing request");
        }
    };

    const handleDelete = async (id, type) => {
        let endpoint = '';
        if (type === 'event') endpoint = `/api/events?id=${id}`;
        if (type === 'note') endpoint = `/api/admin-notes?id=${id}`;

        try {
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Deleted successfully");
                fetchData();
            } else {
                toast.error("Delete failed");
            }
        } catch (error) {
            toast.error("Error deleting item");
        }
    };

    const handleCreateEvent = async () => {
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent)
            });
            if (res.ok) {
                toast.success("Event created");
                setOpenEventModal(false);
                setNewEvent({ title: '', description: '', date: '', time: '', location: '', imageUrl: '' });
                fetchData();
            } else {
                toast.error("Failed to create event");
            }
        } catch (error) {
            toast.error("Error creating event");
        }
    };

    // Image Upload Handler
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const toastId = toast.loading("Uploading image...");
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                setNewEvent({ ...newEvent, imageUrl: data.url });
                toast.success("Image uploaded", { id: toastId });
            } else {
                toast.error("Upload failed", { id: toastId });
            }
        } catch (error) {
            toast.error("Error uploading", { id: toastId });
        }
    };

    const handleCreateNote = async () => {
        try {
            const res = await fetch('/api/admin-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newNote)
            });
            if (res.ok) {
                toast.success("Note created");
                setOpenNoteModal(false);
                setNewNote({ title: '', content: '' });
                fetchData();
            } else {
                toast.error("Failed to create note");
            }
        } catch (error) {
            toast.error("Error creating note");
        }
    };

    const glassCardSx = {
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.3)'
    };

    const tableHeadSx = {
        bgcolor: 'rgba(26, 35, 126, 0.05)', // Very light blue tint
        '& th': {
            color: '#1A237E', // Dark Blue
            fontWeight: 'bold',
            borderBottom: '2px solid rgba(26, 35, 126, 0.1)'
        }
    };

    const tableCellSx = {
        color: '#333',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
    };

    const buttonGradientSx = {
        background: 'linear-gradient(45deg, #0D47A1 30%, #00BCD4 90%)',
        color: '#fff',
        fontWeight: 'bold',
        boxShadow: '0 3px 5px 2px rgba(13, 71, 161, .3)',
        '&:hover': { background: 'linear-gradient(45deg, #0D47A1 60%, #00BCD4 90%)', transform: 'scale(1.02)' },
        transition: 'all 0.2s'
    };

    return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: '800', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                    Master Admin Dashboard
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
                    Welcome, {session?.user?.name}
                </Typography>
            </Box>

            <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                    mb: 4,
                    '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', fontSize: '1rem' },
                    '& .Mui-selected': { color: '#fff' },
                    '& .MuiTabs-indicator': { bgcolor: '#00BCD4', height: 4, borderRadius: '4px 4px 0 0' }
                }}
            >
                <Tab label="Events" />
                <Tab label="Research Approvals" />
                <Tab label="Project Approvals" />
                <Tab label="Admin Notes" />
            </Tabs>

            {/* --- Tab 0: Events --- */}
            {activeTab === 0 && (
                <Box>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" startIcon={<AddIcon />} sx={buttonGradientSx} onClick={() => setOpenEventModal(true)}>
                            Add Event
                        </Button>
                    </Box>
                    <TableContainer component={Paper} sx={glassCardSx}>
                        <Table>
                            <TableHead sx={tableHeadSx}>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Location</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {events.map((ev) => (
                                    <TableRow key={ev._id} hover>
                                        <TableCell sx={{ ...tableCellSx, fontWeight: '500' }}>{ev.title}</TableCell>
                                        <TableCell sx={tableCellSx}>{new Date(ev.date).toLocaleDateString()}</TableCell>
                                        <TableCell sx={tableCellSx}>{ev.location}</TableCell>
                                        <TableCell sx={tableCellSx}>
                                            <IconButton color="error" onClick={() => handleDelete(ev._id, 'event')}><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* --- Tab 1: Research --- */}
            {activeTab === 1 && (
                <TableContainer component={Paper} sx={glassCardSx}>
                    <Table>
                        <TableHead sx={tableHeadSx}>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell>Submitter</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {researchRequests.length === 0 && <TableRow><TableCell colSpan={4} sx={{ color: '#666', textAlign: 'center', py: 3 }}>No pending requests</TableCell></TableRow>}
                            {researchRequests.map((req) => (
                                <TableRow key={req._id} hover>
                                    <TableCell sx={{ ...tableCellSx, fontWeight: '500' }}>{req.title}</TableCell>
                                    <TableCell sx={tableCellSx}>{req.submitterName}</TableCell>
                                    <TableCell sx={tableCellSx}>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell sx={tableCellSx}>
                                        <IconButton color="success" onClick={() => handleApproval(req._id, 'approved', 'research')}><CheckIcon /></IconButton>
                                        <IconButton color="error" onClick={() => handleApproval(req._id, 'rejected', 'research')}><CloseIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* --- Tab 2: Projects --- */}
            {activeTab === 2 && (
                <TableContainer component={Paper} sx={glassCardSx}>
                    <Table>
                        <TableHead sx={tableHeadSx}>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell>Author</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projectRequests.length === 0 && <TableRow><TableCell colSpan={4} sx={{ color: '#666', textAlign: 'center', py: 3 }}>No pending projects</TableCell></TableRow>}
                            {projectRequests.map((proj) => (
                                <TableRow key={proj._id} hover>
                                    <TableCell sx={{ ...tableCellSx, fontWeight: '500' }}>{proj.title}</TableCell>
                                    <TableCell sx={tableCellSx}>{proj.authorName}</TableCell>
                                    <TableCell sx={tableCellSx}>{proj.category}</TableCell>
                                    <TableCell sx={tableCellSx}>
                                        <IconButton color="success" onClick={() => handleApproval(proj._id, 'approved', 'project')}><CheckIcon /></IconButton>
                                        <IconButton color="error" onClick={() => handleApproval(proj._id, 'rejected', 'project')}><CloseIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* --- Tab 3: Notes --- */}
            {activeTab === 3 && (
                <Box>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" startIcon={<AddIcon />} sx={buttonGradientSx} onClick={() => setOpenNoteModal(true)}>
                            Create Note
                        </Button>
                    </Box>
                    <TableContainer component={Paper} sx={glassCardSx}>
                        <Table>
                            <TableHead sx={tableHeadSx}>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Content</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {adminNotes.map((note) => (
                                    <TableRow key={note.id || note._id} hover>
                                        <TableCell sx={{ ...tableCellSx, fontWeight: '500' }}>{note.title}</TableCell>
                                        <TableCell sx={{ ...tableCellSx, maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#555' }}>
                                            {note.content}
                                        </TableCell>
                                        <TableCell sx={tableCellSx}>
                                            <IconButton color="error" onClick={() => handleDelete(note.id || note._id, 'note')}><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* -- Event Modal -- */}
            <Dialog open={openEventModal} onClose={() => setOpenEventModal(false)} PaperProps={{ sx: { bgcolor: '#fff', color: '#333', borderRadius: 2 } }}>
                <DialogTitle sx={{ color: '#1A237E', fontWeight: 'bold' }}>Add New Event</DialogTitle>
                <DialogContent>
                    <TextField label="Title" fullWidth margin="dense" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                    <TextField label="Description" fullWidth margin="dense" multiline rows={3} value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
                    <TextField label="Date" type="date" fullWidth margin="dense" InputLabelProps={{ shrink: true }} value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
                    <TextField label="Time" fullWidth margin="dense" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
                    <TextField label="Location" fullWidth margin="dense" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
                    {/* Image Upload Section */}
                    <Box sx={{ mt: 2, mb: 1 }}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="raised-button-file"
                            type="file"
                            onChange={handleImageUpload}
                        />
                        <label htmlFor="raised-button-file">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CloudUploadIcon />}
                                sx={{
                                    color: '#00BCD4',
                                    borderColor: '#00BCD4',
                                    '&:hover': { borderColor: '#0D47A1', bgcolor: 'rgba(0, 188, 212, 0.05)' }
                                }}
                            >
                                Upload Event Image
                            </Button>
                        </label>
                        {newEvent.imageUrl && (
                            <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #eee' }}>
                                <img src={newEvent.imageUrl} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEventModal(false)} sx={{ color: '#666' }}>Cancel</Button>
                    <Button onClick={handleCreateEvent} variant="contained" sx={buttonGradientSx}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* -- Note Modal -- */}
            <Dialog open={openNoteModal} onClose={() => setOpenNoteModal(false)} PaperProps={{ sx: { bgcolor: '#fff', color: '#333', borderRadius: 2 } }}>
                <DialogTitle sx={{ color: '#1A237E', fontWeight: 'bold' }}>Create Admin Note</DialogTitle>
                <DialogContent>
                    <TextField label="Title" fullWidth margin="dense" value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} />
                    <TextField label="Content" fullWidth margin="dense" multiline rows={4} value={newNote.content} onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNoteModal(false)} sx={{ color: '#666' }}>Cancel</Button>
                    <Button onClick={handleCreateNote} variant="contained" sx={buttonGradientSx}>Create</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

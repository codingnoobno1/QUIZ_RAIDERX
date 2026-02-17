'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function StudentAdminDashboard() {
    const [activeTab, setActiveTab] = useState(0);
    const [researchRequests, setResearchRequests] = useState([]);
    const [adminNotes, setAdminNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Note Modal State
    const [openNoteModal, setOpenNoteModal] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', content: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 0) {
                // Fetch Pending Research
                const res = await fetch('/api/research/approval');
                const data = await res.json();
                if (res.ok) setResearchRequests(data.data || []);
            } else {
                // Fetch Admin Notes
                const res = await fetch('/api/admin-notes');
                const data = await res.json();
                if (res.ok) setAdminNotes(data || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action, type) => {
        try {
            let res;
            if (type === 'research') {
                res = await fetch('/api/research/approval', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, status: action }) // action = 'approved' | 'rejected'
                });
            } else if (type === 'note_delete') {
                res = await fetch(`/api/admin-notes?id=${id}`, { method: 'DELETE' });
            }

            if (res.ok) {
                toast.success("Action successful");
                fetchData(); // Refresh list
            } else {
                toast.error("Action failed");
            }
        } catch (error) {
            toast.error("Error performing action");
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

    return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#00FFFF' }}>Student Admin Dashboard</Typography>

            <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                    mb: 4,
                    '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)' },
                    '& .Mui-selected': { color: '#00FFFF' },
                    '& .MuiTabs-indicator': { bgcolor: '#00FFFF' }
                }}
            >
                <Tab label="Research Approvals" />
                <Tab label="Admin Notes" />
            </Tabs>

            {/* Research Approval Tab */}
            {activeTab === 0 && (
                <Paper sx={{ bgcolor: '#111', borderRadius: 2, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#1a1a1a' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#00FFFF' }}>Title</TableCell>
                                    <TableCell sx={{ color: '#00FFFF' }}>Submitter</TableCell>
                                    <TableCell sx={{ color: '#00FFFF' }}>Type</TableCell>
                                    <TableCell sx={{ color: '#00FFFF' }}>Date</TableCell>
                                    <TableCell sx={{ color: '#00FFFF' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {researchRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ color: '#fff', py: 4 }}>No pending requests</TableCell>
                                    </TableRow>
                                ) : (
                                    researchRequests.map((req) => (
                                        <TableRow key={req._id}>
                                            <TableCell sx={{ color: '#fff' }}>{req.title}</TableCell>
                                            <TableCell sx={{ color: '#aaa' }}>{req.submitterName}</TableCell>
                                            <TableCell sx={{ color: '#aaa' }}>{req.publicationType}</TableCell>
                                            <TableCell sx={{ color: '#aaa' }}>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <IconButton color="success" onClick={() => handleAction(req._id, 'approved', 'research')}>
                                                    <CheckIcon />
                                                </IconButton>
                                                <IconButton color="error" onClick={() => handleAction(req._id, 'rejected', 'research')}>
                                                    <CloseIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Admin Notes Tab */}
            {activeTab === 1 && (
                <Box>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ bgcolor: '#00FFFF', color: '#000', '&:hover': { bgcolor: '#00cccc' } }}
                            onClick={() => setOpenNoteModal(true)}
                        >
                            Create Note
                        </Button>
                    </Box>
                    <Paper sx={{ bgcolor: '#111', borderRadius: 2, overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: '#1a1a1a' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: '#00FFFF' }}>Title</TableCell>
                                        <TableCell sx={{ color: '#00FFFF' }}>Content</TableCell>
                                        <TableCell sx={{ color: '#00FFFF' }}>Created At</TableCell>
                                        <TableCell sx={{ color: '#00FFFF' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {adminNotes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ color: '#fff', py: 4 }}>No notes found</TableCell>
                                        </TableRow>
                                    ) : (
                                        adminNotes.map((note) => (
                                            <TableRow key={note.id || note._id}>
                                                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{note.title}</TableCell>
                                                <TableCell sx={{ color: '#aaa', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {note.content}
                                                </TableCell>
                                                <TableCell sx={{ color: '#aaa' }}>{new Date(note.created_at || note.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <IconButton color="error" onClick={() => handleAction(note.id || note._id, null, 'note_delete')}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Create Note Modal */}
                    <Dialog open={openNoteModal} onClose={() => setOpenNoteModal(false)} PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff' } }}>
                        <DialogTitle>Create Admin Note</DialogTitle>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Title"
                                fullWidth
                                variant="outlined"
                                value={newNote.title}
                                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } }, '& .MuiInputLabel-root': { color: '#aaa' } }}
                            />
                            <TextField
                                margin="dense"
                                label="Content"
                                fullWidth
                                multiline
                                rows={4}
                                variant="outlined"
                                value={newNote.content}
                                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } }, '& .MuiInputLabel-root': { color: '#aaa' } }}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenNoteModal(false)} sx={{ color: '#aaa' }}>Cancel</Button>
                            <Button onClick={handleCreateNote} variant="contained" sx={{ bgcolor: '#00FFFF', color: '#000' }}>Create</Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            )}
        </Container>
    );
}

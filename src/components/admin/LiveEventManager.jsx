'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Grid,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    IconButton,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function LiveEventManager() {
    const [events, setEvents] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [activeMode, setActiveMode] = useState('');

    // Mode specific configs
    const [quizId, setQuizId] = useState('');
    const [quizTimer, setQuizTimer] = useState(30);
    const [votingTopics, setVotingTopics] = useState(['Option A', 'Option B']);
    const [newTopic, setNewTopic] = useState('');
    const [clueCount, setClueCount] = useState(5);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchQuizzes();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/events');
            const data = await response.json();
            setEvents(data);
        } catch (err) {
            setError('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizzes = async () => {
        try {
            const response = await fetch('/api/admin/quizzes');
            const data = await response.json();
            setQuizzes(data);
        } catch (err) {
            console.error('Failed to fetch quizzes');
        }
    };

    const handleOpenModeDialog = (event) => {
        setSelectedEvent(event);
        setActiveMode(event.activeMode || 'none');

        // Pre-populate if existing
        const existingMode = event.modes?.find(m => m.type === event.activeMode);
        if (existingMode && existingMode.config) {
            if (event.activeMode === 'quiz') {
                setQuizId(existingMode.config.quizId || '');
                setQuizTimer(existingMode.config.timeLimit || 30);
            } else if (event.activeMode === 'voting') {
                setVotingTopics(existingMode.config.topics || ['Option A', 'Option B']);
            } else if (event.activeMode === 'treasure-hunt') {
                setClueCount(existingMode.config.clueCount || 5);
            }
        }

        setOpenDialog(true);
    };

    const handleAddTopic = () => {
        if (newTopic.trim()) {
            setVotingTopics([...votingTopics, newTopic.trim()]);
            setNewTopic('');
        }
    };

    const handleRemoveTopic = (index) => {
        setVotingTopics(votingTopics.filter((_, i) => i !== index));
    };

    const handleSaveMode = async () => {
        setSaving(true);
        try {
            const modeType = activeMode === 'none' ? 'none' : activeMode;

            const response = await fetch(`/api/admin/event/${selectedEvent._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    activeMode: modeType
                }),
            });

            if (response.ok) {
                setOpenDialog(false);
                fetchEvents();
            } else {
                const errData = await response.json();
                alert(errData.message || 'Failed to update event mode');
            }
        } catch (err) {
            alert('Error saving changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Live Event Mode Controls</Typography>
                <IconButton onClick={fetchEvents} color="primary" disabled={loading}>
                    <RefreshIcon />
                </IconButton>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {events.map((event) => (
                    <Grid item xs={12} key={event._id}>
                        <Card variant="outlined" sx={{
                            borderLeft: event.activeMode ? '6px solid #f50057' : '1px solid #ddd',
                            bgcolor: event.activeMode ? 'rgba(245, 0, 87, 0.04)' : 'inherit',
                            transition: 'all 0.3s ease'
                        }}>
                            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: '600' }}>{event.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {new Date(event.date).toLocaleDateString()} • {event.time} • {event.location}
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                        {event.activeMode ? (
                                            <Chip
                                                icon={<PlayCircleOutlineIcon />}
                                                label={`ACTIVE: ${event.activeMode.toUpperCase()}`}
                                                color="secondary"
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        ) : (
                                            <Chip label="INACTIVE" size="small" variant="outlined" />
                                        )}
                                        {event.activeMode === 'quiz' && (
                                            <Chip variant="outlined" size="small" label={`Quiz: ${quizzes.find(q => q._id === event.modes?.find(m => m.type === 'quiz')?.config?.quizId)?.title || 'Link Broken'}`} />
                                        )}
                                    </Box>
                                </Box>

                                <Button
                                    variant={event.activeMode ? "contained" : "outlined"}
                                    color={event.activeMode ? "secondary" : "primary"}
                                    startIcon={event.activeMode ? <EditIcon /> : <PlayCircleOutlineIcon />}
                                    onClick={() => handleOpenModeDialog(event)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    {event.activeMode ? "Manage Mode" : "Activate Mode"}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Mode Configuration Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    Configure Live Mode: {selectedEvent?.title}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mt: 1 }}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Target Active Mode</InputLabel>
                            <Select
                                value={activeMode}
                                label="Target Active Mode"
                                onChange={(e) => setActiveMode(e.target.value)}
                            >
                                <MenuItem value="none">None (Inactive)</MenuItem>
                                <MenuItem value="quiz">Quiz Mode</MenuItem>
                                <MenuItem value="voting">Voting Mode</MenuItem>
                                <MenuItem value="treasure-hunt">Treasure Hunt</MenuItem>
                            </Select>
                        </FormControl>

                        <Divider sx={{ mb: 3 }} />

                        {/* Quiz Settings */}
                        {activeMode === 'quiz' && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom color="primary">QUIZ SETTINGS</Typography>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Select Quiz Source</InputLabel>
                                    <Select
                                        value={quizId}
                                        label="Select Quiz Source"
                                        onChange={(e) => setQuizId(e.target.value)}
                                    >
                                        {quizzes.map(q => (
                                            <MenuItem key={q._id} value={q._id}>{q.title}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Time Limit (Seconds per Question)"
                                    type="number"
                                    value={quizTimer}
                                    onChange={(e) => setQuizTimer(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                            </Box>
                        )}

                        {/* Voting Settings */}
                        {activeMode === 'voting' && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom color="primary">VOTING TOPICS</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Add new option..."
                                        value={newTopic}
                                        onChange={(e) => setNewTopic(e.target.value)}
                                    />
                                    <Button variant="outlined" onClick={handleAddTopic} startIcon={<AddIcon />}>Add</Button>
                                </Box>
                                <List dense sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                                    {votingTopics.map((topic, index) => (
                                        <ListItem key={index}>
                                            <ListItemText primary={topic} />
                                            <ListItemSecondaryAction>
                                                <IconButton edge="end" onClick={() => handleRemoveTopic(index)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {/* Treasure Hunt Settings */}
                        {activeMode === 'treasure-hunt' && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom color="primary">TREASURE HUNT CONFIG</Typography>
                                <TextField
                                    fullWidth
                                    label="Total Clues/Tasks"
                                    type="number"
                                    value={clueCount}
                                    onChange={(e) => setClueCount(e.target.value)}
                                />
                            </Box>
                        )}

                        {activeMode === 'none' && (
                            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                                The event is current inactive. Select a mode above to go live.
                            </Typography>
                        )}

                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveMode}
                        variant="contained"
                        disabled={saving || (activeMode !== 'none' && activeMode === 'quiz' && !quizId)}
                        color="secondary"
                    >
                        {saving ? 'Saving...' : 'Go Live!'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

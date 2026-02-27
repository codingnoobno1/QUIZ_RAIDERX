'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useEventUserStore from '@/store/useEventUserStore';
import PixelEventCard from "@/components/PixelEventCard";
import EventPass from '@/components/EventPass';
import {
    Box,
    Typography,
    Button,
    Grid,
    Paper,
    Avatar,
    Chip,
    CircularProgress,
    Stack,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Logout,
    Event as EventIcon,
    EmojiEvents,
    CalendarMonth,
    LocationOn,
    AccessTime,
    Person,
    TrendingUp,
    WorkspacePremium,
    Celebration,
    Add as AddIcon,
    Delete as DeleteIcon,
    Group as GroupIcon,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function EventDashboard() {
    const router = useRouter();
    const hydrateUser = useEventUserStore((s) => s.hydrateUser);
    const user = useEventUserStore((s) => s.user);
    const logout = useEventUserStore((s) => s.logout);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    const [userRegistrations, setUserRegistrations] = useState(new Set());
    const [registeringId, setRegisteringId] = useState(null);

    // Registration Modal State
    const [regModalOpen, setRegModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [regType, setRegType] = useState('solo');
    const [teamName, setTeamName] = useState('');
    const [members, setMembers] = useState([]); // Array of { name, email, enrollmentNumber, semester }

    // Open Requests / Potential Participants
    const [potentialParticipants, setPotentialParticipants] = useState([]);
    const [loadingPotential, setLoadingPotential] = useState(false);

    // Invitations
    const [invitations, setInvitations] = useState([]);
    const [loadingInvitations, setLoadingInvitations] = useState(false);

    // Pass Modal State
    const [passModalOpen, setPassModalOpen] = useState(false);
    const [viewingRegistration, setViewingRegistration] = useState(null);
    const [viewingEvent, setViewingEvent] = useState(null);

    useEffect(() => {
        hydrateUser();
    }, []);

    // Fetch user registrations
    useEffect(() => {
        if (user?.email) {
            const fetchRegistrations = async () => {
                try {
                    const res = await fetch(`/api/events/register?email=${user.email}`);
                    if (res.ok) {
                        const data = await res.json();
                        const registeredEventIds = new Set(data.data.map(r => r.eventId));
                        setUserRegistrations(registeredEventIds);
                    }
                } catch (err) {
                    console.error('Failed to fetch registrations:', err);
                }
            };
            fetchRegistrations();
        }
    }, [user]);

    // Protect route
    useEffect(() => {
        const timer = setTimeout(() => {
            const storedUser = JSON.parse(localStorage.getItem('eventUser'));
            if (!storedUser) {
                router.replace('/event');
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [user, router]);

    // Fetch invitations
    useEffect(() => {
        if (user?.email) {
            fetchInvitations();
        }
    }, [user]);

    const fetchInvitations = async () => {
        setLoadingInvitations(true);
        try {
            const res = await fetch(`/api/events/invitations?email=${user.email}`);
            if (res.ok) {
                const data = await res.json();
                setInvitations(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch invitations:', err);
        } finally {
            setLoadingInvitations(false);
        }
    };

    // Fetch events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/events');
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                }
            } catch (err) {
                console.error('Failed to fetch events:', err);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchEvents();
    }, []);

    const handleLogout = () => {
        logout();
        router.replace('/event');
    };

    const handleOpenRegModal = async (event) => {
        setSelectedEvent(event);
        setRegModalOpen(true);
        setRegType('solo');
        setTeamName('');
        setMembers([]);
        setLoadingPotential(true);
        try {
            const res = await fetch(`/api/events/potential-participants?eventId=${event._id}`);
            if (res.ok) {
                const data = await res.json();
                setPotentialParticipants(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch potential participants:', err);
        } finally {
            setLoadingPotential(false);
        }
    };

    const handleAddMember = (m = null) => {
        if (members.length >= 5) {
            toast.error('Maximum 6 members allowed (including you)');
            return;
        }
        if (m) {
            // Add from potential participants list
            if (members.some(pm => pm.email === m.email)) {
                toast.error('Already added to team');
                return;
            }
            setMembers([...members, {
                name: m.name || '',
                email: m.email || '',
                enrollmentNumber: m.enrollmentNumber || '',
                semester: m.semester || ''
            }]);
        } else {
            setMembers([...members, { name: '', email: '', enrollmentNumber: '', semester: '' }]);
        }
    };

    const handleRemoveMember = (idx) => {
        setMembers(members.filter((_, i) => i !== idx));
    };

    const handleMemberChange = (idx, field, val) => {
        const newMembers = [...members];
        newMembers[idx][field] = val;
        setMembers(newMembers);
    };

    const handleRegister = async () => {
        if (regType === 'team' && !teamName) {
            toast.error('Please enter a team name');
            return;
        }

        // Validate members
        if (regType === 'team') {
            for (const m of members) {
                if (!m.name || !m.email) {
                    toast.error('Please fill all member details');
                    return;
                }
            }
        }

        setRegisteringId(selectedEvent._id);
        try {
            const res = await fetch('/api/events/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: selectedEvent._id,
                    registrationType: regType,
                    teamName: teamName,
                    name: user.name,
                    email: user.email,
                    enrollmentNumber: user.enrollmentNumber,
                    semester: user.semester,
                    members: members
                })
            });

            const data = await res.json();

            if (res.ok) {
                setUserRegistrations(prev => new Set([...prev, selectedEvent._id]));
                toast.success(regType === 'team' ? `Team "${teamName}" registered!` : 'Registered successfully!');
                setRegModalOpen(false);
            } else {
                toast.error(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            toast.error('Something went wrong');
        } finally {
            setRegisteringId(null);
        }
    };

    const handleRespondInvitation = async (registrationId, response) => {
        try {
            const res = await fetch('/api/events/invitations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registrationId,
                    email: user.email,
                    response
                })
            });

            if (res.ok) {
                toast.success(`Invitation ${response}!`);
                fetchInvitations();
                // If accepted, refresh registrations to update "Registered" status on events
                if (response === 'accepted') {
                    const regRes = await fetch(`/api/events/register?email=${user.email}`);
                    if (regRes.ok) {
                        const data = await regRes.json();
                        const registeredEventIds = new Set(data.data.map(r => r.eventId));
                        setUserRegistrations(registeredEventIds);
                    }
                }
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to respond');
            }
        } catch (err) {
            console.error('Invitation response error:', err);
            toast.error('Something went wrong');
        }
    };

    const handleOpenPass = async (event) => {
        setViewingEvent(event);
        try {
            const res = await fetch(`/api/events/register?email=${user.email}`);
            if (res.ok) {
                const data = await res.json();
                const reg = data.data.find(r => r.eventId === event._id || r.eventId?._id === event._id);
                setViewingRegistration(reg);
                setPassModalOpen(true);
            }
        } catch (err) {
            console.error('Pass fetch error:', err);
            toast.error('Failed to load pass');
        }
    };

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0a0a0f' }}>
                <CircularProgress sx={{ color: '#a855f7' }} />
            </Box>
        );
    }

    const statsCards = [
        { title: 'Events Available', value: events.length, icon: <CalendarMonth />, color: '#a855f7' },
        { title: 'Upcoming', value: events.filter((e) => new Date(e.date) > new Date()).length, icon: <TrendingUp />, color: '#6366f1' },
        { title: 'Attended', value: Array.from(userRegistrations).length, icon: <EmojiEvents />, color: '#22c55e' },
        { title: 'Certificates', value: 0, icon: <WorkspacePremium />, color: '#f59e0b' },
    ];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at top left, #1a0533 0%, #0a0a0f 40%, #000 100%)',
                color: '#fff',
                p: { xs: 2, md: 4 },
            }}
        >
            {/* Top bar */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4,
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{
                            width: 52,
                            height: 52,
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            fontWeight: 700,
                            fontSize: '1.3rem',
                            boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                        }}
                    >
                        {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            Welcome, {user.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {user.email}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Chip
                        icon={<Person sx={{ color: '#c084fc !important' }} />}
                        label={user.enrollmentNumber || 'Attendee'}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(168,85,247,0.12)',
                            color: '#c084fc',
                            border: '1px solid rgba(168,85,247,0.25)',
                            fontWeight: 600,
                        }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<Logout />}
                        onClick={handleLogout}
                        sx={{
                            borderColor: 'rgba(239,68,68,0.4)',
                            color: '#f87171',
                            borderRadius: '10px',
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: '#ef4444',
                                bgcolor: 'rgba(239,68,68,0.08)',
                            },
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </Box>

            {/* Invitations Section */}
            {invitations.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <GroupIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
                        <Typography variant="h6" fontWeight={700}>Team Invitations</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        {invitations.map((inv) => (
                            <Grid item xs={12} md={6} key={inv._id}>
                                <Paper sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    bgcolor: 'rgba(245,158,11,0.05)',
                                    border: '1px solid rgba(245,158,11,0.2)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff' }}>
                                            Join "{inv.teamName}" for {inv.eventId?.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            Invited by: {inv.name}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            size="small" variant="contained" color="success"
                                            onClick={() => handleRespondInvitation(inv._id, 'accepted')}
                                            sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' } }}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            size="small" variant="outlined" color="error"
                                            onClick={() => handleRespondInvitation(inv._id, 'rejected')}
                                            sx={{ borderRadius: '8px', textTransform: 'none', borderColor: '#ef4444', color: '#f87171' }}
                                        >
                                            Reject
                                        </Button>
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Stats cards */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {statsCards.map((stat) => (
                    <Grid item xs={6} md={3} key={stat.title}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: '16px',
                                background: `linear-gradient(145deg, ${stat.color}12, rgba(15,15,25,0.8))`,
                                border: `1px solid ${stat.color}25`,
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 12px 30px ${stat.color}20`,
                                    border: `1px solid ${stat.color}40`,
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: '10px',
                                        bgcolor: `${stat.color}18`,
                                        color: stat.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {stat.icon}
                                </Box>
                            </Box>
                            <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                                {stat.value}
                            </Typography>
                            <Typography variant="body3" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
                                {stat.title}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Upcoming events */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Celebration sx={{ color: '#a855f7', fontSize: 28 }} />
                    <Typography variant="h5" fontWeight={700}>
                        Upcoming Events
                    </Typography>
                </Box>

                {loadingEvents ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress sx={{ color: '#a855f7' }} />
                    </Box>
                ) : events.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: '16px',
                            bgcolor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            textAlign: 'center',
                        }}
                    >
                        <EventIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 1 }} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            No events available right now.
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={4} justifyContent="center" sx={{ maxWidth: '1400px', mx: 'auto' }}>
                        {events.map((event) => (
                            <Grid item xs={12} md={6} lg={5.5} xl={5} key={event._id} sx={{ display: 'flex', justifyContent: 'center' }}>
                                <PixelEventCard
                                    event={event}
                                    isRegistered={userRegistrations.has(event._id)}
                                    onRegister={handleOpenRegModal}
                                    isRegistering={registeringId === event._id}
                                    onViewPass={() => handleOpenPass(event)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            {/* Registration Dialog */}
            <Dialog
                open={regModalOpen}
                onClose={() => setRegModalOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#11111a',
                        backgroundImage: 'none',
                        color: '#fff',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }
                }}
            >
                <DialogTitle sx={{ p: 3, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Celebration sx={{ color: '#a855f7' }} />
                        <Typography variant="h5" fontWeight={800}>Register for {selectedEvent?.title}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3, pt: 1 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                            Choose your registration type. You can register solo or as a team (up to 6 members).
                        </Typography>
                        <ToggleButtonGroup
                            value={regType}
                            exclusive
                            onChange={(_, val) => val && setRegType(val)}
                            fullWidth
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.05)',
                                p: 0.5,
                                borderRadius: '12px',
                                '& .MuiToggleButton-root': {
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.5)',
                                    borderRadius: '10px !important',
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&.Mui-selected': {
                                        bgcolor: '#a855f7',
                                        color: '#fff',
                                        '&:hover': { bgcolor: '#9333ea' }
                                    }
                                }
                            }}
                        >
                            <ToggleButton value="solo">Solo Entry</ToggleButton>
                            <ToggleButton value="team">Team Entry</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {regType === 'team' && (
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: '#a855f7', fontWeight: 700 }}>TEAM DETAILS</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Enter Team Name"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255,255,255,0.03)',
                                            color: '#fff',
                                            borderRadius: '12px',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                            '&:hover fieldset': { borderColor: 'rgba(168,85,247,0.5)' },
                                        }
                                    }}
                                />
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#a855f7', fontWeight: 700 }}>TEAM MEMBERS ({members.length + 1}/6)</Typography>
                                    <Button
                                        startIcon={<AddIcon />}
                                        size="small"
                                        onClick={() => handleAddMember()}
                                        disabled={members.length >= 5}
                                        sx={{ color: '#a855f7' }}
                                    >
                                        Add Manually
                                    </Button>
                                </Box>

                                <Grid container spacing={2}>
                                    {/* Leader (ReadOnly) */}
                                    <Grid item xs={12}>
                                        <Paper sx={{ p: 2, bgcolor: 'rgba(168,85,247,0.05)', border: '1px dashed rgba(168,85,247,0.3)', borderRadius: '12px' }}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar size="small" sx={{ bgcolor: '#a855f7', width: 32, height: 32, fontSize: '0.875rem' }}>L</Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{user.name} (You)</Typography>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{user.email} | Sem {user.semester}</Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    {/* Dynamic Members */}
                                    {members.map((member, idx) => (
                                        <Grid item xs={12} key={idx}>
                                            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                                <Stack spacing={2}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="caption" fontWeight={700} sx={{ color: 'rgba(255,255,255,0.3)' }}>MEMBER {idx + 2}</Typography>
                                                        <IconButton size="small" onClick={() => handleRemoveMember(idx)} sx={{ color: '#f87171' }}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                    <Grid container spacing={1}>
                                                        <Grid item xs={12} sm={6}>
                                                            <TextField
                                                                size="small" fullWidth placeholder="Name"
                                                                value={member.name} onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={12} sm={6}>
                                                            <TextField
                                                                size="small" fullWidth placeholder="Email"
                                                                value={member.email} onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <TextField
                                                                size="small" fullWidth placeholder="Enrollment"
                                                                value={member.enrollmentNumber} onChange={(e) => handleMemberChange(idx, 'enrollmentNumber', e.target.value)}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                                            />
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <TextField
                                                                size="small" fullWidth placeholder="Semester"
                                                                value={member.semester} onChange={(e) => handleMemberChange(idx, 'semester', e.target.value)}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" sx={{ color: '#a855f7', fontWeight: 700, mb: 2 }}>FIND TEAMMATES (Registered on Platform)</Typography>
                                {loadingPotential ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {potentialParticipants.length === 0 ? (
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>No other users available right now.</Typography>
                                        ) : (
                                            potentialParticipants.slice(0, 10).map((p, i) => (
                                                <Tooltip key={i} title={`Sem ${p.semester} | ${p.email}`}>
                                                    <Chip
                                                        icon={<PersonAddIcon size="small" />}
                                                        label={p.name}
                                                        onClick={() => handleAddMember(p)}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(168,85,247,0.1)',
                                                            color: '#c084fc',
                                                            '&:hover': { bgcolor: 'rgba(168,85,247,0.2)' }
                                                        }}
                                                    />
                                                </Tooltip>
                                            ))
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Stack>
                    )}

                    {regType === 'solo' && (
                        <Paper sx={{ p: 3, bgcolor: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.1)', borderRadius: '16px' }}>
                            <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>Confirm Registration Details</Typography>
                            <Stack spacing={1}>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}><strong>Name:</strong> {user.name}</Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}><strong>Email:</strong> {user.email}</Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}><strong>Enrollment:</strong> {user.enrollmentNumber}</Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}><strong>Semester:</strong> {user.semester}</Typography>
                            </Stack>
                        </Paper>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setRegModalOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleRegister}
                        disabled={!!registeringId}
                        sx={{
                            borderRadius: '10px',
                            px: 4,
                            bgcolor: '#a855f7',
                            '&:hover': { bgcolor: '#9333ea' }
                        }}
                    >
                        {registeringId ? <CircularProgress size={24} color="inherit" /> : 'Confirm Registration'}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={passModalOpen}
                onClose={() => setPassModalOpen(false)}
                PaperProps={{
                    sx: { bgcolor: 'transparent', boxShadow: 'none', backgroundImage: 'none' }
                }}
            >
                <EventPass
                    registration={viewingRegistration}
                    event={viewingEvent}
                    onClose={() => setPassModalOpen(false)}
                />
            </Dialog>
        </Box >
    );
}

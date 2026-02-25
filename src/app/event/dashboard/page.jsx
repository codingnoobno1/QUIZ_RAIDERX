'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useEventUserStore from '@/store/useEventUserStore';
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
} from '@mui/icons-material';

export default function EventDashboard() {
    const router = useRouter();
    const hydrateUser = useEventUserStore((s) => s.hydrateUser);
    const user = useEventUserStore((s) => s.user);
    const logout = useEventUserStore((s) => s.logout);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    const [userRegistrations, setUserRegistrations] = useState(new Set());
    const [registeringId, setRegisteringId] = useState(null);

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

    const handleRegister = async (eventId) => {
        setRegisteringId(eventId);
        try {
            const res = await fetch('/api/events/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    name: user.name,
                    email: user.email,
                    enrollmentNumber: user.enrollmentNumber
                })
            });

            if (res.ok) {
                setUserRegistrations(prev => new Set([...prev, eventId]));
                // Optional: show a success indicator
            } else {
                const error = await res.json();
                console.error('Registration failed:', error.error);
            }
        } catch (err) {
            console.error('Registration error:', err);
        } finally {
            setRegisteringId(null);
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
        { title: 'Attended', value: userRegistrations.size, icon: <EmojiEvents />, color: '#22c55e' },
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
            {/* ... Top bar ... */}
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
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
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
                    <Grid container spacing={2}>
                        {events.map((event) => (
                            <Grid item xs={12} sm={6} md={4} key={event._id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '16px',
                                        background: 'linear-gradient(145deg, rgba(168,85,247,0.06), rgba(15,15,25,0.85))',
                                        border: '1px solid rgba(168,85,247,0.12)',
                                        backdropFilter: 'blur(10px)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: '0 12px 30px rgba(168,85,247,0.15)',
                                            border: '1px solid rgba(168,85,247,0.3)',
                                        },
                                    }}
                                >
                                    {event.imageUrl && (
                                        <Box
                                            component="img"
                                            src={event.imageUrl}
                                            alt={event.title}
                                            sx={{
                                                width: '100%',
                                                height: 140,
                                                objectFit: 'cover',
                                                borderRadius: '10px',
                                                mb: 2,
                                            }}
                                        />
                                    )}

                                    <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 1 }}>
                                        {event.title}
                                    </Typography>

                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1.5, lineHeight: 1.5 }}>
                                        {event.description?.length > 100 ? event.description.slice(0, 100) + '…' : event.description}
                                    </Typography>

                                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1.5 }} />

                                    <Stack spacing={0.8} sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarMonth sx={{ fontSize: 16, color: '#a855f7' }} />
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                                {new Date(event.date).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccessTime sx={{ fontSize: 16, color: '#6366f1' }} />
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                                {event.time}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationOn sx={{ fontSize: 16, color: '#22c55e' }} />
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                                {event.location}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {userRegistrations.has(event._id) ? (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            disabled
                                            sx={{
                                                borderRadius: '10px',
                                                py: 1.2,
                                                bgcolor: 'rgba(34,197,94,0.2) !important',
                                                color: '#4ade80 !important',
                                                border: '1px solid rgba(34,197,94,0.3)',
                                            }}
                                        >
                                            Registered
                                        </Button>
                                    ) : (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={() => handleRegister(event._id)}
                                            disabled={registeringId === event._id}
                                            sx={{
                                                borderRadius: '10px',
                                                py: 1.2,
                                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                                fontWeight: 700,
                                                '&:hover': {
                                                    boxShadow: '0 8px 20px rgba(124,58,237,0.3)',
                                                },
                                            }}
                                        >
                                            {registeringId === event._id ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Register for Event'}
                                        </Button>
                                    )}
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        </Box>
    );
}

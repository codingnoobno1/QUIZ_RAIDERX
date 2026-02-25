'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography, Chip } from '@mui/material';
import { Event as EventIcon, Login as LoginIcon, PersonAdd } from '@mui/icons-material';
import EventLogin from './EventLogin';
import EventRegister from './EventRegister';
import useEventUserStore from '@/store/useEventUserStore';

export default function EventAuthPage() {
    const [showLogin, setShowLogin] = useState(true);
    const router = useRouter();
    const hydrateUser = useEventUserStore((s) => s.hydrateUser);
    const user = useEventUserStore((s) => s.user);

    useEffect(() => {
        hydrateUser();
    }, []);

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (user) {
            router.replace('/event/dashboard');
        }
    }, [user, router]);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at top, #1a0533 0%, #0a0a0f 50%, #000 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated background orbs */}
            <Box
                sx={{
                    position: 'absolute',
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
                    top: '-10%',
                    left: '-5%',
                    filter: 'blur(60px)',
                    animation: 'pulse 6s ease-in-out infinite',
                    '@keyframes pulse': {
                        '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
                        '50%': { opacity: 0.8, transform: 'scale(1.15)' },
                    },
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: 350,
                    height: 350,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)',
                    bottom: '-8%',
                    right: '-3%',
                    filter: 'blur(50px)',
                    animation: 'pulse 8s ease-in-out infinite reverse',
                }}
            />

            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 1,
                    }}
                >
                    <EventIcon sx={{ fontSize: 40, color: '#a855f7' }} />
                    <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{
                            background: 'linear-gradient(135deg, #c084fc, #818cf8, #a855f7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Event Portal
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
                    Quiz Raider X — Event Management
                </Typography>
                <Chip
                    label="PIXEL"
                    size="small"
                    sx={{
                        mt: 1.5,
                        bgcolor: 'rgba(168,85,247,0.15)',
                        color: '#c084fc',
                        border: '1px solid rgba(168,85,247,0.3)',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                    }}
                />
            </Box>

            {/* Toggle buttons */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    mb: 3,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Button
                    variant={showLogin ? 'contained' : 'outlined'}
                    startIcon={<LoginIcon />}
                    onClick={() => setShowLogin(true)}
                    sx={{
                        borderRadius: '12px',
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        ...(showLogin
                            ? {
                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                            }
                            : {
                                borderColor: 'rgba(168,85,247,0.3)',
                                color: 'rgba(255,255,255,0.6)',
                                '&:hover': { borderColor: '#a855f7', color: '#a855f7' },
                            }),
                        transition: 'all 0.3s ease',
                    }}
                >
                    Login
                </Button>
                <Button
                    variant={!showLogin ? 'contained' : 'outlined'}
                    startIcon={<PersonAdd />}
                    onClick={() => setShowLogin(false)}
                    sx={{
                        borderRadius: '12px',
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        ...(!showLogin
                            ? {
                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                            }
                            : {
                                borderColor: 'rgba(168,85,247,0.3)',
                                color: 'rgba(255,255,255,0.6)',
                                '&:hover': { borderColor: '#a855f7', color: '#a855f7' },
                            }),
                        transition: 'all 0.3s ease',
                    }}
                >
                    Register
                </Button>
            </Box>

            {/* Form card */}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    width: { xs: '95%', sm: 440 },
                    background:
                        'linear-gradient(145deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.08) 50%, rgba(15,15,25,0.95) 100%)',
                    backdropFilter: 'blur(20px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                    borderRadius: '20px',
                    p: 4,
                    border: '1px solid rgba(168,85,247,0.15)',
                    transition: 'all 0.4s ease',
                }}
            >
                {showLogin ? (
                    <EventLogin />
                ) : (
                    <EventRegister onRegisterSuccess={() => setShowLogin(true)} />
                )}
            </Box>

            {/* Footer link */}
            <Typography
                variant="body2"
                sx={{ mt: 3, color: 'rgba(255,255,255,0.35)', position: 'relative', zIndex: 1 }}
            >
                {showLogin ? "Don't have an account? " : 'Already registered? '}
                <Box
                    component="span"
                    onClick={() => setShowLogin(!showLogin)}
                    sx={{
                        color: '#a855f7',
                        cursor: 'pointer',
                        fontWeight: 600,
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    {showLogin ? 'Register here' : 'Login here'}
                </Box>
            </Typography>
        </Box>
    );
}

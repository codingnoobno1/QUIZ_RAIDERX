'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useEventUserStore from '@/store/useEventUserStore';
import {
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress,
    Alert,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';

export default function EventLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const setUser = useEventUserStore((s) => s.setUser);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save to event user store
            setUser(data.user, data.loginTime);
            router.replace('/event/dashboard');
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography
                variant="h5"
                fontWeight={700}
                textAlign="center"
                mb={3}
                sx={{
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
            >
                Event Login
            </Typography>

            <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                margin="normal"
                variant="outlined"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Email sx={{ color: 'rgba(255,255,255,0.5)' }} />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(168,85,247,0.5)' },
                        '&.Mui-focused fieldset': { borderColor: '#a855f7' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#a855f7' },
                }}
            />

            <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                margin="normal"
                variant="outlined"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Lock sx={{ color: 'rgba(255,255,255,0.5)' }} />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(168,85,247,0.5)' },
                        '&.Mui-focused fieldset': { borderColor: '#a855f7' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#a855f7' },
                }}
            />

            {error && (
                <Alert severity="error" sx={{ mt: 2, bgcolor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {error}
                </Alert>
            )}

            <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                    mt: 3,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #6d28d9, #9333ea)',
                        boxShadow: '0 6px 30px rgba(124,58,237,0.6)',
                        transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.3s ease',
                }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In →'}
            </Button>
        </Box>
    );
}

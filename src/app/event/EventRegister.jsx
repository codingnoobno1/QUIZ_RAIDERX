'use client';

import { useState } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress,
    Alert,
    InputAdornment,
    IconButton,
    Grid,
} from '@mui/material';
import {
    Person,
    Email,
    Lock,
    Visibility,
    VisibilityOff,
    Badge,
    School,
    CalendarMonth,
} from '@mui/icons-material';

export default function EventRegister({ onRegisterSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        enrollmentNumber: '',
        course: '',
        semester: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const { name, enrollmentNumber, course, semester, email, password, confirmPassword } = formData;

        if ([name, enrollmentNumber, course, semester, email, password, confirmPassword].some((f) => f.trim() === '')) {
            setError('All fields are required');
            setLoading(false);
            return;
        }

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');

            setSuccess('Registered successfully! Switching to login...');
            setTimeout(() => {
                if (onRegisterSuccess) onRegisterSuccess();
            }, 1500);
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            color: '#fff',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            '&:hover fieldset': { borderColor: 'rgba(168,85,247,0.5)' },
            '&.Mui-focused fieldset': { borderColor: '#a855f7' },
        },
        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#a855f7' },
    };

    const iconColor = 'rgba(255,255,255,0.5)';

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography
                variant="h5"
                fontWeight={700}
                textAlign="center"
                mb={2}
                sx={{
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
            >
                Event Registration
            </Typography>

            <TextField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                margin="dense"
                variant="outlined"
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: iconColor }} /></InputAdornment> }}
                sx={fieldSx}
            />

            <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
                margin="dense"
                variant="outlined"
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: iconColor }} /></InputAdornment> }}
                sx={fieldSx}
            />

            <Grid container spacing={1}>
                <Grid item xs={6}>
                    <TextField
                        label="Enrollment No."
                        name="enrollmentNumber"
                        value={formData.enrollmentNumber}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="dense"
                        variant="outlined"
                        size="small"
                        InputProps={{ startAdornment: <InputAdornment position="start"><Badge sx={{ color: iconColor }} /></InputAdornment> }}
                        sx={fieldSx}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Course"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="dense"
                        variant="outlined"
                        size="small"
                        InputProps={{ startAdornment: <InputAdornment position="start"><School sx={{ color: iconColor }} /></InputAdornment> }}
                        sx={fieldSx}
                    />
                </Grid>
            </Grid>

            <TextField
                label="Semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                fullWidth
                required
                margin="dense"
                variant="outlined"
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonth sx={{ color: iconColor }} /></InputAdornment> }}
                sx={fieldSx}
            />

            <Grid container spacing={1}>
                <Grid item xs={6}>
                    <TextField
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="dense"
                        variant="outlined"
                        size="small"
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: iconColor }} /></InputAdornment>,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)} sx={{ color: iconColor }}>
                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={fieldSx}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Confirm Password"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="dense"
                        variant="outlined"
                        size="small"
                        InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: iconColor }} /></InputAdornment> }}
                        sx={fieldSx}
                    />
                </Grid>
            </Grid>

            {error && (
                <Alert severity="error" sx={{ mt: 1.5, bgcolor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mt: 1.5, bgcolor: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                    {success}
                </Alert>
            )}

            <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                    mt: 2,
                    py: 1.3,
                    fontWeight: 700,
                    fontSize: '0.95rem',
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
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account →'}
            </Button>
        </Box>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, TextField, Typography, Paper, Container } from '@mui/material';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        enrollmentNumber: '',
        course: 'B.Tech',
        semester: '1',
        adminSecret: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Admin registered successfully! Redirecting...');
                setTimeout(() => router.push('/'), 1500);
            } else {
                toast.error(data.error || 'Registration failed');
            }
        } catch (error) {
            toast.error('Registration error');
        } finally {
            setLoading(false);
        }
    };

    const textFieldSx = {
        '& .MuiOutlinedInput-root': {
            color: '#fff',
            bgcolor: 'rgba(255,255,255,0.05)',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#00FFFF' }
        },
        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#00FFFF' }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#050505',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #111 0%, #000 100%)',
            py: 4
        }}>
            <Container maxWidth="xs">
                <Paper
                    elevation={24}
                    sx={{
                        p: 4,
                        bgcolor: '#111',
                        color: '#fff',
                        border: '1px solid rgba(0, 255, 255, 0.1)',
                        borderRadius: 2,
                        boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)'
                    }}
                >
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff', mb: 1 }}>
                            Create Admin Account
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Register new administrator access
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Full Name"
                            variant="outlined"
                            margin="normal"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            sx={textFieldSx}
                        />
                        <TextField
                            fullWidth
                            label="Email Address"
                            variant="outlined"
                            margin="normal"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            sx={textFieldSx}
                        />
                        <TextField
                            fullWidth
                            label="Enrollment ID"
                            variant="outlined"
                            margin="normal"
                            value={formData.enrollmentNumber}
                            onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                            sx={textFieldSx}
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            sx={textFieldSx}
                        />
                        <TextField
                            fullWidth
                            label="Master Admin Secret"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            value={formData.adminSecret}
                            onChange={(e) => setFormData({ ...formData, adminSecret: e.target.value })}
                            sx={{
                                ...textFieldSx,
                                '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#FF1493' },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#FF1493' }
                            }}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            type="submit"
                            disabled={loading}
                            sx={{
                                mt: 3,
                                py: 1.5,
                                bgcolor: '#00FFFF',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#00cccc', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 255, 255, 0.3)' },
                                transition: 'all 0.2s'
                            }}
                        >
                            {loading ? 'Registering...' : 'Register Account'}
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
}

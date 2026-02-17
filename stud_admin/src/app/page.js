'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, TextField, Typography, Paper, Container, Tabs, Tab } from '@mui/material';
import { toast } from 'react-hot-toast';
import { signIn } from 'next-auth/react';

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Register
  const [loading, setLoading] = useState(false);

  // Login State
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register State
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    enrollmentNumber: '',
    course: 'B.Tech',
    semester: '1',
    adminSecret: ''
  });

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: loginData.email,
        password: loginData.password,
      });

      if (result.error) {
        toast.error('Invalid credentials');
      } else {
        toast.success('Login Successful');
        router.refresh();
        router.push('/stud_admin');
      }
    } catch (error) {
      toast.error('Login error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Registration Successful! Please login.');
        setTab(0); // Switch to login tab
        setLoginData({ email: registerData.email, password: '' }); // Pre-fill email
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
      background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 50%, #00BCD4 100%)', // Vibrant Blue Gradient
      py: 4
    }}>
      <Container maxWidth="xs">
        <Paper
          elevation={24}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.95)', // Light, high visibility
            backdropFilter: 'blur(10px)',
            color: '#1A237E', // Dark Blue text for contrast
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              '& .MuiTab-root': { color: '#0D47A1', fontWeight: 'bold' },
              '& .Mui-selected': { color: '#00BCD4' },
              '& .MuiTabs-indicator': { bgcolor: '#00BCD4', height: 4 }
            }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: '800', color: '#1A237E', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                {tab === 0 ? 'Welcome Back' : 'Join Admin Team'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#555' }}>
                {tab === 0 ? 'Access the admin dashboard' : 'Create your admin account'}
              </Typography>
            </Box>

            {/* LOGIN FORM */}
            {tab === 0 && (
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  margin="normal"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#ccc' },
                      '&:hover fieldset': { borderColor: '#0D47A1' },
                      '&.Mui-focused fieldset': { borderColor: '#00BCD4' }
                    },
                    '& .MuiInputLabel-root': { color: '#666' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#00BCD4' }
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#ccc' },
                      '&:hover fieldset': { borderColor: '#0D47A1' },
                      '&.Mui-focused fieldset': { borderColor: '#00BCD4' }
                    },
                    '& .MuiInputLabel-root': { color: '#666' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#00BCD4' }
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{
                    mt: 3, py: 1.5,
                    background: 'linear-gradient(45deg, #0D47A1 30%, #00BCD4 90%)',
                    color: '#fff', fontWeight: 'bold',
                    boxShadow: '0 3px 5px 2px rgba(13, 71, 161, .3)',
                    '&:hover': { background: 'linear-gradient(45deg, #0D47A1 60%, #00BCD4 90%)', transform: 'scale(1.02)' },
                    transition: 'all 0.2s'
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </form>
            )}

            {/* REGISTER FORM */}
            {tab === 1 && (
              <form onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="outlined"
                  margin="normal"
                  size="small"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#ccc' },
                      '&:hover fieldset': { borderColor: '#0D47A1' },
                      '&.Mui-focused fieldset': { borderColor: '#00BCD4' }
                    },
                    '& .MuiInputLabel-root': { color: '#666' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#00BCD4' }
                  }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  margin="normal"
                  size="small"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#ccc' },
                      '&:hover fieldset': { borderColor: '#0D47A1' },
                      '&.Mui-focused fieldset': { borderColor: '#00BCD4' }
                    },
                    '& .MuiInputLabel-root': { color: '#666' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#00BCD4' }
                  }}
                />
                <TextField
                  fullWidth
                  label="Enrollment ID"
                  variant="outlined"
                  margin="normal"
                  size="small"
                  value={registerData.enrollmentNumber}
                  onChange={(e) => setRegisterData({ ...registerData, enrollmentNumber: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#ccc' },
                      '&:hover fieldset': { borderColor: '#0D47A1' },
                      '&.Mui-focused fieldset': { borderColor: '#00BCD4' }
                    },
                    '& .MuiInputLabel-root': { color: '#666' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#00BCD4' }
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  size="small"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#ccc' },
                      '&:hover fieldset': { borderColor: '#0D47A1' },
                      '&.Mui-focused fieldset': { borderColor: '#00BCD4' }
                    },
                    '& .MuiInputLabel-root': { color: '#666' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#00BCD4' }
                  }}
                />
                <TextField
                  fullWidth
                  label="Admin Secret"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  size="small"
                  value={registerData.adminSecret}
                  onChange={(e) => setRegisterData({ ...registerData, adminSecret: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#ccc' },
                      '&:hover fieldset': { borderColor: '#e91e63' }, // Pink hover
                      '&.Mui-focused fieldset': { borderColor: '#e91e63' }
                    },
                    '& .MuiInputLabel-root': { color: '#666' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#e91e63' }
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{
                    mt: 3, py: 1.5,
                    background: 'linear-gradient(45deg, #0D47A1 30%, #00BCD4 90%)',
                    color: '#fff', fontWeight: 'bold',
                    boxShadow: '0 3px 5px 2px rgba(13, 71, 161, .3)',
                    '&:hover': { background: 'linear-gradient(45deg, #0D47A1 60%, #00BCD4 90%)', transform: 'scale(1.02)' },
                    transition: 'all 0.2s'
                  }}
                >
                  {loading ? 'Processing...' : 'Create Account'}
                </Button>
              </form>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

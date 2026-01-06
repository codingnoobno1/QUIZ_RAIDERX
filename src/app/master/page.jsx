'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
} from '@mui/material';

export default function MasterLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    const result = await signIn('MasterCredentials', {
      redirect: false,
      username,
      password,
      callbackUrl: '/master/dashboard',
    });

    if (result.error) {
      setError(result.error);
    } else {
      window.location.href = result.url;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a5a 0%, #2a4a7a 100%)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 4,
          width: { xs: '90%', sm: '400px' },
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          color: 'white',
        }}
      >
        <Typography variant="h4" fontWeight="bold" mb={4} textAlign="center">
          Master Login
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          fullWidth
          label="Username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 2 }}
          InputLabelProps={{ sx: { color: 'white' } }}
          InputProps={{ sx: { color: 'white' } }}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 3 }}
          InputLabelProps={{ sx: { color: 'white' } }}
          InputProps={{ sx: { color: 'white' } }}
        />

        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleLogin}
          sx={{ py: 1.5 }}
        >
          Login
        </Button>
      </Paper>
    </Box>
  );
}

'use client';
import { useState } from 'react';
import RegisterPage from '../Register';
import LoginPage from '../Login';
import { Box, Button, Typography } from '@mui/material';

function HomePage() {
  const [showLogin, setShowLogin] = useState(true);

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  return (
    <Box
      sx={{
        backgroundImage: 'url(https://png.pngtree.com/background/20231030/original/pngtree-illustrated-3d-rendering-of-a-vibrant-red-circuit-board-background-picture-image_5786294.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 4,
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          color="white"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            mb: 4,
          }}
        >
          Welcome to Pixel Quiz Raiderx
        </Typography>

        <Button
          variant="contained"
          onClick={toggleForm}
          sx={{
            marginBottom: 3,
            backgroundColor: '#7b2cbf',
            '&:hover': { backgroundColor: '#5a189a' },
            boxShadow: '0px 4px 20px rgba(123,44,191,0.8)',
          }}
        >
          {showLogin ? 'Go to Register' : 'Go to Login'}
        </Button>

        <Box
          sx={{
            background:
              'linear-gradient(145deg, rgba(123,44,191,0.35) 0%, rgba(72,61,139,0.35) 100%)',
            backdropFilter: 'blur(15px) saturate(150%)',
            WebkitBackdropFilter: 'blur(15px) saturate(150%)',
            boxShadow: '0 8px 32px 0 rgba(58, 12, 163, 0.45)',
            borderRadius: '25px',
            padding: 4,
            width: { xs: '90%', sm: '400px' },
            border: '1px solid rgba(255, 255, 255, 0.3)',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          {showLogin ? <LoginPage /> : <RegisterPage />}
        </Box>
      </Box>
    </Box>
  );
}

export default HomePage;

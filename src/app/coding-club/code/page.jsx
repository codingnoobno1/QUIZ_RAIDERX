'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from '@/components/Sidebar';
import CodeEditorSection from '@/components/code/CodeEditorSection';

// Metallic texture background style
const MetallicPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
  border: '1px solid #4f4f4f',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.8)',
  padding: theme.spacing(4),
  borderRadius: '16px',
}));

export default function Page() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Check for authentication
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      window.location.href = '/';
    }
  }, []);

  const handleSubmit = () => {
    // Simulate code submission
    setNotification({
      open: true,
      message: 'Solution submitted successfully! It will be evaluated shortly.',
      severity: 'success'
    });
    
    // Here you would typically send the code to a backend for evaluation
    console.log('Submitted Code:', code);
    console.log('Selected Language:', language);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'black' }}>
      {/* Sidebar Section */}
      <Box
        component="aside"
        sx={{
          width: { xs: '60px', sm: '240px' },
          backgroundColor: '#111',
          height: '100vh',
          position: 'fixed',
          overflowY: 'auto',
          borderRight: '1px solid #1e1e1e',
        }}
      >
        <Sidebar />
      </Box>

      {/* Main Content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          ml: { xs: '60px', sm: '240px' },
          p: { xs: 2, sm: 4 },
        }}
      >
        {/* Editor Section */}
        <MetallicPaper elevation={8}>
          <CodeEditorSection
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            onSubmit={handleSubmit}
          />
        </MetallicPaper>

        {/* Submission Notification */}
        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

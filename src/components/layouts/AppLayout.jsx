
'use client';

import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import AppSidebar from './AppSidebar';

export default function AppLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      <AppSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${isSidebarOpen ? 250 : 72}px)`,
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backgroundColor: '#121212', // Dark theme for main content area
          color: 'white',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

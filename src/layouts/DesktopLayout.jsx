'use client';

import { useState, useEffect } from 'react';
import {
  useTheme,
  useMediaQuery,
  Box,
  IconButton,
  AppBar,
  Toolbar,
  Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import Sidebar from '@/components/Sidebar';

export default function Layout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Handle sidebar state on screen resize
  useEffect(() => {
    setSidebarOpen(!isMobile); // Open on desktop, closed on mobile
  }, [isMobile]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    
      <Box sx={{ display: 'flex', bgcolor: '#000', height: '100dvh', width: '100vw' }}>
        {/* Sidebar */}
        <Sidebar
          isExpanded={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          onLinkClick={() => isMobile && setSidebarOpen(false)}
          isMobile={isMobile}
        />

        {/* Top AppBar (Mobile Only) */}
        {isMobile && (
          <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: '#111' }}>
            <Toolbar>
              <IconButton color="inherit" edge="start" onClick={toggleSidebar}>
                <MenuIcon />
              </IconButton>
              <Typography
                variant="h6"
                sx={{ ml: 2, color: '#00FFCC', fontWeight: 600, flexGrow: 1 }}
              >
                PIXEL Club Dashboard
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            pt: isMobile ? 8 : 4,
            px: { xs: 2, sm: 3, md: 4 },
            width: '100%',
            minHeight: '100dvh',
            overflowY: 'auto',
            ml: !isMobile ? (isSidebarOpen ? '240px' : '72px') : 0,
            transition: 'margin 0.3s ease',
            color: '#fff',
          }}
        >
          {children}
        </Box>
      </Box>
    
  );
}

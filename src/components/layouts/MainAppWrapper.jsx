'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import UserSidebar from '@/components/UserSidebar';
import Topbar from '@/components/Topbar';
import { LayoutDashboard, ClipboardCheck, User, Code, FolderKanban, FileText, Calendar, Notebook } from 'lucide-react';

// Pages where the main layout (including sidebar) should NOT be shown
// These are public pages accessible without login OR pages with their own layout
const NO_LAYOUT_PAGES = [
  '/',
  '/login',
  '/Login',
  '/Register',
  '/event',
  '/coding-club',
  '/our-team',
  '/submit-research',
  '/submit-project',
  '/research-papers',
  '/request-research',
  '/projects',
];

// Additional check for routes that have their own layout
const hasOwnLayout = (pathname) => {
  // Routes that have their own ResponsiveLayout with the cube Sidebar
  // 1. [user] dynamic routes (single-segment paths like /welcome)
  // 2. /coding-club/* routes (have ResponsiveLayout in their layout.jsx)
  // 3. /event/* routes (have their own fullscreen layout)
  const segments = pathname.split('/').filter(Boolean);

  // Single-segment paths (like /welcome, /username) go to [user] route
  if (segments.length === 1 && !NO_LAYOUT_PAGES.includes(pathname)) {
    return true;
  }

  // /coding-club/* routes have their own ResponsiveLayout with cube sidebar
  if (pathname.startsWith('/coding-club/')) {
    return true;
  }

  // /event/* routes have their own fullscreen layout
  if (pathname.startsWith('/event/')) {
    return true;
  }

  return false;
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/coding-club/dashboard' },
  { id: 'quiz', label: 'Quiz', icon: ClipboardCheck, path: '/coding-club/quiz' },
  { id: 'profile', label: 'Your Profile', icon: User, path: '/coding-club/profile' },
  { id: 'code', label: 'Code Snippets', icon: Code, path: '/coding-club/code' },
  { id: 'projects', label: 'Your Projects', icon: FolderKanban, path: '/coding-club/projects' },
  { id: 'solutions', label: 'Coding Solutions', icon: FileText, path: '/coding-club/solutions' },
  { id: 'events', label: 'Events', icon: Calendar, path: '/coding-club/events' },
  { id: 'notes', label: 'Notes', icon: Notebook, path: '/coding-club/notes' },
  { id: 'admin_dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin_dashboard' },
];

export default function MainAppWrapper({ children }) {
  const pathname = usePathname();

  // Don't show the sidebar and main layout on:
  // 1. Explicitly listed pages (login, register, public pages)
  // 2. Pages that have their own layout (like [user] dynamic routes)
  if (NO_LAYOUT_PAGES.includes(pathname) || hasOwnLayout(pathname)) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0b0b0b' }}>
      <CssBaseline />

      {/* SIDEBAR FIXED WIDTH 240px */}
      <Box
        component="aside"
        sx={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid #1f1f1f',
          bgcolor: '#0d0d0d',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 1200,
        }}
      >
        <UserSidebar routes={navItems} title="Pixel Club" />
      </Box>

      {/* MAIN AREA */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <Topbar />

        {/* CONTENT */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 0,
            px: 2.5, // Enterprise padding
            py: 2,
            width: '100%',
            overflowY: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

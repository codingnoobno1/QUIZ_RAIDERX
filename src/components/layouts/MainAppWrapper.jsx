'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import UserSidebar from '@/components/UserSidebar';
import { LayoutDashboard, ClipboardCheck, User, Code, FolderKanban, FileText, Calendar, Notebook } from 'lucide-react';

// Pages where the main layout (including sidebar) should NOT be shown
// These are public pages accessible without login OR pages with their own layout
const NO_LAYOUT_PAGES = [
  '/',
  '/login',
  '/Login',
  '/Register',
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
  const segments = pathname.split('/').filter(Boolean);

  // Single-segment paths (like /welcome, /username) go to [user] route
  if (segments.length === 1 && !NO_LAYOUT_PAGES.includes(pathname)) {
    return true;
  }

  // /coding-club/* routes have their own ResponsiveLayout with cube sidebar
  if (pathname.startsWith('/coding-club/')) {
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
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#121212' }}>
      <CssBaseline />

      <UserSidebar routes={navItems} title="Pixel Club" />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - 260px)`,
          color: 'white',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

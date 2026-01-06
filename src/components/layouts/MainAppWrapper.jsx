'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Box, CssBaseline } from '@mui/material';
import UserSidebar from '@/components/UserSidebar';
import { LayoutDashboard, ClipboardCheck, User, Code, FolderKanban, FileText, Calendar, Notebook } from 'lucide-react';

// Pages where the main layout (including sidebar) should NOT be shown
const NO_LAYOUT_PAGES = ['/', '/login', '/Login', '/Register', '/coding-club'];

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

  // Don't show the sidebar and main layout on login/register pages
  // For debugging, you can uncomment the line below to see the current pathname
  // console.log('Current pathname:', pathname);
  if (NO_LAYOUT_PAGES.some(p => pathname.startsWith(p))) {
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

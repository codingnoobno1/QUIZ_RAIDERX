'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Quiz as QuizIcon,
  AccountCircle as ProfileIcon,
  Code as CodeIcon,
  Description as ProjectIcon,
  Terminal as SolutionIcon,
  Menu as MenuIcon,
  ChevronLeft as CollapseIcon,
    Event as EventIcon, // Import the Event icon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/coding-club/dashboard' },
  { text: 'Quiz', icon: <QuizIcon />, path: '/coding-club/quiz' },
  { text: 'Your Profile', icon: <ProfileIcon />, path: '/coding-club/profile' },
  { text: 'Code Snippets', icon: <CodeIcon />, path: '/coding-club/code' },
  { text: 'Your Projects', icon: <ProjectIcon />, path: '/coding-club/projects' },
  { text: 'Coding Solutions', icon: <SolutionIcon />, path: '/coding-club/solutions' },
  { text: 'Events', icon: <EventIcon />, path: '/coding-club/events' }, // New "Events" tab
];

export default function Sidebar({ isExpanded, toggleSidebar }) {
  const pathname = usePathname();

  return (
    <motion.div
      animate={{ width: isExpanded ? 240 : 80 }}
      transition={{ duration: 0.3 }}
      style={{
        height: '100vh',
        background: 'linear-gradient(135deg, #2f2f2f, #1e1e1e)',
        color: 'white',
        boxShadow: '4px 0 10px rgba(0,0,0,0.3)',
        borderRight: '1px solid #555',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          px: 2,
          py: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#ccc',
            fontWeight: 700,
            letterSpacing: 1,
            display: isExpanded ? 'block' : 'none',
          }}
        >
          PIXEL CLUB
        </Typography>
        <IconButton onClick={toggleSidebar} sx={{ color: '#ccc' }}>
          {isExpanded ? <CollapseIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: '#444', mb: 1 }} />

      <List>
        {navItems.map(({ text, icon, path }) => (
          <ListItemButton
            key={text}
            component={Link}
            href={path}
            selected={pathname === path}
            sx={{
              borderRadius: '8px',
              mb: 1,
              px: 2,
              backgroundColor: pathname === path ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.12)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid #888',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#bbb', minWidth: 40 }}>{icon}</ListItemIcon>
            {isExpanded && (
              <ListItemText
                primary={text}
                primaryTypographyProps={{
                  fontWeight: 600,
                  sx: {
                    color: '#eee',
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            )}
          </ListItemButton>
        ))}
      </List>
    </motion.div>
  );
}

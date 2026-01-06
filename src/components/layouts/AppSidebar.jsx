
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
} from '@mui/icons-material';

// Simplified and corrected navigation items
const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' }, // Assuming [user] is the dashboard
  { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
  { text: 'Quizzes', icon: <QuizIcon />, path: '/quizmode' },
  { text: 'Projects', icon: <ProjectIcon />, path: '/projects' },
  { text: 'Code', icon: <CodeIcon />, path: '/code' },
  { text: 'Solutions', icon: <SolutionIcon />, path: '/solutions' },
];

export default function AppSidebar({ isOpen, toggleSidebar }) {
  const pathname = usePathname();

  return (
    <Box
      component="nav"
      sx={{
        width: isOpen ? 250 : 72,
        flexShrink: 0,
        transition: (theme) => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        height: '100vh',
        backgroundColor: '#1e1e1e',
        color: 'white',
        overflowX: 'hidden',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center', px: 2, py: 1.5 }}>
        {isOpen && (
          <Typography variant="h6" sx={{ color: '#ccc', fontWeight: 700 }}>
            QUIZ RAIDER X
          </Typography>
        )}
        <IconButton onClick={toggleSidebar} sx={{ color: '#ccc' }} size="small">
          {isOpen ? <CollapseIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: '#444', mb: 1 }} />

      <List sx={{ px: 1 }}>
        {navItems.map(({ text, icon, path }) => (
          <ListItemButton
            key={text}
            component={Link}
            href={path}
            selected={pathname === path}
            sx={{
              borderRadius: 2,
              mb: 1,
              minHeight: 48,
              backgroundColor: pathname === path ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(0, 255, 204, 0.2)',
                borderRight: '4px solid #00FFCC',
                color: '#00FFCC',
                '& .MuiListItemIcon-root': {
                  color: '#00FFCC',
                }
              },
            }}
          >
            <ListItemIcon sx={{ color: '#bbb', minWidth: 40 }}>{icon}</ListItemIcon>
            {isOpen && (
              <ListItemText
                primary={text}
                primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem', color: '#eee' }}
              />
            )}
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

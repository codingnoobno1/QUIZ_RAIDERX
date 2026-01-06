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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LayoutDashboard,
  HelpCircle,
  User,
  Code,
  Folder,
  Lightbulb,
  Calendar,
  Notebook,
  Menu,
  ChevronLeft,
} from 'lucide-react';
import dynamic from 'next/dynamic';
const RotatingCube = dynamic(() => import('./RotatingCube'), { ssr: false }); // Re-add RotatingCube import
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react'; // Import useState and useEffect

const navItems = [
  { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/coding-club/dashboard' },
  { text: 'Quiz', icon: <HelpCircle size={20} />, path: '/coding-club/quiz' },
  { text: 'Your Profile', icon: <User size={20} />, path: '/coding-club/profile' },
  { text: 'Code Snippets', icon: <Code size={20} />, path: '/coding-club/code' },
  { text: 'Your Projects', icon: <Folder size={20} />, path: '/coding-club/projects' },
  { text: 'Coding Solutions', icon: <Lightbulb size={20} />, path: '/coding-club/solutions' },
  { text: 'Events', icon: <Calendar size={20} />, path: '/coding-club/events' },
  { text: 'Notes', icon: <Notebook size={20} />, path: '/coding-club/notes' },
];

const accentColors = ['#61dafb', '#a2fac3', '#ffc600', '#ff6b6b', '#be95ff', '#50fa7b', '#ff79c6'];

export default function Sidebar({ isExpanded = true, toggleSidebar, onLinkClick = () => { } }) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentAccentColor, setCurrentAccentColor] = useState('#61dafb'); // Default to cyan

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * accentColors.length);
    setCurrentAccentColor(accentColors[randomIndex]);
  }, []); // Run once on mount

  return (
    <motion.div
      animate={{ width: isExpanded ? 240 : 72 }}
      transition={{ duration: 0.3 }}
      style={{
        height: '100vh',
        backgroundColor: '#282c34', // Softer dark background
        color: 'white',
        boxShadow: '2px 0 6px rgba(0,0,0,0.2)',
        borderRight: '1px solid #333',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        zIndex: 1300,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        {isExpanded && (
          <Typography variant="h5" sx={{ color: currentAccentColor, fontWeight: 700 }}> {/* Dynamic color for title */}
            PIXEL CLUB
          </Typography>
        )}
        <IconButton onClick={toggleSidebar} sx={{ color: currentAccentColor }} size="small"> {/* Dynamic color for icon */}
          {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: '#444', mb: 1 }} />

      {/* Rotating Cube */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <RotatingCube size={40} sidebar={isExpanded} />
      </Box>

      <List sx={{ px: 0 }}>
        {navItems.map(({ text, icon, path }) => (
          <ListItemButton
            key={text}
            component={Link}
            href={path}
            onClick={isMobile ? onLinkClick : undefined}
            selected={pathname === path}
            sx={{
              borderRadius: 0.5,
              mx: 0,
              mb: 0.5,
              minHeight: 48,
              backgroundColor: pathname === path ? `${currentAccentColor}33` : 'transparent', // Dynamic color with transparency
              '&:hover': {
                backgroundColor: `${currentAccentColor}14`, // Dynamic color with transparency
              },
              '&.Mui-selected': {
                backgroundColor: `${currentAccentColor}40`, // Dynamic color with transparency
                borderLeft: `3px solid ${currentAccentColor}`, // Dynamic color for border
                color: currentAccentColor, // Dynamic color for text
              },
            }}
          >
            <ListItemIcon sx={{ color: pathname === path ? currentAccentColor : '#bbb', minWidth: 36 }}>{icon}</ListItemIcon> {/* Dynamic color for icon */}
            {isExpanded && (
              <ListItemText
                primary={text}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  color: pathname === path ? currentAccentColor : '#eee', // Dynamic color for text
                }}
              />
            )}
          </ListItemButton>
        ))
        }
      </List>
    </motion.div>
  );
}


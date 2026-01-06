'use client';

import React from 'react';
import { AppBar, Toolbar, Button, Box, Typography, useTheme } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ProjectNavbar = () => {
  const theme = useTheme();
  const pathname = usePathname();

  const navItems = [
    { name: 'My Projects', path: '/coding-club/projects?tab=my' },
    { name: 'All Projects', path: '/coding-club/projects?tab=all' },
    { name: 'Research Papers', path: '/coding-club/projects?tab=research' },
    { name: 'My Research', path: '/coding-club/projects?tab=myresearch' },
    { name: 'Course Projects', path: '/coding-club/projects?tab=course' },
    { name: 'Internship Form', path: '/coding-club/projects?tab=internship' },
  ];

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        mb: 4,
        borderRadius: theme.shape.borderRadius,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent dark background
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: { xs: 1, sm: 2 },
          py: { xs: 1, sm: 1.5 },
        }}
      >
        {navItems.map((item) => (
          <Button
            key={item.name}
            component={Link}
            href={item.path}
            sx={{
              color: pathname === item.path ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: pathname === item.path ? 'bold' : 'normal',
              textTransform: 'none',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 },
              py: { xs: 0.5, sm: 0.75 },
              borderRadius: theme.shape.borderRadius,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: theme.palette.primary.light,
              },
            }}
          >
            {item.name}
          </Button>
        ))}
      </Toolbar>
    </AppBar>
  );
};

export default ProjectNavbar;

'use client';

import React from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const ProjectNavbar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'all';

  const navItems = [
    { name: 'My Projects', tab: 'my' },
    { name: 'All Projects', tab: 'all' },
    { name: 'Research Papers', tab: 'research' },
    { name: 'My Research', tab: 'myresearch' },
    { name: 'Course Projects', tab: 'course' },
    { name: 'Internship Form', tab: 'internship' },
  ];

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        mb: 4,
        borderRadius: 2,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
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
        {navItems.map((item) => {
          const isActive = currentTab === item.tab;
          return (
            <Button
              key={item.name}
              component={Link}
              href={`/coding-club/projects?tab=${item.tab}`}
              sx={{
                color: isActive ? '#00FFFF' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: isActive ? 'bold' : 'normal',
                textTransform: 'none',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 0.75 },
                borderRadius: 2,
                borderBottom: isActive ? '2px solid #00FFFF' : 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#00FFFF',
                },
              }}
            >
              {item.name}
            </Button>
          );
        })}
      </Toolbar>
    </AppBar>
  );
};

export default ProjectNavbar;

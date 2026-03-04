'use client';

import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const ProjectNavbar = () => {
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
    <Box
      sx={{
        display: 'flex',
        justifyContent: { xs: 'flex-start', md: 'center' },
        alignItems: 'center',
        overflowX: 'auto',
        pb: 2,
        mb: 4,
        gap: 1.5,
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          p: 1,
          background: 'rgba(2, 6, 23, 0.4)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {navItems.map((item) => {
          const isActive = currentTab === item.tab;
          return (
            <Box key={item.tab} sx={{ position: 'relative' }}>
              <Button
                component={Link}
                href={`/coding-club/projects?tab=${item.tab}`}
                sx={{
                  color: isActive ? '#f8fafc' : 'rgba(148, 163, 184, 0.6)',
                  fontWeight: isActive ? 700 : 500,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  px: 3,
                  py: 1,
                  borderRadius: '14px',
                  transition: 'all 0.3s ease',
                  zIndex: 1,
                  '&:hover': {
                    color: '#00FFFF',
                    backgroundColor: 'transparent',
                  },
                }}
              >
                {item.name}
              </Button>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 255, 255, 0.15)',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    borderRadius: '14px',
                    boxShadow: '0 0 15px rgba(0, 255, 255, 0.1)',
                    zIndex: 0,
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ProjectNavbar;

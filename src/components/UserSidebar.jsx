'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function UserSidebar({
  routes = [],
  title = 'PIXEL',
}) {
  const pathname = usePathname();

  return (
    <Box
      component="aside"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        py: 3, // Industry standard padding
        px: 2, // Industry standard padding
      }}
    >
      <Box sx={{ mb: 4, px: 2 }}>
        <Typography
          variant="h6"
          fontWeight="700"
          sx={{
            letterSpacing: 1,
            color: '#ededed',
            fontSize: '1.1rem',
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {routes.map(({ id, label, icon: Icon, path }) => {
          const isActive = pathname === path;
          return (
            <Link key={id} href={path} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5, // Industry standard gap 12px
                  px: 2, // Industry standard inner padding 16px
                  py: 1.2, // Industry standard vertical padding ~10px
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: isActive ? '#1a1a1a' : 'transparent',
                  color: isActive ? '#ffffff' : '#a1a1a1',
                  transition: 'background-color 0.2s, color 0.2s',
                  '&:hover': {
                    bgcolor: '#1a1a1a',
                    color: '#ffffff',
                  },
                }}
              >
                <Icon size={18} />
                <Typography
                  sx={{
                    fontSize: '0.875rem', // 14px industry standard
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {label}
                </Typography>
              </Box>
            </Link>
          );
        })}
      </Box>

      <Box sx={{ mt: 'auto', px: 2, pt: 2, borderTop: '1px solid #1f1f1f' }}>
        <Typography variant="caption" sx={{ color: '#555' }}>
          © {new Date().getFullYear()} Pixel Club
        </Typography>
      </Box>
    </Box>
  );
}

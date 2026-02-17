'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePathname } from 'next/navigation';
import { Bell, Search, User } from 'lucide-react';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';

export default function Topbar() {
    const pathname = usePathname();

    // Format pathname for display (e.g., /dashboard -> Dashboard)
    const getPageTitle = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) return 'Dashboard';

        // Get the last segment
        const lastSegment = segments[segments.length - 1];

        // Capitalize and replace hyphens
        return lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <Box
            component="header"
            sx={{
                height: 64,
                px: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #1f1f1f',
                bgcolor: '#0d0d0d', // Match sidebar or slightly lighter/darker depending on preference
                color: 'white',
                position: 'sticky',
                top: 0,
                zIndex: 1100, // Below sidebar z-index if it overlays, but here it's side-by-side
            }}
        >
            <Box>
                <Typography variant="h6" fontWeight="600" sx={{ color: '#ededed' }}>
                    {getPageTitle()}
                </Typography>
                {/* Optional: Breadcrumbs could go here */}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton sx={{ color: '#a1a1a1', '&:hover': { color: 'white', bgcolor: '#1a1a1a' } }}>
                    <Search size={20} />
                </IconButton>

                <IconButton sx={{ color: '#a1a1a1', '&:hover': { color: 'white', bgcolor: '#1a1a1a' } }}>
                    <Bell size={20} />
                </IconButton>

                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        bgcolor: '#1f1f1f',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '1px solid #333',
                        '&:hover': { borderColor: '#555' }
                    }}
                >
                    <User size={18} color="#ededed" />
                </Box>
            </Box>
        </Box>
    );
}

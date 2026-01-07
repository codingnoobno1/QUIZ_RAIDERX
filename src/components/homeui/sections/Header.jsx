'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Fade from '@mui/material/Fade';
import {
    Login as LoginIcon,
    Dashboard as DashboardIcon,
    Logout as LogoutIcon,
    AccountCircle as AccountIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import useUserStore from '@/store/useUserStore';
import { NeonButton } from './CommonUI';
import MagneticButton from '../animations/MagneticButton';

const Header = () => {
    const router = useRouter();
    const { user, logout } = useUserStore();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleLoginClick = () => {
        if (user) {
            router.push('/coding-club/dashboard');
        } else {
            router.push('/login');
        }
    };

    const handleProfileMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const menuItems = [
        { label: 'Events', id: 'events' },
        { label: 'Research', id: 'research' },
        { label: 'Projects', id: 'projects' },
        { label: 'Submit Research', link: '/submit-research' },
        { label: 'Our Team', link: '/our-team' },
        { label: 'Collaborate', id: 'collaborate' }
    ];

    return (
        <Box
            component="header"
            sx={{
                py: 2,
                px: { xs: 2, md: 6 },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                background: 'rgba(5, 5, 5, 0.8)',
                backdropFilter: 'blur(15px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <img src="/pixel.jpg" alt="PIXEL Logo" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #00FFFF' }} />
                <Typography variant="h5" sx={{ fontWeight: '900', letterSpacing: '3px', display: { xs: 'none', lg: 'block' }, fontFamily: "'Space Grotesk', sans-serif" }}>
                    PIXEL
                </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
                {menuItems.map((item) => (
                    <Typography
                        key={item.id || item.label}
                        variant="body1"
                        sx={{
                            cursor: 'pointer',
                            fontWeight: 500,
                            '&:hover': { color: '#00FFFF' },
                            transition: 'all 0.3s'
                        }}
                        onClick={() => {
                            if (item.link) {
                                router.push(item.link);
                            } else {
                                const element = document.getElementById(item.id);
                                element?.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                    >
                        {item.label}
                    </Typography>
                ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {user ? (
                    <>
                        <IconButton onClick={handleProfileMenu}>
                            <Avatar sx={{ bgcolor: '#00FFFF', color: '#000', fontWeight: 'bold' }}>
                                {user.name?.[0] || <AccountIcon />}
                            </Avatar>
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleCloseMenu}
                            TransitionComponent={Fade}
                            sx={{
                                '& .MuiPaper-root': {
                                    bgcolor: '#121212',
                                    color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    mt: 1.5,
                                },
                            }}
                        >
                            <MenuItem onClick={() => router.push('/coding-club/dashboard')}>
                                <DashboardIcon sx={{ mr: 1, fontSize: 20 }} /> Dashboard
                            </MenuItem>
                            <MenuItem onClick={() => { logout(); handleCloseMenu(); }}>
                                <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Logout
                            </MenuItem>
                        </Menu>
                    </>
                ) : (
                    <MagneticButton>
                        <NeonButton startIcon={<LoginIcon />} onClick={handleLoginClick}>
                            Attendee Login
                        </NeonButton>
                    </MagneticButton>
                )}
            </Box>
        </Box>
    );
};

export default Header;

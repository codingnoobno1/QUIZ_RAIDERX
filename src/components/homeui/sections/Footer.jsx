'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton } from '@mui/material';
import { GitHub, Twitter, LinkedIn, Instagram } from '@mui/icons-material';
import RevealSection from '../animations/RevealSection';
import LiveTerminalFeed from './LiveTerminalFeed';

const Footer = () => {
    return (
        <Box sx={{ py: 10, background: '#020202', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Container maxWidth="lg">
                <RevealSection>
                    <Grid container spacing={8}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="h4" sx={{ fontWeight: 900, mb: 3, letterSpacing: '4px', color: '#FF1493' }}>PIXEL</Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, lineHeight: 1.8 }}>
                                The ultimate community for tech innovators at PIET. We code, we build, we win. Join the elite.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {[GitHub, Twitter, LinkedIn, Instagram].map((Icon, i) => (
                                    <IconButton key={i} sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#00FFFF' } }}>
                                        <Icon />
                                    </IconButton>
                                ))}
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#00FFFF' }}>SYSTEM_LOGS</Typography>
                            <LiveTerminalFeed />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#00FFFF' }}>QUICK_ACCESS</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {['Core_Research', 'Project_Nexus', 'Mission_Stats', 'Member_Auth'].map((item) => (
                                    <Link key={item} href="#" underline="none" sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#FF1493' }, fontSize: '0.9rem', fontWeight: 500 }}>
                                        {item}
                                    </Link>
                                ))}
                            </Box>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 10, pt: 4, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
                            © {new Date().getFullYear()} PIXEL CLUB. ALL RIGHTS RESERVED. OPERATING UNDER SECTOR_7 PROTOCOL.
                        </Typography>
                    </Box>
                </RevealSection>
            </Container>
        </Box>
    );
};

export default Footer;

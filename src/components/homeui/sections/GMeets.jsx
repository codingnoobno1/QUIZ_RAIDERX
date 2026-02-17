'use client';

import React from 'react';
import { Box, Container, Typography, Button, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { GlassCard, SectionTitle, NeonButton } from './CommonUI';
import RevealSection from '../animations/RevealSection';

const GMeets = () => {
    const router = useRouter();

    return (
        <Box id="events" sx={{ py: 10, background: '#080808', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Container maxWidth="xl">
                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <Box sx={{ p: 4 }}>
                            <SectionTitle align="left" sx={{ mb: 2 }}>Upcoming Events</SectionTitle>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', mb: 4, lineHeight: 1.8 }}>
                                Join our live sessions, workshops, and webinars to stay ahead in the tech world.
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => router.push('/events')}
                                sx={{
                                    borderColor: 'rgba(0,255,255,0.5)',
                                    color: '#00FFFF',
                                    '&:hover': { borderColor: '#00FFFF', background: 'rgba(0,255,255,0.1)' }
                                }}
                            >
                                View All Events
                            </Button>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <RevealSection>
                            <GlassCard sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                alignItems: 'center',
                                p: 0,
                                overflow: 'hidden',
                                border: '1px solid rgba(0,255,255,0.1)',
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.4) 100%)'
                            }}>
                                <Box sx={{
                                    p: 5,
                                    flex: 2,
                                    borderRight: { md: '1px solid rgba(255,255,255,0.05)' }
                                }}>
                                    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ bgcolor: '#FF1493', color: '#fff', px: 1, py: 0.5, borderRadius: '4px', fontWeight: 'bold' }}>LIVE</Typography>
                                        <Typography variant="caption" sx={{ color: '#00FFFF', letterSpacing: '1px' }}>TODAY, 8:00 PM IST</Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', fontFamily: "'Space Grotesk', sans-serif" }}>Future of Web3</Typography>
                                    <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
                                        Get insights from industry experts about the transition from Web 2.0 to Web 3.0 and how to prepare for the decentralized future.
                                    </Typography>
                                    <NeonButton size="large" onClick={() => router.push('/login')}>Reserve My Spot</NeonButton>
                                </Box>
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 4,
                                    bgcolor: 'rgba(0,0,0,0.3)',
                                    height: '100%'
                                }}>
                                    <Box sx={{
                                        width: '80px', height: '80px',
                                        borderRadius: '50%',
                                        border: '2px dashed #00FFFF',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        mb: 2,
                                        animation: 'spin 10s linear infinite'
                                    }}>
                                        <Box sx={{ width: '60px', height: '60px', bgcolor: 'rgba(0,255,255,0.1)', borderRadius: '50%' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>240+</Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Registered</Typography>
                                </Box>
                            </GlassCard>
                        </RevealSection>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default GMeets;

'use client';

import React from 'react';
import { Container, Grid, Box, Typography } from '@mui/material';
import RevealSection from '../animations/RevealSection';

const Stats = () => {
    const stats = [
        { label: 'Hackathons Won', value: '25+', color: '#FF1493' },
        { label: 'Research Papers', value: '18+', color: '#00FFFF' },
        { label: 'Startup Incubated', value: '05+', color: '#FF1493' },
        { label: 'Global Rankers', value: '50+', color: '#00FFFF' },
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 15 }}>
            <Grid container spacing={6} justifyContent="center" textAlign="center">
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <RevealSection delay={index * 0.15}>
                            <Box sx={{ p: 4, borderRadius: '30px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography variant="h2" sx={{ fontWeight: '900', color: stat.color, mb: 1, fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</Typography>
                                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '1px' }}>{stat.label}</Typography>
                            </Box>
                        </RevealSection>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default Stats;

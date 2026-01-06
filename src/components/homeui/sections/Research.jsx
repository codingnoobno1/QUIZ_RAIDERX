'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, Button } from '@mui/material';
import { GlassCard, SectionTitle } from './CommonUI';
import RevealSection from '../animations/RevealSection';
import LottieWrapper from '../animations/LottieWrapper';

const Research = () => {
    const [featuredPaper, setFeaturedPaper] = useState(null);

    useEffect(() => {
        // Fetch latest featured research from database
        fetch('/api/research?featured=true&limit=1')
            .then(res => res.json())
            .then(data => {
                if (data.papers && data.papers.length > 0) {
                    setFeaturedPaper(data.papers[0]);
                }
            })
            .catch(err => console.error('Error fetching research:', err));
    }, []);
    return (
        <Box id="research" sx={{ py: 15 }}>
            <Container maxWidth="lg">
                <SectionTitle>Frontier Research</SectionTitle>
                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <RevealSection direction="right">
                            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Pushing the boundaries of what's possible.</Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, lineHeight: 1.8 }}>
                                Our members are actively publishing papers in international journals and presenting at top-tier conferences like IEEE and Springer.
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {[
                                    'NLP in Vernacular Languages',
                                    'Optimizing Edge Computing for IoT',
                                    'Cyber-Sec in Decentralized Finance'
                                ].map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00FFFF' }} />
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{item}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </RevealSection>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <RevealSection direction="left">
                            <Box sx={{ mb: 4, height: '240px' }}>
                                {/* Temporarily using a placeholder - replace with local Lottie file */}
                                <Box sx={{
                                    width: '100%',
                                    height: '240px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(0, 255, 255, 0.05)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(0, 255, 255, 0.2)'
                                }}>
                                    <Typography variant="h6" sx={{ color: 'rgba(0, 255, 255, 0.5)' }}>
                                        🔬 Research Animation
                                    </Typography>
                                </Box>
                            </Box>
                            <GlassCard sx={{ p: 4, borderLeft: '4px solid #00FFFF' }}>
                                <Typography variant="overline" color="#00FFFF">Latest Publication</Typography>
                                <Typography variant="h5" sx={{ mt: 1, mb: 2, fontWeight: 'bold' }}>"Deep Learning for Satellite Imagery Analysis"</Typography>
                                <Typography variant="body2" sx={{ mb: 3, fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>Published in International Journal of Soft Computing (2025)</Typography>
                                <Button variant="outlined" sx={{ color: '#00FFFF', borderColor: '#00FFFF' }}>Download Abstract</Button>
                            </GlassCard>
                        </RevealSection>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Research;

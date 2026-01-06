'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import RotatingCube from '@/components/ROTATINGCUBE';
import TextReveal from '../animations/TextReveal';
import MagneticButton from '../animations/MagneticButton';
import SystemStatusHUD from '../animations/SystemStatusHUD';
import { CornerAccent } from './CommonUI';

const Hero = () => {
    return (
        <Container maxWidth="xl" sx={{ pt: { xs: 8, md: 12 }, pb: 10 }}>
            <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={5}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, position: 'relative', p: 4 }}>
                            <CornerAccent color="#00FFFF" />
                            <Box sx={{ mt: -4 }}>
                                <TextReveal
                                    text="PIXEL"
                                    delay={0.2}
                                    sx={{
                                        flexDirection: 'column',
                                        fontSize: { xs: '6rem', md: '12rem' },
                                        fontWeight: 950,
                                        color: '#FF1493',
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        lineHeight: 0.85,
                                        textTransform: 'uppercase',
                                        filter: 'drop-shadow(0 0 30px rgba(255, 20, 147, 0.6))'
                                    }}
                                />
                            </Box>

                            <Box sx={{ pt: 4 }}>
                                <Typography variant="h4" sx={{
                                    color: '#00FFFF',
                                    mb: 3,
                                    fontWeight: 700,
                                    fontSize: { xs: '1.2rem', md: '1.8rem' },
                                    letterSpacing: '2px',
                                    textTransform: 'uppercase',
                                    lineHeight: 1.4
                                }}>
                                    Programming Innovators<br />
                                    Exploring Emerging<br />
                                    Languages
                                </Typography>
                                <Typography variant="body1" sx={{
                                    color: 'rgba(255,255,255,0.6)',
                                    fontSize: '1.1rem',
                                    mb: 6,
                                    maxWidth: '400px',
                                    lineHeight: 1.6,
                                    borderLeft: '2px solid #FF1493',
                                    pl: 3
                                }}>
                                    A community of creators, builders, and researchers dedicated to mastering modern tech and winning big at global stages.
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 4 }}>
                            <MagneticButton>
                                <Button
                                    variant="contained"
                                    size="large"
                                    sx={{
                                        backgroundColor: '#FF1493',
                                        px: 4, py: 1.5, borderRadius: '4px', fontWeight: '900',
                                        letterSpacing: '2px',
                                        '&:hover': { backgroundColor: '#FF69B4', boxShadow: '0 0 30px #FF1493' }
                                    }}
                                    onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    MISSION_START
                                </Button>
                            </MagneticButton>
                            <MagneticButton>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    sx={{
                                        borderColor: 'rgba(255,255,255,0.3)', color: '#fff',
                                        px: 4, py: 1.5, borderRadius: '4px',
                                        '&:hover': { borderColor: '#00FFFF', color: '#00FFFF' }
                                    }}
                                    onClick={() => document.getElementById('research')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    SYSTEM_CORE
                                </Button>
                            </MagneticButton>
                        </Box>
                    </motion.div>
                </Grid>

                <Grid item xs={12} md={7} sx={{ display: 'flex', justifyContent: 'center', position: 'relative', minHeight: { xs: '400px', md: '700px' } }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: "backOut" }}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                        <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Box sx={{
                                position: 'absolute',
                                top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: { xs: '100%', md: '800px' }, height: { xs: '100%', md: '800px' },
                                background: 'radial-gradient(circle, rgba(0,255,255,0.1) 0%, transparent 70%)',
                                zIndex: -1,
                                pointerEvents: 'none'
                            }} />
                            <RotatingCube size={400} sidebar={false} />
                            <SystemStatusHUD />
                        </Box>
                    </motion.div>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Hero;

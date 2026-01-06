'use client';

import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import {
    Code as CodeIcon,
    Search as ResearchIcon,
    Lightbulb as ProjectIcon,
    EmojiEvents as TrophyIcon,
    Groups as FacultyIcon,
    Handshake as CollaborateIcon
} from '@mui/icons-material';
import { GlassCard, SectionTitle } from './CommonUI';
import TiltCard from '../animations/TiltCard';

const Features = () => {
    const items = [
        { icon: <CodeIcon sx={{ fontSize: 50, color: '#00FFFF' }} />, title: 'Competitive Programming', desc: 'Mastering algorithms and data structures to dominate contests.' },
        { icon: <ResearchIcon sx={{ fontSize: 50, color: '#FF1493' }} />, title: 'Research & Publications', desc: 'Exploring the frontiers of AI, Blockchain, and Quantum Computing.' },
        { icon: <ProjectIcon sx={{ fontSize: 50, color: '#00FFFF' }} />, title: 'Real-world Projects', desc: 'Building scalable applications that solve actual industry problems.' },
        { icon: <CollaborateIcon sx={{ fontSize: 50, color: '#FF1493' }} />, title: 'Industry Collaboration', desc: 'Working closely with tech giants for internships and sponsorships.' },
        { icon: <TrophyIcon sx={{ fontSize: 50, color: '#00FFFF' }} />, title: 'Hackathons & CTFs', desc: 'Winning national and international level coding competitions.' },
        { icon: <FacultyIcon sx={{ fontSize: 50, color: '#FF1493' }} />, title: 'Expert Mentorship', desc: 'Guided by experienced faculty and industry veterans.' },
    ];

    return (
        <Box id="about" sx={{ py: 15, background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)' }}>
            <Container maxWidth="lg">
                <SectionTitle>Defining Excellence</SectionTitle>
                <Grid container spacing={4}>
                    {items.map((item, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <TiltCard>
                                <GlassCard
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Box sx={{ mb: 3 }}>{item.icon}</Box>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, fontFamily: "'Space Grotesk', sans-serif" }}>{item.title}</Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{item.desc}</Typography>
                                </GlassCard>
                            </TiltCard>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default Features;

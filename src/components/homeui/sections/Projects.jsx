'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, Button } from '@mui/material';
import { Code as CodeIcon, Lightbulb as ProjectIcon } from '@mui/icons-material';
import { GlassCard, SectionTitle } from './CommonUI';
import TiltCard from '../animations/TiltCard';
import PulseAnimation from '../animations/PulseAnimation';

const Projects = () => {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        // Fetch featured projects from database
        fetch('/api/portfolio-projects?featured=true&limit=3')
            .then(res => res.json())
            .then(data => setProjects(data.projects || []))
            .catch(err => console.error('Error fetching projects:', err));
    }, []);

    return (
        <Box id="projects" sx={{ py: 15, background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)' }}>
            <Container maxWidth="lg">
                <SectionTitle>Real-World Impact</SectionTitle>
                <Grid container spacing={4}>
                    {projects.map((project, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <TiltCard>
                                <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                                    <Box sx={{ height: '200px', backgroundColor: 'rgba(0, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Box sx={{ color: '#00FFFF', transform: 'scale(2)' }}>{project.icon}</Box>
                                    </Box>
                                    <Box sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>{project.title}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                            {project.tags.map(tag => (
                                                <Typography key={tag} variant="caption" sx={{ px: 1, py: 0.5, borderRadius: '4px', backgroundColor: 'rgba(0, 255, 255, 0.1)', color: '#00FFFF' }}>{tag}</Typography>
                                            ))}
                                        </Box>
                                        <PulseAnimation color="#FF1493">
                                            <Button sx={{ color: '#FF1493', p: 0, fontWeight: 'bold' }}>Learn More &gt;</Button>
                                        </PulseAnimation>
                                    </Box>
                                </GlassCard>
                            </TiltCard>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default Projects;

'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, CircularProgress, Alert, MenuItem, TextField } from '@mui/material';
import { SectionTitle } from '@/components/homeui/sections/CommonUI';
import ProjectCard from '@/components/cards/ProjectCard';

const categories = ['All', 'Web App', 'Mobile App', 'AI/ML', 'Blockchain', 'IoT', 'Game Dev', 'Other'];

export default function AllProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedCategory === 'All') {
            setFilteredProjects(projects);
        } else {
            setFilteredProjects(projects.filter(p => p.category === selectedCategory));
        }
    }, [selectedCategory, projects]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/portfolio-projects');

            if (!response.ok) throw new Error('Failed to fetch projects');

            const data = await response.json();
            setProjects(data.projects || []);
            setFilteredProjects(data.projects || []);
        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0a0a0a' }}>
                <CircularProgress sx={{ color: '#00FFFF' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4, bgcolor: '#0a0a0a', minHeight: '100vh' }}>
                <Container maxWidth="lg">
                    <Alert severity="error">{error}</Alert>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', py: 8 }}>
            <Container maxWidth="lg">
                <SectionTitle>All Projects</SectionTitle>

                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: 4 }}>
                    Explore innovative projects from our community
                </Typography>

                {/* Category Filter */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                    <TextField
                        select
                        label="Filter by Category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        sx={{ minWidth: 250 }}
                    >
                        {categories.map((cat) => (
                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                {/* Projects Grid */}
                {filteredProjects.length === 0 ? (
                    <Alert severity="info">No projects found in this category.</Alert>
                ) : (
                    <Grid container spacing={4}>
                        {filteredProjects.map((project) => (
                            <Grid item xs={12} sm={6} md={4} key={project._id}>
                                <ProjectCard project={project} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </Box>
    );
}

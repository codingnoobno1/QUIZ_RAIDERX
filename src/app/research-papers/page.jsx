'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, CircularProgress, Alert, MenuItem, TextField } from '@mui/material';
import { SectionTitle } from '@/components/homeui/sections/CommonUI';
import ResearchCard from '@/components/cards/ResearchCard';

const types = ['All', 'Journal', 'Conference', 'Preprint', 'Workshop', 'Book Chapter'];

export default function AllResearchPage() {
    const [papers, setPapers] = useState([]);
    const [filteredPapers, setFilteredPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedType, setSelectedType] = useState('All');

    useEffect(() => {
        fetchResearch();
    }, []);

    useEffect(() => {
        if (selectedType === 'All') {
            setFilteredPapers(papers);
        } else {
            setFilteredPapers(papers.filter(p => p.publicationType === selectedType));
        }
    }, [selectedType, papers]);

    const fetchResearch = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/research?showAll=true');

            if (!response.ok) throw new Error('Failed to fetch research papers');

            const data = await response.json();
            setPapers(data.papers || []);
            setFilteredPapers(data.papers || []);
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
                <CircularProgress sx={{ color: '#FF1493' }} />
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
                <SectionTitle>Research Publications</SectionTitle>

                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: 4 }}>
                    Discover cutting-edge research from our community
                </Typography>

                {/* Type Filter */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                    <TextField
                        select
                        label="Filter by Type"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        sx={{ minWidth: 250 }}
                    >
                        {types.map((type) => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                {/* Research Grid */}
                {filteredPapers.length === 0 ? (
                    <Alert severity="info">No research papers found in this category.</Alert>
                ) : (
                    <Grid container spacing={4}>
                        {filteredPapers.map((paper) => (
                            <Grid item xs={12} sm={6} md={4} key={paper._id}>
                                <ResearchCard paper={paper} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </Box>
    );
}

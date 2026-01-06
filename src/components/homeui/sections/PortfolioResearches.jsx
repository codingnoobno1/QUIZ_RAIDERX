'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, Button, Chip, Skeleton, Fade, Grow } from '@mui/material';
import { SectionTitle, GlassCard } from './CommonUI';
import RevealSection from '../animations/RevealSection';
import ArticleIcon from '@mui/icons-material/Article';
import ScienceIcon from '@mui/icons-material/Science';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/navigation';

const PortfolioResearches = () => {
    const router = useRouter();
    const [researches, setResearches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all research papers including pending (limit to 6 for homepage)
        fetch('/api/research?limit=6&showAll=true')
            .then(res => res.json())
            .then(data => {
                if (data.papers && data.papers.length > 0) {
                    setResearches(data.papers);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching research:', err);
                setLoading(false);
            });
    }, []);

    const ResearchCardSkeleton = () => (
        <GlassCard sx={{ p: 4, height: '100%' }}>
            <Skeleton variant="rectangular" width={60} height={60} sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 1, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            <Skeleton variant="text" sx={{ fontSize: '1rem', width: '60%', mb: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            </Box>
        </GlassCard>
    );

    return (
        <Box id="portfolio-research" sx={{ py: 15, position: 'relative', overflow: 'hidden' }}>
            {/* Gradient Orbs */}
            <Box sx={{
                position: 'absolute',
                top: '20%',
                left: '5%',
                width: '350px',
                height: '350px',
                background: 'radial-gradient(circle, rgba(255, 20, 147, 0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(70px)',
                zIndex: 0,
            }} />
            <Box sx={{
                position: 'absolute',
                bottom: '10%',
                right: '8%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(0, 255, 255, 0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(70px)',
                zIndex: 0,
            }} />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                <SectionTitle>Portfolio Research</SectionTitle>

                <Typography
                    variant="h6"
                    sx={{
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.7)',
                        mb: 6,
                        maxWidth: '700px',
                        mx: 'auto',
                        lineHeight: 1.6,
                    }}
                >
                    Showcasing cutting-edge research contributions from our community
                </Typography>

                {loading ? (
                    <Grid container spacing={4}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <ResearchCardSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                ) : researches.length > 0 ? (
                    <>
                        <Grid container spacing={4}>
                            {researches.map((paper, idx) => (
                                <Grid item xs={12} sm={6} md={4} key={paper._id || idx}>
                                    <Grow in timeout={500 + idx * 100}>
                                        <GlassCard
                                            sx={{
                                                p: 4,
                                                height: '100%',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                border: '1px solid rgba(0, 255, 255, 0.2)',
                                                '&:hover': {
                                                    transform: 'translateY(-8px) scale(1.02)',
                                                    background: 'rgba(0, 255, 255, 0.05)',
                                                    boxShadow: '0 10px 40px rgba(0, 255, 255, 0.3), 0 0 20px rgba(255, 20, 147, 0.2)',
                                                    borderColor: 'rgba(0, 255, 255, 0.6)',
                                                },
                                            }}
                                            onClick={() => router.push('/research-papers')}
                                        >
                                            {/* Icon */}
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(255, 20, 147, 0.2) 100%)',
                                                mb: 3,
                                            }}>
                                                <ArticleIcon sx={{ fontSize: 32, color: '#00FFFF' }} />
                                            </Box>

                                            {/* Title */}
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 700,
                                                    mb: 1.5,
                                                    color: '#fff',
                                                    lineHeight: 1.3,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {paper.title}
                                            </Typography>

                                            {/* Abstract Preview */}
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    mb: 3,
                                                    flex: 1,
                                                    lineHeight: 1.6,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {paper.abstract}
                                            </Typography>

                                            {/* Tags */}
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={paper.publicationType}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(0, 255, 255, 0.15)',
                                                        color: '#00FFFF',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        border: '1px solid rgba(0, 255, 255, 0.3)',
                                                    }}
                                                />
                                                {paper.publisher && (
                                                    <Chip
                                                        label={paper.publisher}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(255, 20, 147, 0.15)',
                                                            color: '#FF1493',
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                            border: '1px solid rgba(255, 20, 147, 0.3)',
                                                        }}
                                                    />
                                                )}
                                                {paper.conference && (
                                                    <Chip
                                                        label={paper.conference}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(255, 20, 147, 0.15)',
                                                            color: '#FF1493',
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                            border: '1px solid rgba(255, 20, 147, 0.3)',
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </GlassCard>
                                    </Grow>
                                </Grid>
                            ))}
                        </Grid>

                        {/* View All Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                            <Button
                                variant="outlined"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => router.push('/research-papers')}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    color: '#00FFFF',
                                    borderColor: '#00FFFF',
                                    borderWidth: '2px',
                                    borderRadius: '8px',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        borderWidth: '2px',
                                        borderColor: '#00FFFF',
                                        background: 'rgba(0, 255, 255, 0.1)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 25px rgba(0, 255, 255, 0.3)',
                                    },
                                }}
                            >
                                View All Research
                            </Button>
                        </Box>
                    </>
                ) : (
                    // Empty State
                    <Fade in>
                        <Box sx={{
                            textAlign: 'center',
                            py: 8,
                            px: 4,
                        }}>
                            <Box sx={{
                                display: 'inline-flex',
                                p: 3,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 20, 147, 0.1) 100%)',
                                mb: 3,
                            }}>
                                <ScienceIcon sx={{ fontSize: 64, color: 'rgba(0, 255, 255, 0.5)' }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#fff' }}>
                                No Research Papers Yet
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4, maxWidth: '500px', mx: 'auto' }}>
                                Be the first to showcase your groundbreaking research! Submit your published papers and contribute to our knowledge base.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => router.push('/submit-research')}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #FF1493 0%, #00FFFF 100%)',
                                    borderRadius: '8px',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 10px 30px rgba(255, 20, 147, 0.4)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Submit Your Research
                            </Button>
                        </Box>
                    </Fade>
                )}
            </Container>
        </Box>
    );
};

export default PortfolioResearches;

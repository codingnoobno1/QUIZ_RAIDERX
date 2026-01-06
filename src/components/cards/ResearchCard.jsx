'use client';

import React from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { PictureAsPdf, FormatQuote } from '@mui/icons-material';
import { GlassCard } from '../homeui/sections/CommonUI';
import TiltCard from '../homeui/animations/TiltCard';

export default function ResearchCard({ paper }) {
    return (
        <TiltCard>
            <GlassCard sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Publication Type Badge */}
                <Box sx={{ mb: 2 }}>
                    <Chip
                        label={paper.publicationType}
                        size="small"
                        sx={{
                            backgroundColor: 'rgba(255, 20, 147, 0.2)',
                            color: '#FF1493',
                            fontWeight: 'bold'
                        }}
                    />
                </Box>

                {/* Title */}
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
                    {paper.title}
                </Typography>

                {/* Authors */}
                <Typography variant="body2" sx={{ color: '#00FFFF', mb: 1, fontStyle: 'italic' }}>
                    {paper.authors?.join(', ')}
                </Typography>

                {/* Publisher & Date */}
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
                    {paper.publisher} • {new Date(paper.publishedDate).getFullYear()}
                </Typography>

                {/* Abstract */}
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, flex: 1 }}>
                    {paper.abstract.length > 200
                        ? paper.abstract.substring(0, 200) + '...'
                        : paper.abstract}
                </Typography>

                {/* Keywords */}
                {paper.keywords && paper.keywords.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {paper.keywords.slice(0, 5).map(keyword => (
                            <Chip
                                key={keyword}
                                label={keyword}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                                    color: '#00FFFF',
                                    fontSize: '0.7rem'
                                }}
                            />
                        ))}
                    </Box>
                )}

                {/* Stats & Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    {/* Citation Count */}
                    {paper.citationCount > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FormatQuote sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }} />
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                {paper.citationCount} citations
                            </Typography>
                        </Box>
                    )}

                    {/* PDF Download */}
                    {paper.pdfUrl && (
                        <Button
                            size="small"
                            startIcon={<PictureAsPdf />}
                            href={paper.pdfUrl}
                            target="_blank"
                            sx={{
                                color: '#FF1493',
                                borderColor: '#FF1493',
                                '&:hover': { backgroundColor: 'rgba(255, 20, 147, 0.1)' }
                            }}
                            variant="outlined"
                        >
                            Download
                        </Button>
                    )}
                </Box>
            </GlassCard>
        </TiltCard>
    );
}

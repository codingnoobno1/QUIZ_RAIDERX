'use client';

import React from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { GitHub, Language, Code } from '@mui/icons-material';
import { GlassCard } from '../homeui/sections/CommonUI';
import TiltCard from '../homeui/animations/TiltCard';

export default function ProjectCard({ project }) {
    return (
        <TiltCard>
            <GlassCard sx={{ p: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Project Image/Icon */}
                <Box sx={{
                    height: '200px',
                    backgroundColor: project.imageUrl ? 'transparent' : 'rgba(0, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: project.imageUrl ? `url(${project.imageUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    {!project.imageUrl && <Code sx={{ fontSize: '4rem', color: '#00FFFF', opacity: 0.3 }} />}
                </Box>

                {/* Content */}
                <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Title */}
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
                        {project.title}
                    </Typography>

                    {/* Description */}
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, flex: 1 }}>
                        {project.description.length > 120
                            ? project.description.substring(0, 120) + '...'
                            : project.description}
                    </Typography>

                    {/* Tags */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {project.tags?.slice(0, 4).map(tag => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                                    color: '#00FFFF',
                                    fontSize: '0.75rem'
                                }}
                            />
                        ))}
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        {project.githubUrl && (
                            <Button
                                size="small"
                                startIcon={<GitHub />}
                                href={project.githubUrl}
                                target="_blank"
                                sx={{
                                    color: '#00FFFF',
                                    borderColor: '#00FFFF',
                                    '&:hover': { backgroundColor: 'rgba(0, 255, 255, 0.1)' }
                                }}
                                variant="outlined"
                            >
                                Code
                            </Button>
                        )}
                        {project.liveUrl && (
                            <Button
                                size="small"
                                startIcon={<Language />}
                                href={project.liveUrl}
                                target="_blank"
                                sx={{
                                    color: '#FF1493',
                                    borderColor: '#FF1493',
                                    '&:hover': { backgroundColor: 'rgba(255, 20, 147, 0.1)' }
                                }}
                                variant="outlined"
                            >
                                Live
                            </Button>
                        )}
                    </Box>
                </Box>
            </GlassCard>
        </TiltCard>
    );
}

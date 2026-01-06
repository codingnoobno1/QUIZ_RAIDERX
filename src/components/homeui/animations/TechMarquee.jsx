'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const techSet = [
    'REACT', 'NEXT.JS', 'KOTLIN', 'RUST', 'VULKAN', 'K8S', 'DOCKER', 'AZURE',
    'TYPESCRIPT', 'PYTHON', 'ML', 'SCALA', 'GO', 'SWIFT', 'FLUTTER', 'MAUI'
];

const TechMarquee = () => {
    return (
        <Box sx={{
            py: 1.5,
            background: 'rgba(255, 20, 147, 0.05)',
            borderTop: '1px solid rgba(255, 20, 147, 0.2)',
            borderBottom: '1px solid rgba(255, 20, 147, 0.2)',
            overflow: 'hidden',
            position: 'relative',
            whiteSpace: 'nowrap'
        }}>
            <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
                style={{ display: 'inline-block' }}
            >
                {[...techSet, ...techSet].map((tech, i) => (
                    <Typography
                        key={i}
                        variant="caption"
                        sx={{
                            display: 'inline-block',
                            mx: 4,
                            fontWeight: 900,
                            fontSize: '0.75rem',
                            letterSpacing: '3px',
                            color: 'rgba(255,255,255,0.4)',
                            '&:hover': { color: '#00FFFF' }
                        }}
                    >
                        {tech} •
                    </Typography>
                ))}
            </motion.div>
        </Box>
    );
};

export default TechMarquee;

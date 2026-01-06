'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SphereBot from './SphereBot';

const SplashLoader = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [animationReady, setAnimationReady] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => {
                        setIsVisible(false);
                        if (onComplete) onComplete();
                    }, 800);
                    return 100;
                }
                return prev + 1;
            });
        }, 40); // Slightly slower for cinematic feel
        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: '#050505',
                        zIndex: 99999,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ width: 400, height: 400, mb: -4 }}>
                        <SphereBot />
                    </Box>

                    <Box sx={{ width: '250px', position: 'relative', mt: 4 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                textAlign: 'center',
                                mb: 1,
                                fontWeight: 900,
                                letterSpacing: '4px',
                                color: '#00FFFF',
                                textShadow: '0 0 10px #00FFFF'
                            }}
                        >
                            INITIATING_PIXEL_DROID_{progress}%
                        </Typography>
                        <Box sx={{
                            width: '100%',
                            height: '4px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            border: '1px solid rgba(0, 255, 255, 0.2)'
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #00FFFF, #FF1493)',
                                    boxShadow: '0 0 15px #FF1493'
                                }}
                            />
                        </Box>
                    </Box>

                    <Box sx={{
                        position: 'absolute',
                        bottom: 40,
                        display: 'flex',
                        gap: 2,
                        opacity: 0.3
                    }}>
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                                style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF1493' }}
                            />
                        ))}
                    </Box>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashLoader;

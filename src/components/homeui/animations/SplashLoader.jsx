'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@mui/system';

// CSS-based animated orb to replace R3F SphereCanvas
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 60px 30px rgba(0, 255, 255, 0.4), 
                0 0 100px 60px rgba(0, 255, 255, 0.2),
                0 0 140px 90px rgba(0, 255, 255, 0.1);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 80px 40px rgba(0, 255, 255, 0.6), 
                0 0 120px 80px rgba(0, 255, 255, 0.3),
                0 0 160px 100px rgba(0, 255, 255, 0.15);
  }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

function AnimatedOrb() {
    return (
        <Box
            sx={{
                position: 'relative',
                width: 200,
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Outer rotating ring */}
            <Box
                sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    border: '2px solid rgba(0, 255, 255, 0.3)',
                    borderRadius: '50%',
                    borderTopColor: '#00ffff',
                    animation: `${rotate} 2s linear infinite`,
                }}
            />
            {/* Inner pulsing core */}
            <Box
                sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, #00ffff, #006666, #003333)',
                    animation: `${pulse} 2s ease-in-out infinite`,
                }}
            />
            {/* Center glow */}
            <Box
                sx={{
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #ffffff, #00ffff)',
                    filter: 'blur(5px)',
                }}
            />
        </Box>
    );
}

export default function SplashLoader({ onComplete }) {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(t);
                    setTimeout(() => {
                        setVisible(false);
                        onComplete?.();
                    }, 600);
                    return 100;
                }
                return p + 1;
            });
        }, 40);

        return () => clearInterval(t);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: '#050505',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <AnimatedOrb />

                    <Typography sx={{ color: '#00ffff', mt: 4, fontFamily: 'monospace', letterSpacing: 2 }}>
                        INITIATING_PIXEL_DROID_{progress}%
                    </Typography>

                    {/* Progress bar */}
                    <Box sx={{ width: 300, mt: 3, height: 4, bgcolor: 'rgba(0,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                        <Box
                            sx={{
                                width: `${progress}%`,
                                height: '100%',
                                bgcolor: '#00ffff',
                                transition: 'width 0.1s ease-out',
                                boxShadow: '0 0 10px #00ffff',
                            }}
                        />
                    </Box>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

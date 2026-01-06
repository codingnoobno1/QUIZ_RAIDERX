'use client';

import React from 'react';
import { motion } from 'framer-motion';

const FloatingBlobs = () => {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
            <motion.div
                animate={{
                    x: [0, 100, -50, 0],
                    y: [0, 50, 100, 0],
                    scale: [1, 1.2, 0.8, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    borderRadius: '50%',
                }}
            />
            <motion.div
                animate={{
                    x: [0, -100, 50, 0],
                    y: [0, 100, -50, 0],
                    scale: [1, 0.8, 1.2, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '10%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(255, 20, 147, 0.1) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    borderRadius: '50%',
                }}
            />
        </div>
    );
};

export default FloatingBlobs;

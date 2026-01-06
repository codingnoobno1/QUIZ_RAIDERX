'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

const GlowCursor = () => {
    const mouseX = useSpring(0, { stiffness: 500, damping: 28 });
    const mouseY = useSpring(0, { stiffness: 500, damping: 28 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX - 100);
            mouseY.set(e.clientY - 100);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <motion.div
            style={{
                position: 'fixed',
                left: mouseX,
                top: mouseY,
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 9999,
                filter: 'blur(30px)',
            }}
        />
    );
};

export default GlowCursor;

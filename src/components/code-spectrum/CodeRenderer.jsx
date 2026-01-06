'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Box } from '@mui/material';

export default function CodeRenderer({ code, theme }) {
    const containerRef = useRef(null);
    const controls = useAnimation();

    useEffect(() => {
        const startScroll = async () => {
            if (!containerRef.current) return;

            const scrollHeight = containerRef.current.scrollHeight;
            const height = containerRef.current.offsetHeight;

            if (scrollHeight > height) {
                await controls.start({
                    y: -(scrollHeight - height),
                    transition: {
                        duration: 15,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "reverse",
                        repeatDelay: 2
                    }
                });
            }
        };
        startScroll();
    }, [code, controls]);

    return (
        <Box
            ref={containerRef}
            sx={{
                height: '100%',
                overflow: 'hidden', // Hide actual scroll to use framer motion
                p: 2,
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative'
            }}
        >
            <motion.pre
                animate={controls}
                style={{
                    margin: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: theme.code,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    padding: '16px',
                }}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <code>{code}</code>
            </motion.pre>
        </Box>
    );
}

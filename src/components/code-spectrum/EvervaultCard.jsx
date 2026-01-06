'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Box, Typography } from '@mui/material';

export const EvervaultCard = ({ children, className, theme }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const [randomString, setRandomString] = useState("");

    useEffect(() => {
        let str = generateRandomString(1500);
        setRandomString(str);
    }, []);

    function onMouseMove({ currentTarget, clientX, clientY }) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);

        const str = generateRandomString(1500);
        setRandomString(str);
    }

    return (
        <Box
            onMouseMove={onMouseMove}
            sx={{
                p: 0.5,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                aspectRatio: '0.8',
                width: '100%',
                height: '100%',
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                border: `1px solid ${theme.border}`,
                cursor: 'default',
                background: theme.card,
                backdropFilter: 'blur(10px)',
            }}
        >
            <Box sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '24px',
                zIndex: 0,
            }}>
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.1,
                        maskImage: useMotionTemplate`radial-gradient(250px circle at ${mouseX}px ${mouseY}px, white, transparent)`,
                        backgroundImage: 'radial-gradient(circle, #00FFFF 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                    }}
                />
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.05,
                        background: 'linear-gradient(to right, #00FFFF, #FF1493)',
                        maskImage: useMotionTemplate`radial-gradient(250px circle at ${mouseX}px ${mouseY}px, white, transparent)`,
                    }}
                />
                <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    mixBlendMode: 'overlay',
                    opacity: 0.1,
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    color: theme.title,
                    userSelect: 'none',
                    pointerEvents: 'none',
                    p: 2
                }}>
                    {randomString}
                </Box>
            </Box>

            <Box sx={{
                position: 'relative',
                zIndex: 10,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {children}
            </Box>
        </Box>
    );
};

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
const generateRandomString = (length) => {
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

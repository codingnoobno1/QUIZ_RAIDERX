'use client';

import React from 'react';
import { motion } from 'framer-motion';

const TextReveal = ({ text, delay = 0, sx = {} }) => {
    const characters = text.split('');

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: delay },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 15,
                stiffness: 120,
            },
        },
        hidden: {
            opacity: 0,
            y: 50,
        },
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{
                display: 'flex',
                lineHeight: 1,
                ...sx
            }}
        >
            {characters.map((char, index) => (
                <motion.span
                    variants={child}
                    key={index}
                    style={{
                        display: 'inline-block',
                        whiteSpace: 'pre',
                    }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.div>
    );
};

export default TextReveal;

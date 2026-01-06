'use client';

import React from 'react';
import { motion } from 'framer-motion';

const RevealSection = ({ children, delay = 0, direction = 'up' }) => {
    const variants = {
        hidden: {
            opacity: 0,
            y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
            x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: { duration: 0.8, delay, ease: 'easeOut' }
        },
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={variants}
        >
            {children}
        </motion.div>
    );
};

export default RevealSection;

'use client';

import React from 'react';
import { motion } from 'framer-motion';

const PulseAnimation = ({ children, color = '#00FFFF' }) => {
    return (
        <motion.div
            animate={{
                boxShadow: [
                    `0 0 0 0px ${color}44`,
                    `0 0 0 15px ${color}00`,
                ],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            style={{ borderRadius: 'inherit' }}
        >
            {children}
        </motion.div>
    );
};

export default PulseAnimation;

'use client';

import React from 'react';
import { motion } from 'framer-motion';

const FloatingIcons = ({ icons = [], speed = 10 }) => {
    return (
        <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
            {icons.map((Icon, index) => (
                <motion.div
                    key={index}
                    animate={{
                        y: [0, -20, 0],
                        x: [0, 10, 0],
                        rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                        duration: speed + Math.random() * 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.5,
                    }}
                    style={{
                        position: 'absolute',
                        top: `${Math.random() * 80 + 10}%`,
                        left: `${Math.random() * 80 + 10}%`,
                        opacity: 0.2,
                        color: index % 2 === 0 ? '#00FFFF' : '#FF1493',
                    }}
                >
                    <Icon size={Math.random() * 20 + 20} />
                </motion.div>
            ))}
        </div>
    );
};

export default FloatingIcons;

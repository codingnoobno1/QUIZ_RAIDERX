'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

const snippets = [
    'launch(Dispatchers.IO) { ... }',
    '#[tokio::main] async fn main()',
    'func worker(jobs <-chan int)',
    'val flow = flow { emit(data) }',
    'Widget build(BuildContext context)',
    'std::vector<const char*> layers',
    'VkInstanceCreateInfo createInfo{}',
    'await Shell.Current.GoToAsync()',
    'CROW_ROUTE(app, \"/\")',
    'import torch',
    'model.eval()',
    'data << 8 | data >> 24'
];

const FloatingCodeOverlay = () => {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1, // Higher than sections, lower than interactive elements
            pointerEvents: 'none',
            overflow: 'hidden'
        }}>
            {[...Array(15)].map((_, i) => {
                const snippet = snippets[Math.floor(Math.random() * snippets.length)];
                const duration = 20 + Math.random() * 40;
                const delay = Math.random() * -duration;
                const top = Math.random() * 100;
                const fontSize = 10 + Math.random() * 14;
                const opacity = 0.05 + Math.random() * 0.15;

                return (
                    <motion.div
                        key={i}
                        initial={{ x: '-20%', opacity: 0 }}
                        animate={{
                            x: '120%',
                            opacity: [0, opacity, opacity, 0],
                            y: [0, (Math.random() - 0.5) * 50, 0]
                        }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            delay: delay,
                            ease: "linear"
                        }}
                        style={{
                            position: 'absolute',
                            top: `${top}%`,
                            whiteSpace: 'nowrap',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: `${fontSize}px`,
                            color: i % 2 === 0 ? '#00FFFF' : '#FF1493',
                            textShadow: '0 0 10px rgba(0,0,0,0.5)',
                            zIndex: 10
                        }}
                    >
                        {snippet}
                    </motion.div>
                );
            })}
        </Box>
    );
};

export default FloatingCodeOverlay;

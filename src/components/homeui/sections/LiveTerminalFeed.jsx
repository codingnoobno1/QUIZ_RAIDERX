'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const logs = [
    'INITIALIZING_QUANTUM_CORE...',
    'LINKING_SECURE_NODE_X9...',
    'FETCHING_PIXEL_PROTOCOLS...',
    'DECODING_REPOS_302...',
    'ENCRYPTING_COMM_CHANNELS...',
    'OPTIMIZING_RENT_PIPELINE...',
    'SYNCING_BLOCKCHAIN_NODES...',
    'BYPASSING_FIREWALL_V4...',
    'UPLOADING_NEURAL_SAMPLES...',
    'STABILIZING_FLUX_MATRIX...'
];

const LiveTerminalFeed = () => {
    const [activeLogs, setActiveLogs] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveLogs(prev => {
                const nextLog = logs[Math.floor(Math.random() * logs.length)];
                const timestamp = new Date().toLocaleTimeString([], { hour12: false });
                const newLog = `[${timestamp}] ${nextLog}`;
                return [newLog, ...prev].slice(0, 5);
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Box sx={{
            p: 1.5,
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            borderRadius: '4px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
            color: '#00FFFF',
            minHeight: '100px',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.1)'
        }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, opacity: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#27c93f' }} />
            </Box>
            {activeLogs.map((log, i) => (
                <Typography key={i} sx={{ fontSize: 'inherit', fontFamily: 'inherit', mb: 0.5, opacity: 1 - (i * 0.2) }}>
                    {log}
                </Typography>
            ))}
            <Box sx={{ display: 'flex', mt: 1 }}>
                <Typography sx={{ fontSize: 'inherit', fontFamily: 'inherit', color: '#FF1493' }}>&gt;</Typography>
                <Box
                    sx={{
                        width: 6,
                        height: 12,
                        bgcolor: '#00FFFF',
                        ml: 1,
                        animation: 'blink 1s step-end infinite',
                        '@keyframes blink': {
                            '50%': { opacity: 0 }
                        }
                    }}
                />
            </Box>
        </Box>
    );
};

export default LiveTerminalFeed;

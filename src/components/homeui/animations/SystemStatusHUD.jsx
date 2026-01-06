'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

const SystemStatusHUD = () => {
    const [stats, setStats] = useState({ cpu: 45, ram: 62, nodes: 12, network: 'OPTIMAL' });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                cpu: Math.floor(40 + Math.random() * 20),
                ram: Math.floor(60 + Math.random() * 10),
                nodes: prev.nodes,
                network: Math.random() > 0.9 ? 'SCANNING' : 'OPTIMAL'
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const HUDItem = ({ label, value, percent }) => (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>{label}</Typography>
                <Typography variant="caption" sx={{ color: '#00FFFF', fontWeight: 'bold' }}>{value}</Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={percent}
                sx={{
                    height: 2, borderRadius: 1,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#FF1493' }
                }}
            />
        </Box>
    );

    return (
        <Box sx={{
            p: 2,
            width: '200px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            position: 'absolute',
            bottom: 40,
            right: 40,
            zIndex: 10
        }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 2, fontWeight: 900, letterSpacing: '2px', color: '#FF1493' }}>SYS_CORE_V1</Typography>
            <HUDItem label="CPU_LOAD" value={`${stats.cpu}%`} percent={stats.cpu} />
            <HUDItem label="MEM_USAGE" value={`${stats.ram}%`} percent={stats.ram} />
            <HUDItem label="ACTIVE_NODES" value={stats.nodes} percent={100} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: stats.network === 'OPTIMAL' ? '#00FF00' : '#FFFF00', boxShadow: '0 0 10px #00FF00' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>NET_STATUS: {stats.network}</Typography>
            </Box>
        </Box>
    );
};

export default SystemStatusHUD;

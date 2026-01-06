'use client';

import React, { useState } from 'react';
import { Box, Tooltip, Zoom } from '@mui/material';
import { motion } from 'framer-motion';
import SphereBot from './SphereBot';

const InteractiveRobot = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 20,
                left: 20,
                zIndex: 4000,
                pointerEvents: 'auto',
                cursor: 'pointer',
                display: 'block',
                width: 300,
                height: 300,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Tooltip
                title="System Core Online. I'm your 3D Companion!"
                placement="right"
                TransitionComponent={Zoom}
                arrow
                open={isHovered}
            >
                <Box sx={{ width: '100%', height: '100%' }}>
                    <SphereBot hover={isHovered} />
                </Box>
            </Tooltip>
        </Box>
    );
};

export default InteractiveRobot;

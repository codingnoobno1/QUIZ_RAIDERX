'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import { keyframes } from '@mui/system';

// CSS-based animated robot orb to replace R3F SphereCanvas
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px 10px rgba(0, 255, 255, 0.3), 
                0 0 40px 20px rgba(0, 255, 255, 0.15);
  }
  50% {
    box-shadow: 0 0 30px 15px rgba(0, 255, 255, 0.5), 
                0 0 60px 30px rgba(0, 255, 255, 0.25);
  }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

function AnimatedRobotOrb({ isHovered }) {
    return (
        <Box
            sx={{
                position: 'relative',
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `${float} 3s ease-in-out infinite`,
                transition: 'transform 0.3s ease',
                transform: isHovered ? 'scale(1.2)' : 'scale(1)',
            }}
        >
            {/* Outer rotating ring */}
            <Box
                sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    border: '2px solid rgba(0, 255, 255, 0.4)',
                    borderRadius: '50%',
                    borderTopColor: '#00ffff',
                    animation: `${rotate} 3s linear infinite`,
                }}
            />
            {/* Inner core */}
            <Box
                sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: isHovered
                        ? 'radial-gradient(circle at 30% 30%, #00ffff, #00aaaa, #005555)'
                        : 'radial-gradient(circle at 30% 30%, #00cccc, #006666, #003333)',
                    animation: `${pulse} 2s ease-in-out infinite`,
                    transition: 'background 0.3s ease',
                }}
            />
            {/* Eye/center */}
            <Box
                sx={{
                    position: 'absolute',
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: isHovered ? '#ffffff' : '#00ffff',
                    boxShadow: isHovered ? '0 0 15px #ffffff' : '0 0 10px #00ffff',
                    transition: 'all 0.3s ease',
                }}
            />
        </Box>
    );
}

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
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Tooltip
                title="System Core Online. I'm your Companion!"
                placement="right"
                TransitionComponent={Zoom}
                arrow
                open={isHovered}
            >
                <Box>
                    <AnimatedRobotOrb isHovered={isHovered} />
                </Box>
            </Tooltip>
        </Box>
    );
};

export default InteractiveRobot;

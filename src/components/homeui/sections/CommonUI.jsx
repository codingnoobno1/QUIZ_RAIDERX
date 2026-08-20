import { styled, keyframes } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { Button, Typography, Box } from '@mui/material';

const scanline = keyframes`
  0% { top: -100%; }
  100% { top: 100%; }
`;

const glitch = keyframes`
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
`;

export const GlassCard = styled(motion.div)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '24px',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '2px',
        background: 'linear-gradient(to right, transparent, #00FFFF, transparent)',
        opacity: 0,
        transition: 'opacity 0.3s',
        animation: `${scanline} 4s linear infinite`,
    },
    '&:hover': {
        background: 'rgba(255, 255, 255, 0.06)',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.1)',
        borderColor: 'rgba(0, 255, 255, 0.4)',
        transform: 'scale(1.02)',
        '&::before': { opacity: 1 },
    },
    // Futuristic corners
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 10, right: 10,
        width: '20px', height: '20px',
        borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
        borderRight: '2px solid rgba(0, 255, 255, 0.3)',
    }
}));

export const CornerAccent = ({ color = "#FF1493" }) => (
    <Box sx={{
        position: 'absolute',
        top: 0, left: 0,
        width: '15px', height: '15px',
        borderTop: `2px solid ${color}`,
        borderLeft: `2px solid ${color}`,
        opacity: 0.6
    }} />
);

export const NeonButton = styled(Button)(({ theme }) => ({
    borderRadius: '4px',
    padding: '12px 32px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    border: '1px solid #00FFFF',
    color: '#00FFFF',
    background: 'transparent',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: '#00FFFF',
        color: '#000',
        boxShadow: '0 0 25px rgba(0, 255, 255, 0.5)',
    },
}));

export const SectionTitle = ({ children }) => (
    <Box sx={{ position: 'relative', mb: 8, textAlign: 'center' }}>
        <Typography
            variant="h3"
            component="h2"
            sx={{
                fontWeight: 900,
                fontFamily: "'Space Grotesk', sans-serif",
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '8px',
                position: 'relative',
                display: 'inline-block',
                '&::before, &::after': {
                    content: `"${children}"`,
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    background: 'black',
                },
                '&::before': {
                    color: '#00FFFF',
                    zIndex: -1,
                    animation: `${glitch} 0.4s cubic-bezier(.25,.46,.45,.94) both infinite`,
                },
                '&::after': {
                    color: '#FF1493',
                    zIndex: -2,
                    animation: `${glitch} 0.4s cubic-bezier(.25,.46,.45,.94) reverse both infinite`,
                }
            }}
        >
            {children}
        </Typography>
        <Box sx={{
            width: '100px', height: '1px',
            background: 'linear-gradient(90deg, transparent, #FF1493, #00FFFF, transparent)',
            mx: 'auto', mt: 2,
            boxShadow: '0 0 15px rgba(255, 20, 147, 0.5)'
        }} />
    </Box>
);

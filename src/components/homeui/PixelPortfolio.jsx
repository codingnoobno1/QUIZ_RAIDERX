'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

// Section Imports
import Header from './sections/Header';
import Hero from './sections/Hero';
import Features from './sections/Features';
import Stats from './sections/Stats';
import Projects from './sections/Projects';
import Research from './sections/Research';
import PortfolioResearches from './sections/PortfolioResearches';
import GMeets from './sections/GMeets';
import Footer from './sections/Footer';

// Animation Imports
import CodeFlowBackground from './animations/CodeFlowBackground';
import FloatingBlobs from './animations/FloatingBlobs';
import GlowCursor from './animations/GlowCursor';
import FloatingCodeOverlay from './animations/FloatingCodeOverlay';
import CodeSpectrum from '../code-spectrum/CodeSpectrum';
import TechMarquee from './animations/TechMarquee';

// Dynamic Imports with SSR disabled (InteractiveRobot only)
const InteractiveRobot = dynamic(() => import('./animations/InteractiveRobot'), { ssr: false });

const PixelPortfolio = () => {
    return (
        <Box sx={{
            backgroundColor: '#050505',
            color: '#fff',
            minHeight: '100vh',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden',
            position: 'relative'
        }}>
            <CodeFlowBackground />
            <FloatingBlobs />
            <GlowCursor />
            <FloatingCodeOverlay />

            <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
            >
                <Header />
                <TechMarquee />
                <Hero />
                <Features />
                <GMeets />
                <CodeSpectrum />
                <Stats />
                <Projects />
                <Research />
                <PortfolioResearches />
                <Footer />
                <InteractiveRobot />
            </motion.div>
        </Box>
    );
};

export default PixelPortfolio;

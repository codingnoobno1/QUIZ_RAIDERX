import React, { useState } from 'react';
import { Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './sections/Header';
import Hero from './sections/Hero';
import Features from './sections/Features';
import Stats from './sections/Stats';
import Projects from './sections/Projects';
import Research from './sections/Research';
import PortfolioResearches from './sections/PortfolioResearches';
import GMeets from './sections/GMeets';
import Footer from './sections/Footer';
import CodeFlowBackground from './animations/CodeFlowBackground';
import FloatingBlobs from './animations/FloatingBlobs';
import GlowCursor from './animations/GlowCursor';
import FloatingCodeOverlay from './animations/FloatingCodeOverlay';
import CodeSpectrum from '../code-spectrum/CodeSpectrum';
import TechMarquee from './animations/TechMarquee';
import SplashLoader from './animations/SplashLoader';
import InteractiveRobot from './animations/InteractiveRobot';

const PixelPortfolio = () => {
    const [loading, setLoading] = useState(true);

    return (
        <Box sx={{
            backgroundColor: '#050505',
            color: '#fff',
            minHeight: '100vh',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden',
            position: 'relative'
        }}>
            <AnimatePresence mode="wait">
                {loading && (
                    <Box key="loader" sx={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
                        <SplashLoader onComplete={() => setLoading(false)} />
                    </Box>
                )}
            </AnimatePresence>

            <CodeFlowBackground />
            <FloatingBlobs />
            <GlowCursor />
            <FloatingCodeOverlay />

            {!loading && (
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
                    <CodeSpectrum />
                    <Stats />
                    <Projects />
                    <Research />
                    <PortfolioResearches />
                    <GMeets />
                    <Footer />
                    <InteractiveRobot />
                </motion.div>
            )}
        </Box>
    );
};

export default PixelPortfolio;

'use client';

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import useUserStore from '@/store/useUserStore';

// Dynamic imports with ssr: false to strictly isolate R3F contexts
const SplashLoader = dynamic(() => import('@/components/homeui/animations/SplashLoader'), { ssr: false });
const PixelPortfolio = dynamic(() => import('@/components/homeui/PixelPortfolio'), { ssr: false });

export default function HomeClient() {
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const hasSeenIntro = window.sessionStorage.getItem('pixel-intro-seen');
        if (!hasSeenIntro) {
            setLoading(true);
            window.sessionStorage.setItem('pixel-intro-seen', 'true');
        }
        // Safely hydrate user session from localStorage
        const { hydrateUser } = useUserStore.getState();
        hydrateUser();
    }, []);

    if (!isMounted) return null;

    return (
        <>
            <AnimatePresence mode="wait">
                {loading && (
                    <Box key="loader" sx={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
                        <SplashLoader onComplete={() => setLoading(false)} />
                    </Box>
                )}
            </AnimatePresence>

            {!loading && <PixelPortfolio />}
        </>
    );
}

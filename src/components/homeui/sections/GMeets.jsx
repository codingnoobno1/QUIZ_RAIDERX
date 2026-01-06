'use client';

import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { GlassCard, SectionTitle, NeonButton } from './CommonUI';
import RevealSection from '../animations/RevealSection';

const GMeets = () => {
    const router = useRouter();

    return (
        <Box id="events" sx={{ py: 15, background: 'radial-gradient(circle at top, rgba(0, 255, 255, 0.05), transparent)' }}>
            <Container maxWidth="md">
                <SectionTitle>Join the Conversation</SectionTitle>
                <RevealSection>
                    <GlassCard sx={{ textAlign: 'center', p: { xs: 4, md: 8 }, border: '2px dashed rgba(0,255,255,0.3)' }}>
                        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>Live Webinar: "Future of Web3"</Typography>
                        <Typography variant="h6" color="#00FFFF" sx={{ mb: 4 }}>Starting Today at 8:00 PM IST</Typography>
                        <Typography variant="body1" sx={{ mb: 6, color: 'rgba(255,255,255,0.7)' }}>
                            Get insights from industry experts about the transition from Web 2.0 to Web 3.0 and how to prepare.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                            <NeonButton size="large" onClick={() => router.push('/login')}>Reserve My Spot</NeonButton>
                            <Button sx={{ color: '#aaa' }}>Set Reminder</Button>
                        </Box>
                    </GlassCard>
                </RevealSection>
            </Container>
        </Box>
    );
};

export default GMeets;

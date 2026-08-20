'use client';

import React from 'react';
import { Box, Button, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import { ArrowForward, Bolt, Code, Groups, Science } from '@mui/icons-material';
import { motion } from 'framer-motion';

const metrics = [
    { value: '1,200+', label: 'active learners' },
    { value: '80+', label: 'projects shipped' },
    { value: '24/7', label: 'builder network' },
];

const tracks = [
    { Icon: Code, title: 'Engineering lab', meta: '42 builds active', color: '#67e8f9' },
    { Icon: Science, title: 'Research cell', meta: '12 studies underway', color: '#ff2d9b' },
    { Icon: Groups, title: 'Peer network', meta: 'Open for collaborators', color: '#a78bfa' },
];

export default function Hero() {
    return (
        <Box component="section" sx={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <Box aria-hidden sx={{ position: 'absolute', inset: 0, opacity: .22, backgroundImage: 'linear-gradient(rgba(0,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,.12) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'linear-gradient(to bottom, black, transparent 88%)' }} />
            <Container maxWidth="xl" sx={{ position: 'relative', pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
                <Grid container spacing={{ xs: 7, md: 9 }} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
                            <Chip icon={<Bolt />} label="THE CAMPUS BUILDER NETWORK" sx={{ mb: 3, color: '#67e8f9', bgcolor: 'rgba(34,211,238,.08)', border: '1px solid rgba(34,211,238,.25)', fontWeight: 800, letterSpacing: 1 }} />
                            <Typography component="h1" sx={{ maxWidth: 900, fontSize: { xs: '3.2rem', sm: '5rem', md: '6.6rem' }, lineHeight: .92, letterSpacing: '-.055em', fontWeight: 950, fontFamily: "'Space Grotesk', sans-serif" }}>
                                Learn fast.<br />Build <Box component="span" sx={{ color: '#ff2d9b', textShadow: '0 0 32px rgba(255,45,155,.35)' }}>what matters.</Box>
                            </Typography>
                            <Typography sx={{ mt: 3, maxWidth: 690, color: 'rgba(255,255,255,.66)', fontSize: { xs: '1.05rem', md: '1.22rem' }, lineHeight: 1.75 }}>
                                PIXEL brings competitive programmers, researchers and product builders into one focused community—turning curiosity into working systems, published ideas and competition wins.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4, alignItems: { sm: 'center' } }}>
                                <Button onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })} endIcon={<ArrowForward />} variant="contained" size="large" sx={{ minHeight: 52, px: 3.5, bgcolor: '#ff2d9b', color: '#fff', fontWeight: 900, borderRadius: 2, boxShadow: '0 12px 36px rgba(255,45,155,.25)', '&:hover': { bgcolor: '#ff57af' } }}>Explore our work</Button>
                                <Button onClick={() => document.getElementById('research')?.scrollIntoView({ behavior: 'smooth' })} variant="outlined" size="large" sx={{ minHeight: 52, px: 3.5, color: '#e7e7ea', borderColor: 'rgba(255,255,255,.2)', borderRadius: 2, '&:hover': { borderColor: '#67e8f9', bgcolor: 'rgba(103,232,249,.06)' } }}>Browse research</Button>
                            </Stack>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 2, mt: 6, pt: 4, maxWidth: 720, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                                {metrics.map((metric) => <Box key={metric.label}><Typography sx={{ fontSize: { xs: '1.35rem', md: '1.75rem' }, color: '#fff', fontWeight: 900 }}>{metric.value}</Typography><Typography sx={{ color: 'rgba(255,255,255,.45)', fontSize: { xs: '.72rem', sm: '.85rem' }, textTransform: 'uppercase', letterSpacing: 1 }}>{metric.label}</Typography></Box>)}
                            </Box>
                        </motion.div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .15 }}>
                            <Box sx={{ p: { xs: 2, sm: 3 }, border: '1px solid rgba(103,232,249,.2)', borderRadius: 4, background: 'linear-gradient(145deg, rgba(13,22,28,.94), rgba(9,9,15,.9))', boxShadow: '0 30px 80px rgba(0,0,0,.5)' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}><Stack direction="row" spacing={1}><Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#ff2d9b' }} /><Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#facc15' }} /><Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#22d3ee' }} /></Stack><Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,.4)' }}>pixel://mission-control</Typography></Stack>
                                <Box sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'rgba(0,0,0,.34)', border: '1px solid rgba(255,255,255,.06)' }}>
                                    <Typography sx={{ fontFamily: 'monospace', color: '#67e8f9', fontSize: 13 }}>01 / COMMUNITY STATUS</Typography>
                                    <Typography sx={{ mt: 1, fontSize: { xs: '1.7rem', sm: '2.2rem' }, fontWeight: 900 }}>Ideas in. Impact out.</Typography>
                                    <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.55)', lineHeight: 1.65 }}>Choose a track, join a crew and ship something people can use.</Typography>
                                    <Stack spacing={1.5} sx={{ mt: 3 }}>
                                        {tracks.map(({ Icon, title, meta, color }) => <Stack key={title} direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.06)' }}><Box sx={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 2, color, bgcolor: `${color}14` }}><Icon fontSize="small" /></Box><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800, fontSize: 14 }}>{title}</Typography><Typography sx={{ color: 'rgba(255,255,255,.42)', fontSize: 12 }}>{meta}</Typography></Box><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 12px ${color}` }} /></Stack>)}
                                    </Stack>
                                </Box>
                            </Box>
                        </motion.div>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

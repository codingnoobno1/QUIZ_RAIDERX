'use client';

import React from 'react';
import { Box, Typography, Grid, Container, Avatar, Chip } from '@mui/material';
import { GlassCard, SectionTitle } from '@/components/homeui/sections/CommonUI';
import TiltCard from '@/components/homeui/animations/TiltCard';
import { motion } from 'framer-motion';

const facultyMembers = [
    { name: 'Dr. Law Kumar', role: 'Faculty Member' },
    { name: 'Dr. Vishwnath', role: 'Faculty Member' },
    { name: 'Dr. Parampreet Kaur', role: 'Faculty Member' }
];

const studentMembers = [
    { name: 'Komal', role: 'Student Member' },
    { name: 'Lakshay Sharma', role: 'Student Member' },
    { name: 'Anish', role: 'Student Member' },
    { name: 'Jasspreet', role: 'Student Member' },
    { name: 'Tushar', role: 'Student Member' },
    { name: 'Ayachi', role: 'Student Member' },
    { name: 'Pranav Bali', role: 'Student Member' },
    { name: 'Ishan Dua', role: 'Student Member' },
    { name: 'Harks Kaur', role: 'Student Member' },
    { name: 'Ayush Patial', role: 'Student Member' },
    { name: 'Sanchit', role: 'Student Member' },
    { name: 'Parth', role: 'Student Member' },
    { name: 'Pavneet', role: 'Student Member' },
    { name: 'Shivam Goyal', role: 'Student Member' },
    { name: 'Aman Verma', role: 'Student Member' },
    { name: 'Sparsh Chopra', role: 'Student Member' },
    { name: 'Avneet Kaushal', role: 'Student Member' },
    { name: 'Chand Suri', role: 'Student Member' },
    { name: 'Yash Singal', role: 'Student Member' },
    { name: 'Anant Shrivastav', role: 'Student Member' },
    { name: 'Aastik', role: 'Student Member' },
    { name: 'Harshitpal', role: 'Student Member' },
    { name: 'Arnav Gupta', role: 'Student Member' },
    { name: 'Rahul Brajatia', role: 'Student Member' },
];

// Helper to get initials
const getInitials = (name) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

const TeamCard = ({ member, isFaculty }) => {
    const primaryColor = isFaculty ? '#00FFFF' : '#FF1493';
    const secondaryColor = isFaculty ? '#FF1493' : '#00FFFF';

    return (
        <TiltCard style={{ height: '100%' }}>
            <GlassCard sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                p: 0, // Reset padding for custom layout
                position: 'relative',
                height: '100%',
                overflow: 'hidden',
                background: 'rgba(20, 20, 20, 0.6)',
                border: `1px solid rgba(255, 255, 255, 0.08)`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                    borderColor: primaryColor,
                    boxShadow: `0 0 30px ${primaryColor}40`,
                    '& .bg-glow': { opacity: 0.8 },
                    '& .avatar-ring': { transform: 'rotate(180deg) scale(1.1)' }
                }
            }}>
                {/* Background "Glow" blobs */}
                <Box className="bg-glow" sx={{
                    position: 'absolute',
                    top: '-50%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '150%',
                    height: '100%',
                    background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
                    opacity: 0.3,
                    transition: 'opacity 0.5s',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />

                {/* Pixel Brand Logo (Top Right) */}
                <Box sx={{
                    position: 'absolute',
                    top: 15,
                    right: 15,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    {/*  Optional: Add a small text label or just the logo */}
                    <Box sx={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        bgcolor: primaryColor,
                        boxShadow: `0 0 10px ${primaryColor}`
                    }} />
                    <img
                        src="/pixel.jpg"
                        alt="Pixel"
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: `1px solid ${primaryColor}`,
                            opacity: 0.8
                        }}
                    />
                </Box>

                {/* Card Header / Banner Area */}
                <Box sx={{
                    width: '100%',
                    height: '80px',
                    background: `linear-gradient(180deg, ${primaryColor}10 0%, transparent 100%)`,
                    mb: 4
                }} />

                {/* Avatar Section */}
                <Box sx={{ position: 'relative', mt: -8, mb: 2, zIndex: 1 }}>
                    {/* Rotating Rings */}
                    <Box className="avatar-ring" sx={{
                        position: 'absolute',
                        top: -5, left: -5, right: -5, bottom: -5,
                        borderRadius: '50%',
                        borderTop: `2px solid ${primaryColor}`,
                        borderBottom: `2px solid ${secondaryColor}`,
                        borderLeft: '2px solid transparent',
                        borderRight: '2px solid transparent',
                        transition: 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }} />

                    <Avatar
                        sx={{
                            width: 100,
                            height: 100,
                            bgcolor: 'rgba(0,0,0,0.8)',
                            color: '#fff',
                            border: '2px solid rgba(255,255,255,0.1)',
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            fontFamily: "'Space Grotesk', sans-serif",
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}
                    >
                        {getInitials(member.name)}
                    </Avatar>
                </Box>

                {/* Content */}
                <Box sx={{ px: 3, pb: 4, width: '100%', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center' }}>
                    <Typography variant="h5" sx={{
                        fontWeight: 800,
                        color: '#fff',
                        mb: 1,
                        fontFamily: "'Space Grotesk', sans-serif",
                        letterSpacing: '0.5px'
                    }}>
                        {member.name}
                    </Typography>

                    <Chip
                        label={member.role}
                        size="small"
                        sx={{
                            mb: 3,
                            bgcolor: `${primaryColor}15`,
                            color: primaryColor,
                            border: `1px solid ${primaryColor}40`,
                            fontWeight: 600,
                            letterSpacing: '1px',
                            fontFamily: 'monospace'
                        }}
                    />

                    {/* Divider */}
                    <Box sx={{
                        width: '40%',
                        height: '1px',
                        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)`,
                        mb: 3
                    }} />

                    {/* Blank About Section (Placeholder) */}
                    <Box sx={{
                        width: '100%',
                        flex: 1,
                        minHeight: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                            {/* About content pending */}
                        </Typography>
                    </Box>
                </Box>
            </GlassCard>
        </TiltCard>
    );
};

export default function OurTeam() {
    return (
        <Box sx={{
            minHeight: '100vh',
            pt: 15,
            pb: 10,
            background: '#050505',
            backgroundImage: `
                radial-gradient(circle at 15% 50%, rgba(0, 255, 255, 0.05) 0%, transparent 35%),
                radial-gradient(circle at 85% 30%, rgba(255, 20, 147, 0.05) 0%, transparent 35%),
                linear-gradient(to bottom, #000 0%, transparent 100%)
            `,
            backgroundAttachment: 'fixed'
        }}>
            <Container maxWidth="xl">

                {/* Faculty Section */}
                <SectionTitle>Our Mentors</SectionTitle>
                <Grid container spacing={5} justifyContent="center" sx={{ mb: 12 }}>
                    {facultyMembers.map((member, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <TeamCard member={member} isFaculty={true} />
                        </Grid>
                    ))}
                </Grid>

                {/* Student Section */}
                <SectionTitle>Team Members</SectionTitle>
                <Grid container spacing={4}>
                    {studentMembers.map((member, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                            <TeamCard member={member} isFaculty={false} />
                        </Grid>
                    ))}
                </Grid>

            </Container>
        </Box>
    );
}

"use client";
import React from 'react';
import {
    Card,
    Box,
    Typography,
    Chip,
    Stack,
    Button,
    Divider,
    Avatar,
    Grid,
    CircularProgress
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";

export default function PixelEventCard({
    event,
    isRegistered,
    onRegister,
    isRegistering
}) {
    const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    return (
        <Card
            sx={{
                width: 520,
                borderRadius: "28px",
                overflow: "hidden",
                background: "linear-gradient(145deg, rgba(20,20,40,0.95), rgba(10,10,25,0.95))",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(0,255,255,0.12)",
                boxShadow: "0 30px 100px rgba(0,0,0,0.7)",
                transition: "0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                color: "#fff",
                "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 40px 120px rgba(0,255,255,0.2)",
                    border: "1px solid rgba(0,255,255,0.25)",
                },
            }}
        >
            {/* 1️⃣ HERO HEADER */}
            <Box
                sx={{
                    height: 160,
                    position: "relative",
                    backgroundImage: event.imageUrl ? `linear-gradient(to bottom, rgba(15,16,37,0.7), #0f1025), url(${event.imageUrl})` : "linear-gradient(120deg, #0f1025, #1a1b3a)",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    p: 3,
                    display: 'flex',
                    alignItems: 'flex-end',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}
            >
                <Stack direction="row" spacing={2.5} alignItems="center">
                    <Box sx={{
                        p: 0.5,
                        borderRadius: '16px',
                        bgcolor: 'rgba(0,255,255,0.1)',
                        border: '1px solid rgba(0,255,255,0.2)'
                    }}>
                        <Avatar
                            src="/pixel.jpg"
                            sx={{ width: 64, height: 64, borderRadius: '12px' }}
                        />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                            {event.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#00e5ff', fontWeight: 600, letterSpacing: 1 }}>
                            PIXEL INNOVATORS
                        </Typography>
                    </Box>
                </Stack>

                {/* Status Badge */}
                {isRegistered ? (
                    <Chip
                        label="✓ REGISTERED"
                        sx={{
                            position: "absolute",
                            top: 24,
                            right: 24,
                            background: "linear-gradient(135deg, #00ff99, #00c853)",
                            color: "#000",
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            height: 26,
                            boxShadow: '0 4px 12px rgba(0,255,153,0.3)',
                            border: 'none'
                        }}
                    />
                ) : (
                    <Chip
                        label="OPEN"
                        sx={{
                            position: "absolute",
                            top: 24,
                            right: 24,
                            bgcolor: "transparent",
                            color: "#00e5ff",
                            border: "1px solid rgba(0,229,255,0.4)",
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 26,
                        }}
                    />
                )}
            </Box>

            {/* 2️⃣ EVENT INFO SECTION */}
            <Box p={4}>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7, mb: 3 }}>
                    {event.description || "Join the Pixel Innovators for an exclusive session on technical growth and project development."}
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(0,255,255,0.05)', color: '#00e5ff', display: 'flex' }}>
                                <CalendarMonthIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>DATE</Typography>
                                <Typography variant="body2" fontWeight={600}>{eventDate}</Typography>
                            </Box>
                        </Stack>
                    </Grid>
                    <Grid item xs={6}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(0,255,255,0.05)', color: '#00e5ff', display: 'flex' }}>
                                <AccessTimeIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>TIME</Typography>
                                <Typography variant="body2" fontWeight={600}>{event.time}</Typography>
                            </Box>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(0,255,255,0.05)', color: '#00e5ff', display: 'flex' }}>
                                <LocationOnIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>LOCATION</Typography>
                                <Typography variant="body2" fontWeight={600}>{event.location}</Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

                {/* 3️⃣ FOUNDER / LEAD INFO */}
                <Typography variant="overline" sx={{ color: "#00e5ff", fontWeight: 800, letterSpacing: 2, mb: 2, display: 'block' }}>
                    EVENT LEADERSHIP
                </Typography>

                <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'rgba(0,255,255,0.1)', color: '#00e5ff' }}><PersonIcon /></Avatar>
                        <Box>
                            <Typography variant="body2" fontWeight={700}>Tushar</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Founder @ PIXEL</Typography>
                        </Box>
                    </Stack>

                    <Box sx={{ pl: 7 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>+91 7206955546</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <EmailIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>pixel.innovators36@gmail.com</Typography>
                        </Stack>
                    </Box>
                </Stack>

                {/* 4️⃣ ACTION BUTTONS */}
                <Stack direction="row" spacing={2} mt={5}>
                    {!isRegistered ? (
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => onRegister(event)}
                            disabled={isRegistering}
                            sx={{
                                flex: 1.5,
                                borderRadius: '14px',
                                py: 1.8,
                                bgcolor: "#00e5ff",
                                color: "#000",
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                boxShadow: '0 8px 25px rgba(0,229,255,0.3)',
                                '&:hover': {
                                    bgcolor: "#00b2cc",
                                    boxShadow: '0 12px 35px rgba(0,229,255,0.5)',
                                    transform: 'translateY(-2px)'
                                },
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(0,229,255,0.2)',
                                    color: 'rgba(0,0,0,0.4)'
                                }
                            }}
                        >
                            {isRegistering ? <CircularProgress size={24} color="inherit" /> : 'REGISTER NOW'}
                        </Button>
                    ) : (
                        <Button
                            fullWidth
                            variant="contained"
                            disabled
                            sx={{
                                flex: 1.5,
                                borderRadius: '14px',
                                py: 1.8,
                                bgcolor: "rgba(0,255,153,0.1) !important",
                                color: "#00ff99 !important",
                                border: '1px solid rgba(0,255,153,0.3)',
                                fontWeight: 800,
                                textTransform: 'none'
                            }}
                        >
                            Booking Confirmed
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        onClick={onViewPass}
                        sx={{
                            flex: 1,
                            borderRadius: '14px',
                            borderColor: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: '#fff',
                                bgcolor: 'rgba(255,255,255,0.05)'
                            }
                        }}
                    >
                        Pass
                    </Button>
                </Stack>
            </Box>

            {/* 5️⃣ FOOTER STRIP */}
            <Box
                sx={{
                    px: 4,
                    py: 2.5,
                    background: "rgba(0,255,255,0.03)",
                    borderTop: "1px solid rgba(0,255,255,0.08)",
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: 1.5 }}>
                    POWERED BY PIXEL CODING CLUB
                </Typography>
            </Box>
        </Card>
    );
}

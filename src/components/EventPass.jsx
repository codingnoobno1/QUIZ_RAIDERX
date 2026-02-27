"use client";
import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Stack,
    Button,
    IconButton
} from "@mui/material";
import {
    Download as DownloadIcon,
    Close as CloseIcon,
    ConfirmationNumber as TicketIcon,
    Event as EventIcon,
    Group as GroupIcon,
    Person as PersonIcon
} from "@mui/icons-material";

export default function EventPass({ registration, event, onClose }) {
    const passRef = useRef();

    if (!registration || !event) return null;

    const passId = registration.teamId || registration._id;
    const isTeam = registration.registrationType === 'team';

    const handleDownload = () => {
        const svg = document.getElementById("qr-code-svg");
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `Pass-${registration.name}-${event.title}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <Paper
            elevation={24}
            sx={{
                width: { xs: '320px', sm: '380px' },
                borderRadius: "24px",
                overflow: "hidden",
                background: "linear-gradient(135deg, #1e1e2f 0%, #0a0a0f 100%)",
                color: "#fff",
                position: 'relative',
                border: '1px solid rgba(168,85,247,0.3)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(168,85,247,0.2)'
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 3,
                background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <TicketIcon sx={{ color: '#fff' }} />
                    <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 0.5 }}>
                        EVENT PASS
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={{ p: 3 }}>
                {/* Event Name */}
                <Typography variant="h5" fontWeight={800} sx={{ mb: 1, color: '#fff' }}>
                    {event.title}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                    <EventIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(event.date).toLocaleDateString()} | {event.time}
                    </Typography>
                </Stack>

                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

                {/* Participant Details */}
                <Stack spacing={2} sx={{ mb: 4 }}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            {isTeam ? <GroupIcon sx={{ fontSize: 18, color: '#a855f7' }} /> : <PersonIcon sx={{ fontSize: 18, color: '#a855f7' }} />}
                            <Typography variant="caption" sx={{ color: '#a855f7', fontWeight: 800, letterSpacing: 1 }}>
                                {isTeam ? 'TEAM NAME' : 'PARTICIPANT'}
                            </Typography>
                        </Stack>
                        <Typography variant="h6" fontWeight={700}>
                            {isTeam ? registration.teamName : registration.name}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1 }}>
                            ID: {passId}
                        </Typography>
                    </Box>
                </Stack>

                {/* QR Code */}
                <Box
                    sx={{
                        p: 3,
                        bgcolor: '#fff',
                        borderRadius: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mb: 3,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}
                >
                    <QRCodeSVG
                        id="qr-code-svg"
                        value={passId}
                        size={180}
                        level={"H"}
                        includeMargin={false}
                    />
                </Box>

                <Typography variant="caption" align="center" sx={{ display: 'block', color: 'rgba(255,255,255,0.4)', mb: 3 }}>
                    Scanning this grants one-time entry and exit.
                </Typography>

                <Button
                    fullWidth
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    sx={{
                        borderRadius: '12px',
                        py: 1.5,
                        bgcolor: '#a855f7',
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#9333ea' }
                    }}
                >
                    Download PNG
                </Button>
            </Box>

            {/* Footer */}
            <Box sx={{
                py: 2,
                textAlign: 'center',
                bgcolor: 'rgba(255,255,255,0.03)',
                borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: 1 }}>
                    PIXEL INNOVATORS COLLECTIVE
                </Typography>
            </Box>
        </Paper>
    );
}

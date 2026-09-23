"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function QuizHeader({ quiz, timeLeft }) {
    if (!quiz) return null;
    const subject = String(quiz.subjectId?.name || quiz.subject || '').toLowerCase();
    const artwork = /science|physics|chem|bio|environment|math/.test(subject)
        ? '/quiz-assets/science-discovery.png'
        : '/quiz-assets/coding-logic.png';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <Box
                sx={{
                    p: { xs: 2, md: 3 },
                    mb: 3,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                    borderRadius: 4,
                    minHeight: { xs: 150, sm: 176 },
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'var(--quiz-surface)',
                    border: '1px solid var(--quiz-border)',
                    boxShadow: 'var(--quiz-shadow)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 2, maxWidth: { xs: '70%', sm: '62%' } }}>
                    <Typography
                        variant="h4"
                        fontWeight="800"
                        sx={{
                            background: 'linear-gradient(135deg, var(--quiz-primary) 0%, var(--quiz-blue) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5
                        }}
                    >
                        {quiz.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--quiz-text-muted)' }}>
                        {quiz.description || "Testing your foundational knowledge"}
                    </Typography>
                </Box>

                <Box
                    component="img"
                    src={artwork}
                    alt=""
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: { xs: '42%', sm: '38%' },
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.94,
                        maskImage: 'linear-gradient(90deg, transparent 0%, black 35%)',
                        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 35%)'
                    }}
                />

                {timeLeft !== undefined && (
                    <Box
                        sx={{
                            px: 3,
                            py: 1,
                            borderRadius: '50px',
                            zIndex: 3,
                            background: timeLeft < 10 ? 'rgba(244, 67, 54, 0.1)' : 'color-mix(in srgb, var(--quiz-blue) 12%, var(--quiz-surface-solid))',
                            border: `1px solid ${timeLeft < 10 ? 'rgba(244, 67, 54, 0.2)' : 'rgba(96, 165, 250, 0.2)'}`,
                            color: timeLeft < 10 ? '#ef4444' : '#60a5fa',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <span>⏱</span>
                        <span>{timeLeft}s</span>
                    </Box>
                )}
            </Box>
        </motion.div>
    );
}

"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function QuizHeader({ quiz, timeLeft }) {
    if (!quiz) return null;

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
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight="800"
                        sx={{
                            background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5
                        }}
                    >
                        {quiz.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
                        {quiz.description || "Testing your foundational knowledge"}
                    </Typography>
                </Box>

                {timeLeft !== undefined && (
                    <Box
                        sx={{
                            px: 3,
                            py: 1,
                            borderRadius: '50px',
                            background: timeLeft < 10 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(96, 165, 250, 0.1)',
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

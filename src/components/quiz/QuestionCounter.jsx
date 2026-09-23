"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function QuestionCounter({ current, total }) {
    const progress = ((current + 1) / total) * 100;

    return (
        <Box sx={{ mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={1.5}>
                <Box>
                    <Typography variant="caption" sx={{ color: 'var(--quiz-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                        Progress
                    </Typography>
                    <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1, color: 'var(--quiz-text)' }}>
                        Question {current + 1} <span style={{ color: 'var(--quiz-text-muted)', fontWeight: '400' }}>/ {total}</span>
                    </Typography>
                </Box>
                <Typography variant="body2" fontWeight="800" sx={{ color: 'var(--quiz-primary)' }}>
                    {Math.round(progress)}%
                </Typography>
            </Box>

            {/* Custom High-Spec Progress Bar */}
            <Box sx={{ height: 10, width: '100%', bgcolor: 'var(--quiz-soft)', border: '1px solid var(--quiz-border)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                    style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--quiz-primary) 0%, var(--quiz-blue) 100%)',
                        boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)',
                        borderRadius: 5
                    }}
                />
            </Box>
        </Box>
    );
}

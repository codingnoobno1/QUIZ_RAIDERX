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
                    <Typography variant="caption" sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                        Progress
                    </Typography>
                    <Typography variant="h6" fontWeight="800" color="text.primary" sx={{ lineHeight: 1 }}>
                        Question {current + 1} <span style={{ color: '#444', fontWeight: '400' }}>/ {total}</span>
                    </Typography>
                </Box>
                <Typography variant="body2" fontWeight="700" color="primary.light">
                    {Math.round(progress)}%
                </Typography>
            </Box>

            {/* Custom High-Spec Progress Bar */}
            <Box sx={{ height: 10, width: '100%', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                    style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #7c3aed 0%, #3b82f6 100%)',
                        boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)',
                        borderRadius: 5
                    }}
                />
            </Box>
        </Box>
    );
}
